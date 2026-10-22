const nodemailer = require('nodemailer');
const env = require('../config/env');
const escapeHtml = require('../utils/escapeHtml');

let transporter;

const getTransporter = () => {
  if (!env.mail.host) return null;
  transporter ??= nodemailer.createTransport({
    host: env.mail.host,
    port: env.mail.port,
    secure: env.mail.port === 465,
    auth: env.mail.user ? { user: env.mail.user, pass: env.mail.pass } : undefined,
  });
  return transporter;
};

/**
 * Sends one email. Failures are logged (never the message body) and reported as `false`
 * so that a mail outage can never break the action that triggered the email.
 */
const sendMail = async ({ to, subject, text, html }) => {
  const smtp = getTransporter();
  if (!smtp) {
    console.warn(`[mail] SMTP_HOST is not set - skipped email "${subject}"`);
    return false;
  }
  try {
    await smtp.sendMail({ from: env.mail.from, to, subject, text, html });
    return true;
  } catch (error) {
    console.error(`[mail] failed to send "${subject}": ${error.message}`);
    return false;
  }
};

const sendPasswordResetEmail = ({ user, resetUrl }) =>
  sendMail({
    to: user.email,
    subject: 'Reset your Nidan CRM password',
    text:
      `Hello ${user.name},\n\n` +
      `We received a request to reset your password. Use the link below within 1 hour:\n${resetUrl}\n\n` +
      'If you did not ask for this, you can safely ignore this email.',
    html:
      `<p>Hello ${escapeHtml(user.name)},</p>` +
      '<p>We received a request to reset your password. Use the button below within 1 hour.</p>' +
      `<p><a href="${escapeHtml(resetUrl)}" style="display:inline-block;padding:10px 18px;background:#0f766e;color:#ffffff;border-radius:8px;text-decoration:none">Reset password</a></p>` +
      '<p>If you did not ask for this, you can safely ignore this email.</p>',
  });

/** Tells the clinic about a new website enquiry. Does nothing when CLINIC_NOTIFY_EMAIL is not set. */
const sendContactNotification = ({ lead, doctorName }) => {
  if (!env.mail.notifyEmail) return Promise.resolve(false);
  const lines = [
    ['Name', lead.name],
    ['Phone', lead.phone],
    ['Email', lead.email || '-'],
    ['Preferred doctor', doctorName || 'No preference'],
    ['Message', lead.message],
  ];
  return sendMail({
    to: env.mail.notifyEmail,
    subject: `New website enquiry from ${lead.name}`,
    text: `${lines.map(([label, value]) => `${label}: ${value}`).join('\n')}\n\nFollow up in the CRM under Leads.`,
    html:
      '<p>A new enquiry came in from the website contact form.</p><table cellpadding="6">' +
      lines.map(([label, value]) => `<tr><td><strong>${escapeHtml(label)}</strong></td><td>${escapeHtml(value)}</td></tr>`).join('') +
      '</table><p>Follow up in the CRM under Leads.</p>',
  });
};

module.exports = { sendMail, sendPasswordResetEmail, sendContactNotification };
