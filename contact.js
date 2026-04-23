/**
 * AL-HASANI GROUP — Contact Form Mailer (Netlify Function)
 *
 * Runtime : Netlify Functions (AWS Lambda, Node.js 20)
 * SMTP    : securemail.aplus.net:465 (SSL/TLS)
 * Endpoint: POST /.netlify/functions/contact
 *
 * Environment variables (set in Netlify dashboard):
 *   SMTP_HOST    securemail.aplus.net
 *   SMTP_PORT    465
 *   SMTP_USER    info@alhasani.iq
 *   SMTP_PASS    <mailbox password>
 *   MAIL_TO      info@alhasani.iq            (optional; defaults to SMTP_USER)
 *   ALLOWED_ORIGINS  https://alhasani.iq,https://www.alhasani.iq   (optional)
 */

'use strict';

const nodemailer = require('nodemailer');

/* ─────────────────────────────────────────────
   CONFIG — all from environment
───────────────────────────────────────────── */
const SMTP_HOST = process.env.SMTP_HOST || 'securemail.aplus.net';
const SMTP_PORT = parseInt(process.env.SMTP_PORT || '465', 10);
const SMTP_USER = process.env.SMTP_USER || '';
const SMTP_PASS = process.env.SMTP_PASS || '';
const MAIL_TO   = process.env.MAIL_TO   || SMTP_USER;
const MAIL_FROM = `"Al-Hasani Group Website" <${SMTP_USER}>`;

const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS ||
  'https://alhasani.iq,https://www.alhasani.iq'
).split(',').map(s => s.trim());

/* ─────────────────────────────────────────────
   SIMPLE IN-MEMORY RATE LIMIT
   Note: Netlify Functions are stateless between
   cold starts, so this is best-effort only.
   A motivated attacker can bypass it — for stronger
   limits use Netlify's built-in edge rate limits
   or a service like Upstash Redis.
───────────────────────────────────────────── */
const rateStore = new Map();
const RATE_WINDOW_MS = 15 * 60 * 1000;  // 15 min
const RATE_MAX       = 5;                // submissions per IP per window

function rateLimited(ip) {
  const now  = Date.now();
  const rec  = rateStore.get(ip) || { count: 0, reset: now + RATE_WINDOW_MS };
  if (now > rec.reset) { rec.count = 0; rec.reset = now + RATE_WINDOW_MS; }
  rec.count += 1;
  rateStore.set(ip, rec);
  return rec.count > RATE_MAX;
}

/* ─────────────────────────────────────────────
   SANITIZATION + VALIDATION
───────────────────────────────────────────── */
function sanitize(val) {
  if (typeof val !== 'string') return '';
  return val
    .replace(/<[^>]*>/g, '')
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    .trim()
    .slice(0, 2000);
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function validate(body) {
  const errors  = [];
  const name    = sanitize(body.name    || '');
  const email   = sanitize(body.email   || '');
  const message = sanitize(body.message || '');

  if (!name || name.length < 2)
    errors.push('Name is required (min 2 characters).');
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email))
    errors.push('A valid email address is required.');
  if (!message || message.length < 10)
    errors.push('Message is required (min 10 characters).');

  return { errors, name, email, message };
}

/* ─────────────────────────────────────────────
   CORS HEADERS
───────────────────────────────────────────── */
function corsHeaders(origin) {
  const allowed = ALLOWED_ORIGINS.includes(origin);
  return {
    'Access-Control-Allow-Origin':  allowed ? origin : ALLOWED_ORIGINS[0],
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Vary':                         'Origin',
    'Content-Type':                 'application/json',
  };
}

/* ─────────────────────────────────────────────
   NODEMAILER TRANSPORT (reused across invocations
   when Lambda container is warm)
───────────────────────────────────────────── */
let _transporter = null;
function getTransporter() {
  if (_transporter) return _transporter;
  _transporter = nodemailer.createTransport({
    host:   SMTP_HOST,
    port:   SMTP_PORT,
    secure: SMTP_PORT === 465,   // 465 = implicit TLS, 587 = STARTTLS
    auth:   { user: SMTP_USER, pass: SMTP_PASS },
    tls:    { rejectUnauthorized: true },
  });
  return _transporter;
}

/* ─────────────────────────────────────────────
   HANDLER
───────────────────────────────────────────── */
exports.handler = async (event) => {
  const origin  = event.headers.origin || event.headers.Origin || '';
  const headers = corsHeaders(origin);

  /* Preflight */
  if (event.httpMethod === 'OPTIONS')
    return { statusCode: 204, headers, body: '' };

  if (event.httpMethod !== 'POST')
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ success: false, error: 'Method not allowed' }),
    };

  /* Rate limit by client IP (Netlify passes it in x-nf-client-connection-ip) */
  const ip =
    event.headers['x-nf-client-connection-ip'] ||
    event.headers['x-forwarded-for']?.split(',')[0].trim() ||
    'unknown';

  if (rateLimited(ip))
    return {
      statusCode: 429,
      headers,
      body: JSON.stringify({
        success: false,
        error:   'Too many requests. Please try again later.',
      }),
    };

  /* Parse JSON */
  let body;
  try {
    body = JSON.parse(event.body || '{}');
  } catch {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ success: false, error: 'Invalid JSON.' }),
    };
  }

  /* Honeypot — silently accept */
  if (body._honey)
    return { statusCode: 200, headers, body: JSON.stringify({ success: true }) };

  /* Validate */
  const { errors, name, email, message } = validate(body);
  if (errors.length)
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ success: false, errors }),
    };

  /* Build email */
  const now = new Date().toLocaleString('en-GB', {
    timeZone: 'Asia/Baghdad',
    dateStyle: 'full',
    timeStyle: 'short',
  });

  const textBody = [
    'New contact form submission — Al-Hasani Group',
    '─'.repeat(48),
    `Date:    ${now}`,
    `Name:    ${name}`,
    `Email:   ${email}`,
    '─'.repeat(48),
    'Message:',
    message,
    '─'.repeat(48),
    'Sent via alhasani.iq contact form',
  ].join('\n');

  const htmlBody = `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"><title>New Contact</title></head>
<body style="margin:0;padding:0;background:#f5f5f0;font-family:Georgia,serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f0;padding:40px 20px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border:1px solid #e0d9cc;">
  <tr><td style="background:#0a0a0a;padding:32px 40px;text-align:center;">
    <p style="margin:0;font-family:Georgia,serif;font-size:11px;letter-spacing:4px;color:#c9a96e;text-transform:uppercase;">Al-Hasani Group</p>
    <p style="margin:8px 0 0;font-family:Georgia,serif;font-size:22px;color:#ffffff;font-weight:400;">New Contact Inquiry</p>
  </td></tr>
  <tr><td style="padding:40px;">
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr><td style="padding:12px 0;border-bottom:1px solid #f0ece4;">
        <p style="margin:0;font-size:11px;letter-spacing:2px;color:#999;text-transform:uppercase;">Date</p>
        <p style="margin:4px 0 0;font-size:15px;color:#1a1a1a;">${escapeHtml(now)}</p>
      </td></tr>
      <tr><td style="padding:12px 0;border-bottom:1px solid #f0ece4;">
        <p style="margin:0;font-size:11px;letter-spacing:2px;color:#999;text-transform:uppercase;">Name</p>
        <p style="margin:4px 0 0;font-size:15px;color:#1a1a1a;">${escapeHtml(name)}</p>
      </td></tr>
      <tr><td style="padding:12px 0;border-bottom:1px solid #f0ece4;">
        <p style="margin:0;font-size:11px;letter-spacing:2px;color:#999;text-transform:uppercase;">Email</p>
        <p style="margin:4px 0 0;font-size:15px;color:#1a1a1a;">
          <a href="mailto:${escapeHtml(email)}" style="color:#c9a96e;">${escapeHtml(email)}</a>
        </p>
      </td></tr>
      <tr><td style="padding:12px 0;">
        <p style="margin:0;font-size:11px;letter-spacing:2px;color:#999;text-transform:uppercase;">Message</p>
        <p style="margin:4px 0 0;font-size:15px;color:#1a1a1a;line-height:1.7;white-space:pre-wrap;">${escapeHtml(message)}</p>
      </td></tr>
    </table>
  </td></tr>
  <tr><td style="padding:0 40px 40px;">
    <a href="mailto:${escapeHtml(email)}?subject=Re: Your inquiry to Al-Hasani Group"
       style="display:inline-block;background:#0a0a0a;color:#c9a96e;font-family:Georgia,serif;font-size:12px;letter-spacing:3px;text-transform:uppercase;text-decoration:none;padding:14px 28px;">
      Reply to ${escapeHtml(name)} &rarr;
    </a>
  </td></tr>
  <tr><td style="background:#f8f6f1;padding:20px 40px;border-top:1px solid #e0d9cc;">
    <p style="margin:0;font-size:11px;color:#999;text-align:center;">
      Sent via alhasani.iq contact form &middot; Baghdad, Iraq
    </p>
  </td></tr>
</table>
</td></tr></table>
</body></html>`;

  /* Send */
  try {
    const info = await getTransporter().sendMail({
      from:    MAIL_FROM,
      to:      MAIL_TO,
      replyTo: `"${name}" <${email}>`,
      subject: `New Contact: ${name} — Al-Hasani Group Website`,
      text:    textBody,
      html:    htmlBody,
    });

    console.log(`[${now}] Mail sent — ${info.messageId} | From: ${email}`);
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true, messageId: info.messageId }),
    };
  } catch (err) {
    console.error(`[MAIL ERROR] ${err.message}`);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error:   'Mail delivery failed. Please email us directly at info@alhasani.iq',
      }),
    };
  }
};