// The static website is served by the Assets binding; only enquiry routes reach this Worker.
const json = (data, status = 200) => new Response(JSON.stringify(data), {
  status, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' }
});

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === '/api/enquiry/config' && request.method === 'GET') {
      return json({ siteKey: env.TURNSTILE_SITE_KEY && env.TURNSTILE_SECRET && env.RESEND_API_KEY && env.ENQUIRY_FROM && env.ENQUIRY_RATE_LIMIT ? env.TURNSTILE_SITE_KEY : '' });
    }
    if (url.pathname !== '/api/enquiry') return new Response('Not found', { status: 404 });
    if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405);
    if (request.headers.get('Origin') !== url.origin) return json({ error: 'Invalid origin' }, 403);
    if (!env.TURNSTILE_SECRET || !env.RESEND_API_KEY || !env.ENQUIRY_FROM || !env.TURNSTILE_SITE_KEY) return json({ error: 'Service unavailable' }, 503);
    const ip = request.headers.get('CF-Connecting-IP');
    if (!ip || !env.ENQUIRY_RATE_LIMIT) return json({ error: 'Service unavailable' }, 503);
    try {
      const limit = await env.ENQUIRY_RATE_LIMIT.limit({ key: ip });
      if (!limit.success) return json({ error: 'Please try again later' }, 429);
    } catch { return json({ error: 'Service unavailable' }, 503); }
    const length = Number(request.headers.get('content-length') || 0);
    if (length > 16384) return json({ error: 'Request too large' }, 413);
    let form;
    try {
      if (!request.body) return json({ error: 'Invalid request' }, 400);
      const reader = request.body.getReader();
      const chunks = [];
      let total = 0;
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        total += value.byteLength;
        if (total > 16384) { await reader.cancel(); return json({ error: 'Request too large' }, 413); }
        chunks.push(value);
      }
      const bytes = new Uint8Array(total);
      let offset = 0;
      for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
      form = await new Request(request.url, { method: 'POST', headers: { 'Content-Type': request.headers.get('Content-Type') || '' }, body: bytes }).formData();
    } catch { return json({ error: 'Invalid request' }, 400); }
    const value = key => typeof form.get(key) === 'string' ? form.get(key).trim() : '';
    const name = value('name'), email = value('email'), phone = value('phone'), preference = value('contact_preference'), vehicle = value('vehicle'), message = value('message'), token = value('cf-turnstile-response');
    if (!name || name.length > 100 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254 || phone.length > 40 || !['email', 'phone'].includes(preference) || (preference === 'phone' && !phone) || vehicle.length > 200 || !message || message.length > 3000 || !token || token.length > 2048 || /[\r\n]/.test(email)) return json({ error: 'Invalid fields' }, 400);
    try {
      const check = new URLSearchParams({ secret: env.TURNSTILE_SECRET, response: token });
      if (ip) check.set('remoteip', ip);
      const verified = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method: 'POST', body: check, signal: AbortSignal.timeout(10000) });
      const result = await verified.json();
      if (!verified.ok || !result.success || result.hostname !== url.hostname) return json({ error: 'Spam check failed' }, 403);
      const sent = await fetch('https://api.resend.com/emails', {
        method: 'POST', signal: AbortSignal.timeout(10000), headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ from: env.ENQUIRY_FROM, to: ['alleyneautomotive@gmail.com'], reply_to: email, subject: 'New website enquiry', text: `Name: ${name}\nEmail: ${email}\nPhone: ${phone || 'Not provided'}\nPreferred contact: ${preference === 'phone' ? 'Phone' : 'Email'}\nVehicle or budget: ${vehicle || 'Not provided'}\n\nEnquiry:\n${message}` })
      });
      if (!sent.ok) { console.error('enquiry_provider_error', sent.status); return json({ error: 'Delivery unavailable' }, 502); }
      return json({ ok: true });
    } catch { console.error('enquiry_external_service_error'); return json({ error: 'Service unavailable' }, 502); }
  }
};
