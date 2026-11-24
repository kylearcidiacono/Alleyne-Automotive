# Enquiry setup and launch handover

This is an unlaunched development configuration. The temporary site sends `X-Robots-Tag: noindex, nofollow`. Before public launch, remove that header only after selecting the final domain and adding the matching canonical URLs and sitemap.

Run `node build.mjs` before using Wrangler; only site assets are copied to `dist`. The Worker is routed for `/api/*`; confirm existing Cloudflare build settings and project identity before changing deployment configuration.

Create a Cloudflare Turnstile widget for the authorised hostnames, and a transactional email account with a verified sending domain. Configure `TURNSTILE_SITE_KEY` and `ENQUIRY_FROM` as Worker variables; set `TURNSTILE_SECRET` and `RESEND_API_KEY` as Worker secrets, not in source control. The recipient is alleyneautomotive@gmail.com. Turnstile and the email provider process enquiry information: confirm their data handling, retention and privacy wording with the client before launch. Record any third-party costs and account ownership.

Until configured, the form reports that it is unavailable; customers can call, email or use WhatsApp. Test an agreed safe enquiry end-to-end and confirm receipt and reply in the inbox. Monitor delivery errors and provider limits without storing enquiry contents in logs. The old `/enquire.html` path redirects to `/contact.html` using Cloudflare static redirects.

Before launch, confirm registered office, deposit and distance-sale practices, complaints process, retention, image/video/logo permissions, data processors and consent requirements. Obtain a UK legal review. Previous main commit e9a4dfc and current main before this work are available in Git history; verify the deployed version and rollback procedure before release. Deploy only with explicit authorisation.

## Added stock photography

- Carlos Mazorra, car interior: https://www.pexels.com/photo/inside-of-a-car-20476286/
- Antonio Filigno, black-and-white car detail: https://www.pexels.com/photo/black-and-white-abstract-photo-of-a-vehicle-with-exhaust-pipe-10508827/
- Pexels licence: https://www.pexels.com/license/ . Check third-party rights and avoid implying endorsement or that photographs show actual stock.
