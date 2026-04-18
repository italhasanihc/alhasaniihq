/**
 * netlify/functions/contact.js
 * ─────────────────────────────────────────────────────────────────
 * Al-Hasna Group — alhasani.iq
 * Contact form handler for Netlify Functions.
 *
 * Delivery options (set in Netlify → Environment variables):
 *   • Preferred: RESEND_API_KEY + RESEND_FROM — HTTPS API, works from serverless.
 *   • Fallback:  SMTP_* + MAIL_TO — many shared hosts block SMTP from cloud IPs → 502.
 * ─────────────────────────────────────────────────────────────────
 */

'use strict';

const nodemailer = require('nodemailer');

const ALLOWED_ORIGINS = [
  'https://alhasani.iq',
  'https://www.alhasani.iq',
];

function getCorsOrigin(requestOrigin) {
  if (!requestOrigin) return ALLOWED_ORIGINS[0];
  if (ALLOWED_ORIGINS.includes(requestOrigin)) return requestOrigin;
  if (/^https:\/\/[a-z0-9-]+\.netlify\.app$/.test(requestOrigin)) return requestOrigin;
  return ALLOWED_ORIGINS[0];
}

function buildHeaders(requestOrigin) {
  return {
    'Access-Control-Allow-Origin':  getCorsOrigin(requestOrigin),
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type':                 'application/json',
    'Vary':                         'Origin',
  };
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function blank(v) {
  return !v || typeof v !== 'string' || !v.trim();
}

/** From line for Resend: use full "Name <a@b.com>" or bare email. */
function resendFromLine(resendFrom) {
  const s = String(resendFrom).trim();
  if (s.includes('<')) return s;
  return `"Al-Hasna Group Website" <${s}>`;
}

/** Send via Resend REST API (no SMTP; reliable from Netlify). */
async function sendViaResend(mail) {
  const key = process.env.RESEND_API_KEY;
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from:     mail.from,
      to:       [mail.to],
      reply_to: mail.replyTo,
      subject:  mail.subject,
      text:     mail.text,
      html:     mail.html,
    }),
  });
  const raw = await res.text();
  if (res.ok) return;
  let msg = raw;
  try {
    const j = JSON.parse(raw);
    if (j && j.message) msg = j.message;
  } catch (e) { /* ignore */ }
  console.error('[contact] Resend error', res.status, msg);
  throw new Error(msg || 'Resend send failed');
}

exports.handler = async function (event) {
  const origin  = (event.headers && event.headers.origin) || '';
  const HEADERS = buildHeaders(origin);

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: HEADERS, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: { ...HEADERS, Allow: 'POST' },
      body: JSON.stringify({ ok: false, error: 'Method not allowed.' }),
    };
  }

  let data;
  try {
    data = JSON.parse(event.body || '{}');
  } catch (e) {
    return {
      statusCode: 400,
      headers: HEADERS,
      body: JSON.stringify({ ok: false, error: 'Invalid request.' }),
    };
  }

  if (typeof data._honey === 'string' && data._honey.trim().length > 0) {
    return {
      statusCode: 200,
      headers: HEADERS,
      body: JSON.stringify({ ok: true }),
    };
  }

  const errors = [];

  if (blank(data.name))
    errors.push('Full name is required.');

  if (blank(data.email))
    errors.push('Email address is required.');
  else if (!EMAIL_RE.test(data.email.trim()))
    errors.push('Email address is not valid.');

  if (blank(data.message))
    errors.push('Message is required.');
  else if (data.message.trim().length < 5)
    errors.push('Message is too short.');

  if (errors.length) {
    return {
      statusCode: 422,
      headers: HEADERS,
      body: JSON.stringify({ ok: false, error: errors.join(' ') }),
    };
  }

  const {
    SMTP_HOST,
    SMTP_PORT,
    SMTP_USER,
    SMTP_PASS,
    MAIL_TO,
    RESEND_API_KEY,
    RESEND_FROM,
  } = process.env;

  const useResend = !!(RESEND_API_KEY && RESEND_FROM);

  if (!MAIL_TO) {
    console.error('[contact] MAIL_TO is not set.');
    return {
      statusCode: 500,
      headers: HEADERS,
      body: JSON.stringify({
        ok: false,
        error: 'Server configuration error. Please contact us directly at info@alhasani.iq.',
      }),
    };
  }

  if (!useResend && (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS)) {
    console.error('[contact] Missing SMTP_* or use RESEND_API_KEY + RESEND_FROM.');
    return {
      statusCode: 500,
      headers: HEADERS,
      body: JSON.stringify({
        ok: false,
        error: 'Server configuration error. Please contact us directly at info@alhasani.iq.',
      }),
    };
  }

  const esc = (s) =>
    String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');

  const name    = data.name.trim().slice(0, 120);
  const email   = data.email.trim().slice(0, 254);
  const message = data.message.trim().slice(0, 5000);
  const phone   = (data.phone || '').trim().slice(0, 40);

  const phoneRowHtml = phone
    ? `<tr><td style="padding:16px 0 0;border-top:1px solid #eeeeee;">
         <p style="margin:0 0 4px;font-size:11px;letter-spacing:.15em;
                   text-transform:uppercase;color:#999999;">Phone</p>
         <p style="margin:0;font-size:16px;color:#1a1814;">${esc(phone)}</p>
       </td></tr>`
    : '';

  const phoneText = phone ? `Phone:   ${phone}\n` : '';

  const textBody =
`New contact form message — alhasani.iq

Name:    ${name}
Email:   ${email}
${phoneText}Message:
${message}

─────────────────────────
Sent via https://alhasani.iq`;

  const htmlBody = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
</head>
<body style="margin:0;padding:0;background:#f4f4f4;font-family:Arial,Helvetica,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0"
       style="background:#f4f4f4;padding:40px 0;">
  <tr><td align="center">
    <table width="580" cellpadding="0" cellspacing="0"
           style="background:#ffffff;border-radius:4px;overflow:hidden;
                  box-shadow:0 2px 8px rgba(0,0,0,.08);max-width:580px;">

      <tr><td style="background:#1a1814;padding:28px 36px;">
        <p style="margin:0 0 6px;font-size:10px;letter-spacing:.32em;
                  text-transform:uppercase;color:#c09a52;">
          Al-Hasna Group
        </p>
        <h1 style="margin:0;font-size:20px;font-weight:300;color:#f0ece4;">
          New Contact Form Message
        </h1>
      </td></tr>

      <tr><td style="padding:32px 36px;">
        <table width="100%" cellpadding="0" cellspacing="0">

          <tr><td style="padding-bottom:16px;border-bottom:1px solid #eeeeee;">
            <p style="margin:0 0 4px;font-size:11px;letter-spacing:.15em;
                      text-transform:uppercase;color:#999999;">Full Name</p>
            <p style="margin:0;font-size:16px;color:#1a1814;">${esc(name)}</p>
          </td></tr>

          <tr><td style="padding:16px 0;border-bottom:1px solid #eeeeee;">
            <p style="margin:0 0 4px;font-size:11px;letter-spacing:.15em;
                      text-transform:uppercase;color:#999999;">Email Address</p>
            <p style="margin:0;font-size:16px;">
              <a href="mailto:${esc(email)}"
                 style="color:#c09a52;text-decoration:none;">${esc(email)}</a>
            </p>
          </td></tr>

          ${phoneRowHtml}

          <tr><td style="padding-top:16px;">
            <p style="margin:0 0 8px;font-size:11px;letter-spacing:.15em;
                      text-transform:uppercase;color:#999999;">Message</p>
            <p style="margin:0;font-size:15px;color:#333333;
                      line-height:1.7;white-space:pre-wrap;">${esc(message)}</p>
          </td></tr>

        </table>
      </td></tr>

      <tr><td style="background:#f9f9f9;padding:16px 36px;
                     border-top:1px solid #eeeeee;">
        <p style="margin:0;font-size:11px;color:#aaaaaa;">
          Sent via
          <a href="https://alhasani.iq"
             style="color:#c09a52;text-decoration:none;">alhasani.iq</a>
        </p>
      </td></tr>

    </table>
  </td></tr>
</table>
</body>
</html>`;

  const subject = `New Contact — ${name}`;

  const mail = {
    from:    useResend
      ? resendFromLine(RESEND_FROM)
      : `"Al-Hasna Group Website" <${SMTP_USER}>`,
    to:      MAIL_TO,
    replyTo: email,
    subject: subject,
    text:    textBody,
    html:    htmlBody,
  };

  try {
    if (useResend) {
      await sendViaResend(mail);
      console.log(`[contact] ✓ Resend ok from ${email}`);
    } else {
      const port   = parseInt(SMTP_PORT, 10);
      const secure = port === 465;

      const transporter = nodemailer.createTransport({
        host:              SMTP_HOST,
        port:              port,
        secure:            secure,
        auth:              { user: SMTP_USER, pass: SMTP_PASS },
        connectionTimeout: 15000,
        greetingTimeout:   10000,
        socketTimeout:     15000,
        family:            4,
        tls:               { minVersion: 'TLSv1.2' },
        requireTLS:        !secure,
      });

      await transporter.sendMail(mail);
      console.log(`[contact] ✓ SMTP sent from ${email}`);
    }

    return {
      statusCode: 200,
      headers: HEADERS,
      body: JSON.stringify({ ok: true }),
    };
  } catch (err) {
    const code = err && (err.code || err.responseCode);
    const smtp = err && err.response;
    console.error(
      '[contact] ✗ send failed:',
      err && err.message ? err.message : err,
      code ? `code=${code}` : '',
      smtp ? `smtp=${smtp}` : ''
    );
    return {
      statusCode: 502,
      headers: HEADERS,
      body: JSON.stringify({
        ok: false,
        error:
          'Could not send your message. Please try again later or email info@alhasani.iq directly.',
      }),
    };
  }
};
