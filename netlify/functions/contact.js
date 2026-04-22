// netlify/functions/contact.js
const nodemailer = require("nodemailer");

const JSON_HEADERS = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: JSON_HEADERS, body: "" };
  }

  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers: JSON_HEADERS,
      body: JSON.stringify({ ok: false, error: "Method not allowed" }),
    };
  }

  let data;
  try {
    data = JSON.parse(event.body || "{}");
  } catch (err) {
    return {
      statusCode: 400,
      headers: JSON_HEADERS,
      body: JSON.stringify({ ok: false, error: "Invalid JSON body" }),
    };
  }

  const name    = (data.name    || "").toString().trim();
  const email   = (data.email   || "").toString().trim();
  const phone   = (data.phone   || "").toString().trim();
  const message = (data.message || "").toString().trim();
  const honey   = (data._honey  || "").toString().trim();

  // Honeypot — silently accept so bots don't retry
  if (honey) {
    return { statusCode: 200, headers: JSON_HEADERS, body: JSON.stringify({ ok: true }) };
  }

  if (!name || !email || !message) {
    return {
      statusCode: 400,
      headers: JSON_HEADERS,
      body: JSON.stringify({ ok: false, error: "Name, email, and message are required." }),
    };
  }
  if (name.length > 100 || email.length > 200 || phone.length > 30 || message.length > 2000) {
    return {
      statusCode: 400,
      headers: JSON_HEADERS,
      body: JSON.stringify({ ok: false, error: "Input exceeds allowed length." }),
    };
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return {
      statusCode: 400,
      headers: JSON_HEADERS,
      body: JSON.stringify({ ok: false, error: "Valid email required." }),
    };
  }
  if (message.length < 10) {
    return {
      statusCode: 400,
      headers: JSON_HEADERS,
      body: JSON.stringify({ ok: false, error: "Message too short." }),
    };
  }

  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, MAIL_FROM, MAIL_TO } = process.env;
  if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS || !MAIL_FROM || !MAIL_TO) {
    console.error("Missing required SMTP env vars");
    return {
      statusCode: 500,
      headers: JSON_HEADERS,
      body: JSON.stringify({ ok: false, error: "Server email configuration is incomplete." }),
    };
  }

  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT),
    secure: true, // SSL on port 465
    auth: { user: SMTP_USER, pass: SMTP_PASS },
    tls: { minVersion: "TLSv1.2" },
    connectionTimeout: 15000,
    greetingTimeout: 15000,
    socketTimeout: 20000,
  });

  const esc = (s) =>
    String(s).replace(/[&<>"']/g, (c) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
    }[c]));

  const subject = `New contact form submission — ${name}`;
  const text =
`New message from the Al-Hasna Group website

Name:    ${name}
Email:   ${email}
Phone:   ${phone || "-"}

Message:
${message}
`;
  const html = `
    <div style="font-family:Arial,Helvetica,sans-serif;color:#222;max-width:640px">
      <h2 style="margin:0 0 16px;border-bottom:2px solid #c8a96e;padding-bottom:8px">
        New contact form submission
      </h2>
      <p><strong>Name:</strong> ${esc(name)}</p>
      <p><strong>Email:</strong> <a href="mailto:${esc(email)}">${esc(email)}</a></p>
      <p><strong>Phone:</strong> ${esc(phone) || "-"}</p>
      <p><strong>Message:</strong></p>
      <p style="white-space:pre-wrap;background:#f8f6f1;padding:14px;border-left:3px solid #c8a96e">
        ${esc(message)}
      </p>
    </div>
  `;

  try {
    await transporter.verify();
    const info = await transporter.sendMail({
      from: `"Al-Hasna Website" <${MAIL_FROM}>`,
      to: MAIL_TO,
      replyTo: `"${name}" <${email}>`,
      subject,
      text,
      html,
    });

    console.log("Email sent:", info.messageId);

    return {
      statusCode: 200,
      headers: JSON_HEADERS,
      body: JSON.stringify({ ok: true, message: "Message sent successfully." }),
    };
  } catch (err) {
    console.error("SMTP send failed:", err && err.message, err);
    return {
      statusCode: 502,
      headers: JSON_HEADERS,
      body: JSON.stringify({ ok: false, error: "Failed to send message. Please try again later." }),
    };
  }
};