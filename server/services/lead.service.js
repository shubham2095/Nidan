const { Lead, Doctor } = require('../models');
const mailService = require('./mail.service');
const activityLog = require('./activityLog.service');

/** Website contact form -> a new Lead in the CRM, plus a heads-up email to the clinic. */
const createFromContactForm = async ({ name, phone, email, message, preferredDoctorId }, req) => {
  // An unknown or inactive doctor id is simply ignored; it must never block an enquiry.
  const doctor = preferredDoctorId ? await Doctor.findOne({ where: { id: preferredDoctorId, isActive: true } }) : null;

  const lead = await Lead.create({
    name,
    phone,
    email,
    message,
    preferredDoctorId: doctor?.id ?? null,
    source: 'website',
    status: 'new',
    consentAt: new Date(),
  });

  await activityLog.record({
    entityType: 'lead',
    entityId: lead.id,
    action: 'create',
    summary: 'New enquiry from the website contact form',
    req,
  });

  // Not awaited: the visitor should not wait on the mail server (sendMail never throws).
  mailService.sendContactNotification({ lead, doctorName: doctor?.name });

  return lead;
};

module.exports = { createFromContactForm };
