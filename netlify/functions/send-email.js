// Netlify Function: send-email
// Sends transactional emails via nodemailer (SMTP / Gmail)
//
// Required environment variables in Netlify dashboard:
//   EMAIL_HOST      — SMTP host, e.g. smtp.gmail.com
//   EMAIL_PORT      — SMTP port, e.g. 587
//   EMAIL_USER      — SMTP username / Gmail address
//   EMAIL_PASS      — SMTP password / Gmail App Password
//   EMAIL_FROM_NAME — Sender display name, e.g. "Aligarh Attars"
//   EMAIL_FROM_ADDR — Sender address, e.g. no-reply@aligarhattars.com
//   SITE_URL        — Your live site URL, e.g. https://aligarhattars.com

const nodemailer = require('nodemailer');

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// ── Email HTML templates ─────────────────────────────────────────────────────

function baseTemplate(content, siteName) {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${siteName}</title>
</head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" style="max-width:480px;background:#111111;border-radius:16px;overflow:hidden;border:1px solid #222;">
          <!-- Header -->
          <tr>
            <td style="padding:32px 32px 24px;border-bottom:1px solid #222;">
              <p style="margin:0;font-size:18px;font-weight:700;color:#ffffff;letter-spacing:-0.3px;">${siteName}</p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:32px;">
              ${content}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:20px 32px;border-top:1px solid #222;">
              <p style="margin:0;font-size:12px;color:#555;line-height:1.6;">
                You're receiving this email because you have an account with ${siteName}.<br/>
                If you didn't request this, you can safely ignore it.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function welcomeTemplate(name, siteName) {
  return baseTemplate(`
    <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#ffffff;">Welcome, ${name}!</h1>
    <p style="margin:0 0 24px;font-size:15px;color:#888;line-height:1.6;">Your account has been created. We're glad you're here.</p>
    <p style="margin:0 0 8px;font-size:14px;color:#666;line-height:1.6;">
      Check your inbox — you may have a separate verification email from us. Please verify your email address to unlock all features.
    </p>
  `, siteName);
}

function resetTemplate(siteUrl, siteName) {
  return baseTemplate(`
    <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#ffffff;">Password Reset</h1>
    <p style="margin:0 0 24px;font-size:15px;color:#888;line-height:1.6;">
      We received a request to reset your password. Click the button below — the link expires in 1 hour.
    </p>
    <a href="${siteUrl}/auth?mode=forgot"
       style="display:inline-block;background:#ffffff;color:#000000;text-decoration:none;font-size:14px;font-weight:600;padding:14px 28px;border-radius:10px;">
      Reset Password
    </a>
    <p style="margin:24px 0 0;font-size:13px;color:#555;line-height:1.6;">
      If you didn't request a password reset, you can ignore this email. Your password won't change.
    </p>
  `, siteName);
}

function verificationTemplate(verifyUrl, siteName) {
  return baseTemplate(`
    <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#ffffff;">Verify your email</h1>
    <p style="margin:0 0 24px;font-size:15px;color:#888;line-height:1.6;">
      Click below to confirm your email address and activate your account.
    </p>
    <a href="${verifyUrl}"
       style="display:inline-block;background:#ffffff;color:#000000;text-decoration:none;font-size:14px;font-weight:600;padding:14px 28px;border-radius:10px;">
      Verify Email
    </a>
    <p style="margin:24px 0 0;font-size:13px;color:#555;line-height:1.6;">
      This link expires in 24 hours. If you didn't create an account, please ignore this email.
    </p>
  `, siteName);
}

// ── Handler ──────────────────────────────────────────────────────────────────

exports.handler = async (event) => {
  // CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  // Parse body
  let body;
  try {
    body = JSON.parse(event.body || '{}');
  } catch {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid JSON' }) };
  }

  const { type, email, name, verifyUrl, siteName: reqSiteName } = body;
  const siteName = reqSiteName || process.env.EMAIL_FROM_NAME || 'Aligarh Attars';
  const siteUrl = process.env.SITE_URL || 'https://aligarhattars.com';

  if (!type || !email) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'type and email are required' }) };
  }

  // Create transporter
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT || '587', 10),
    secure: process.env.EMAIL_PORT === '465',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  // Build mail options based on type
  let subject, html;

  if (type === 'welcome') {
    subject = `Welcome to ${siteName}!`;
    html = welcomeTemplate(name || 'there', siteName);

  } else if (type === 'reset') {
    subject = `Reset your ${siteName} password`;
    html = resetTemplate(siteUrl, siteName);

  } else if (type === 'verification') {
    if (!verifyUrl) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'verifyUrl required for verification type' }) };
    }
    subject = `Verify your ${siteName} email`;
    html = verificationTemplate(verifyUrl, siteName);

  } else {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Unknown email type' }) };
  }

  try {
    await transporter.sendMail({
      from: `"${process.env.EMAIL_FROM_NAME || siteName}" <${process.env.EMAIL_FROM_ADDR || process.env.EMAIL_USER}>`,
      to: email,
      subject,
      html,
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true, message: `${type} email sent to ${email}` }),
    };
  } catch (err) {
    console.error('Email send error:', err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Failed to send email', detail: err.message }),
    };
  }
};
