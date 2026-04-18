/**
 * netlify/functions/contact.js
 * ─────────────────────────────────────────────────────────────────
 * Al-Hasna Group — alhasani.iq
 * Secure server-side contact form email handler.
 *
 * Runs inside Netlify Functions (Node.js). Never executed in the
 * browser. All SMTP credentials are read exclusively from Netlify
 * environment variables — nothing is hardcoded here.
 * ─────────────────────────────────────────────────────────────────
 */

'use strict';

const nodemailer = require('nodemailer');

/* ── Allowed origins ──────────────────────────────────────────────
   Accepts requests from the custom domain and the Netlify subdomain.
   The '*' fallback ensures the function still works during staging.
──────────────────────────────────────────────────────────────────── */
const ALLOWED_ORIGINS = [
  'https://alhasani.iq',
  'https://www.alhasani.iq',
];

function getCorsOrigin(requestOrigin) {
  if (!requestOrigin) return ALLOWED_ORIGINS[0];
  if (ALLOWED_ORIGINS.includes(requestOrigin)) return requestOrigin;
  /* Allow any *.netlify.app subdomain for preview deployments */
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

/* ── Email regex ──────────────────────────────────────────────────── */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function blank(v) {
  return !v || typeof v !== 'string' || !v.trim();
}

/* ── Main handler ─────────────────────────────────────────────────── */
exports.handler = async function (event) {
  const origin  = (event.headers && event.headers.origin) || '';
  const HEADERS = buildHeaders(origin);

  /* ── CORS preflight ───────────────────────────────────────────── */
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: HEADERS, body: '' };
  }

  /* ── Only POST ────────────────────────────────────────────────── */
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: { ...HEADERS, Allow: 'POST' },
      body: JSON.stringify({ ok: false, error: 'Method not allowed.' }),
    };
  }

  /* ── Parse JSON body ──────────────────────────────────────────── */
  let data;
  try {
    data = JSON.parse(event.body || '{}');
  } catch {
    return {
      statusCode: 400,
      headers: HEADERS,
      body: JSON.stringify({ ok: false, error: 'Invalid request.' }),
    };
  }

  /* ── Honeypot — silent success, bots get no useful feedback ───── */
  if (typeof data._honey === 'string' && data._honey.trim().length > 0) {
    return {
      statusCode: 200,
      headers: HEADERS,
      body: JSON.stringify({ ok: true }),
    };
  }

  /* ── Server-side field validation ────────────────────────────── */
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

  /* ── Read credentials from Netlify environment ────────────────── */
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, MAIL_TO } = process.env;

  if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS || !MAIL_TO) {
    console.error('[contact] Missing one or more required environment variables.');
    return {
      statusCode: 500,
      headers: HEADERS,
      body: JSON.stringify({
        ok: false,
        error: 'Server configuration error. Please contact us directly at info@alhasani.iq.',
      }),
    };
  }

  /* ── Sanitize values for safe use in HTML email body ─────────── */
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

  /* ── Nodemailer transporter ───────────────────────────────────── */
  const port   = parseInt(SMTP_PORT, 10);
  const secure = port === 465;   /* SSL for 465, STARTTLS for 587 */

  const transporter = nodemailer.createTransport({
    host:              SMTP_HOST,                   /* securemail.aplus.net */
    port:              port,                        /* 465                  */
    secure:            secure,                      /* true                 */
    auth:              { user: SMTP_USER, pass: SMTP_PASS },
    connectionTimeout: 15000,
    greetingTimeout:   10000,
    socketTimeout:     15000,
    /* Prefer IPv4 — Netlify → SMTP often fails on IPv6-only paths to some hosts */
    family:            4,
    tls:               { minVersion: 'TLSv1.2' },
    requireTLS:        !secure,
  });

  /* ── Build email ──────────────────────────────────────────────── */
  const phoneRowHtml = phone
    ? `<tr><td style="padding:16px 0 0;border-top:1px solid #eeeeee;">
         <p style="margin:0 0 4px;font-size:11px;letter-spacing:.15em;
                   text-transform:uppercase;color:#999999;">Phone</p>
         <p style="margin:0;font-size:16px;color:#1a1814;">${esc(phone)}</p>
       </td></tr>`
    : '';

  const phoneText = phone ? `Phone:   ${phone}\n` : '';

  const mailOptions = {
    from:    `"Al-Hasna Group Website" <${SMTP_USER}>`,
    to:      MAIL_TO,
    replyTo: email,
    subject: `New Contact — ${name}`,

    /* Plain-text fallback */
    text:
`New contact form message — alhasani.iq

Name:    ${name}
Email:   ${email}
${phoneText}Message:
${message}

─────────────────────────
Sent via https://alhasani.iq`,

    /* HTML email */
    html: `<!DOCTYPE html>
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

      <!-- Header -->
      <tr><td style="background:#1a1814;padding:28px 36px;">
        <p style="margin:0 0 6px;font-size:10px;letter-spacing:.32em;
                  text-transform:uppercase;color:#c09a52;">
          Al-Hasna Group
        </p>
        <h1 style="margin:0;font-size:20px;font-weight:300;color:#f0ece4;">
          New Contact Form Message
        </h1>
      </td></tr>

      <!-- Body -->
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

      <!-- Footer -->
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
</html>`,
  };

  /* ── Send ─────────────────────────────────────────────────────── */
  try {
    await transporter.sendMail(mailOptions);
    console.log(`[contact] ✓ sent from ${email}`);
    return {
      statusCode: 200,
      headers: HEADERS,
      body: JSON.stringify({ ok: true }),
    };
  } catch (err) {
    console.error('[contact] ✗ SMTP error:', err && err.message ? err.message : err);
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