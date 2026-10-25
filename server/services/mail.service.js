const nodemailer = require('nodemailer');
const env = require('../config/env');
const escapeHtml = require('../utils/escapeHtml');
const { formatDateLong, formatTime12 } = require('../utils/datetime');

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
    subject: 'Reset your NIDAN Mother & Child Clinic CRM password',
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

const detailsTable = (rows) =>
  '<table cellpadding="6" style="border-collapse:collapse">' +
  rows.map(([label, value]) => `<tr><td style="color:#475569"><strong>${escapeHtml(label)}</strong></td><td>${escapeHtml(value)}</td></tr>`).join('') +
  '</table>';

/**
 * After an online booking: a "request received" email to the patient (if they gave an email address)
 * and a heads-up to the clinic. Both are fire-and-forget and never block or fail the booking.
 */
const sendBookingEmails = ({ appointment, patient, doctor, location, clinic }) => {
  const when = `${formatDateLong(appointment.appointmentDate)}, ${formatTime12(appointment.startTime)}`;
  const where = `${location.name}, ${location.address}`;
  const phoneLine = clinic.phonePrimary ? ` or call us on ${clinic.phonePrimary}` : '';
  const results = [];

  if (patient.email) {
    const rows = [
      ['Booking ID', appointment.bookingRef],
      ['Patient', patient.name],
      ['Doctor', doctor.name],
      ['When', when],
      ['Where', where],
    ];
    results.push(
      sendMail({
        to: patient.email,
        subject: `Appointment request received (${appointment.bookingRef})`,
        text:
          `Hello ${patient.name},\n\nThank you for booking with ${clinic.name || 'NIDAN Mother & Child Clinic'}. ` +
          'We have received your appointment request. Our team will confirm it shortly.\n\n' +
          `${rows.map(([label, value]) => `${label}: ${value}`).join('\n')}\n` +
          `${location.mapUrl ? `Map: ${location.mapUrl}\n` : ''}\n` +
          `If you need to change or cancel, please quote your booking ID${phoneLine}.`,
        html:
          `<p>Hello ${escapeHtml(patient.name)},</p>` +
          `<p>Thank you for booking with ${escapeHtml(clinic.name || 'NIDAN Mother & Child Clinic')}. We have received your appointment request and our team will confirm it shortly.</p>` +
          detailsTable(rows) +
          (location.mapUrl ? `<p><a href="${escapeHtml(location.mapUrl)}">Open the location in Google Maps</a></p>` : '') +
          `<p>If you need to change or cancel, please quote your booking ID${escapeHtml(phoneLine)}.</p>`,
      }),
    );
  }

  if (env.mail.notifyEmail) {
    const rows = [
      ['Booking ID', appointment.bookingRef],
      ['Patient', `${patient.name} (${patient.type === 'child' ? 'child' : 'mother / woman'})`],
      ['Phone', patient.phone],
      ['Email', patient.email || '-'],
      ['Guardian', patient.guardianName || '-'],
      ['Doctor', doctor.name],
      ['When', when],
      ['Where', location.name],
      ['Reason', appointment.reason || '-'],
    ];
    results.push(
      sendMail({
        to: env.mail.notifyEmail,
        subject: `New appointment request: ${patient.name} with ${doctor.name}, ${formatDateLong(appointment.appointmentDate)} ${formatTime12(appointment.startTime)}`,
        text: `${rows.map(([label, value]) => `${label}: ${value}`).join('\n')}\n\nConfirm it in the CRM under Appointments.`,
        html: `<p>A new appointment request came in from the website.</p>${detailsTable(rows)}<p>Confirm it in the CRM under Appointments.</p>`,
      }),
    );
  }

  return Promise.all(results);
};

const APPOINTMENT_EMAILS = {
  confirmed: {
    subject: (ref) => `Your appointment is confirmed (${ref})`,
    intro: 'Good news! Your appointment is confirmed.',
  },
  rescheduled: {
    subject: (ref) => `Your appointment has been rescheduled (${ref})`,
    intro: 'Your appointment has been moved to a new time. The new details are below.',
  },
  cancelled: {
    subject: (ref) => `Your appointment has been cancelled (${ref})`,
    intro: 'Your appointment has been cancelled. You are welcome to book again whenever it suits you.',
  },
};

/** Tells the patient when staff confirm, reschedule or cancel an appointment (only if they gave an email address). */
const sendAppointmentEmail = ({ type, appointment, patient, doctor, location, clinic }) => {
  if (!patient.email) return Promise.resolve(false);
  const { subject, intro } = APPOINTMENT_EMAILS[type];
  const rows = [
    ['Booking ID', appointment.bookingRef],
    ['Patient', patient.name],
    ['Doctor', doctor.name],
    ['When', `${formatDateLong(appointment.appointmentDate)}, ${formatTime12(appointment.startTime)}`],
    ['Where', `${location.name}, ${location.address}`],
  ];
  const phoneLine = clinic?.phonePrimary ? `Questions? Call us on ${clinic.phonePrimary}.` : '';
  return sendMail({
    to: patient.email,
    subject: subject(appointment.bookingRef),
    text: `Hello ${patient.name},\n\n${intro}\n\n${rows.map(([label, value]) => `${label}: ${value}`).join('\n')}\n\n${phoneLine}`,
    html: `<p>Hello ${escapeHtml(patient.name)},</p><p>${escapeHtml(intro)}</p>${detailsTable(rows)}<p>${escapeHtml(phoneLine)}</p>`,
  });
};

module.exports = { sendMail, sendPasswordResetEmail, sendContactNotification, sendBookingEmails, sendAppointmentEmail };
