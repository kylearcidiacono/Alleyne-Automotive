const nav = document.querySelector('.nav');
const btn = document.querySelector('.menu-btn');
const menu = document.getElementById('menu');

function setMenu(open) {
  menu.classList.toggle('open', open);
  nav.classList.toggle('menu-open', open);
  btn.setAttribute('aria-expanded', open);
}
btn.addEventListener('click', () => setMenu(!menu.classList.contains('open')));
document.documentElement.classList.add('menu-ready');
menu.addEventListener('click', e => {
  if (e.target.tagName === 'A') setMenu(false);
});
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && menu.classList.contains('open')) {
    setMenu(false);
    btn.focus();
  }
});

if (!nav.classList.contains('solid')) {
  const sentinel = document.createElement('div');
  sentinel.style.cssText = 'position:absolute;top:0;left:0;width:1px;height:48px;pointer-events:none';
  document.body.prepend(sentinel);
  new IntersectionObserver(([e]) => nav.classList.toggle('scrolled', !e.isIntersecting)).observe(sentinel);
}

const videos = [...document.querySelectorAll('video')];
if (videos.length) {
  const toggle = document.createElement('button');
  toggle.className = 'motion-toggle';
  toggle.type = 'button';
  const setPlaying = playing => {
    videos.forEach(v => (playing ? v.play().catch(() => {}) : v.pause()));
    toggle.textContent = playing ? 'Pause video' : 'Play video';
    toggle.setAttribute('aria-pressed', !playing);
  };
  toggle.addEventListener('click', () => setPlaying(toggle.textContent === 'Play video'));
  document.body.append(toggle);
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  videos.forEach(v => reduce && v.removeAttribute('autoplay'));
  setPlaying(!reduce);
}

const tabItems = [...document.querySelectorAll('.tab-item')];
const tabImgs = [...document.querySelectorAll('.tab-view video')];
const setTab = i => {
  tabItems.forEach((el, n) => el.classList.toggle('on', n === i));
  tabImgs.forEach((el, n) => el.classList.toggle('on', n === i));
};
tabItems.forEach((el, i) => {
  el.addEventListener('mouseenter', () => setTab(i));
  el.addEventListener('focus', () => setTab(i));
});

const io = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.classList.add('in');
      io.unobserve(e.target);
    }
  });
}, { threshold: 0.15 });
document.querySelectorAll('.reveal').forEach(el => io.observe(el));


const form = document.getElementById('enquiry-form');
if (form) {
  const status = document.getElementById('form-status');
  const button = form.querySelector('button[value="email"]');
  const preference = document.getElementById('contact-preference');
  const phone = document.getElementById('phone');
  const updatePhone = () => { phone.required = preference.value === 'phone'; };
  preference.addEventListener('change', updatePhone);
  updatePhone();
  let widget;
  const unavailable = () => { status.textContent = 'Sending by email is currently unavailable. You can still use WhatsApp or the contact details below.'; button.disabled = true; };
  fetch('/api/enquiry/config').then(r => r.ok ? r.json() : Promise.reject()).then(config => {
    if (!config.siteKey) return unavailable();
    const script = document.createElement('script');
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
    script.onload = () => { widget = window.turnstile.render('#turnstile', { sitekey: config.siteKey }); };
    script.onerror = unavailable;
    document.head.append(script);
  }).catch(unavailable);
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (event.submitter && event.submitter.value === 'whatsapp') {
      const data = new FormData(form);
      const message = [
        'Hello Alleyne Automotive, I would like to make an enquiry.',
        '',
        `Name: ${data.get('name')}`,
        `Email: ${data.get('email')}`,
        `Phone: ${data.get('phone') || 'Not provided'}`,
        `Preferred contact: ${data.get('contact_preference') === 'phone' ? 'Phone' : 'Email'}`,
        `Vehicle or budget: ${data.get('vehicle') || 'Not provided'}`,
        '',
        `Enquiry: ${data.get('message')}`
      ].join('\n');
      window.open('https://wa.me/447497095845?text=' + encodeURIComponent(message), '_blank', 'noopener,noreferrer');
      status.textContent = 'Review and send your message in WhatsApp.';
      return;
    }
    const token = widget !== undefined && window.turnstile.getResponse(widget);
    if (!token) { status.textContent = 'Please complete the spam protection check before sending.'; return; }
    button.disabled = true;
    status.textContent = 'Sending your enquiry?';
    try {
      const response = await fetch(form.action, { method: 'POST', body: new FormData(form) });
      if (!response.ok) throw new Error('Delivery unavailable');
      form.reset();
      updatePhone();
      status.textContent = 'Your enquiry has been sent. Thank you.';
    } catch { status.textContent = 'Your enquiry could not be sent. Please try again or contact us using the details above.'; }
    finally { window.turnstile.reset(widget); button.disabled = false; }
  });
}
