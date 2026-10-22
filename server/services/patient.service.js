const { Patient, PatientRelation } = require('../models');

const normalizeName = (name) => name.trim().replace(/\s+/g, ' ').toLowerCase();

/**
 * Matches a booking to an existing patient by phone number + name (same type), so the same
 * person is never duplicated. A different name on the same phone is a different patient
 * (a mother often books her child with her own number). Missing details on an existing record
 * are filled in, but existing values are never overwritten by public input.
 */
const findOrCreateFromBooking = async ({ type, name, phone, email, dob, guardianName }, transaction) => {
  const candidates = await Patient.findAll({ where: { phone, type }, transaction });
  const existing = candidates.find((patient) => normalizeName(patient.name) === normalizeName(name));

  if (!existing) {
    return Patient.create(
      { type, name: name.trim().replace(/\s+/g, ' '), phone, email, dob, guardianName, consentAt: new Date() },
      { transaction },
    );
  }

  const blanks = {};
  if (!existing.email && email) blanks.email = email;
  if (!existing.dob && dob) blanks.dob = dob;
  if (!existing.guardianName && guardianName) blanks.guardianName = guardianName;
  if (!existing.consentAt) blanks.consentAt = new Date();
  if (Object.keys(blanks).length) await existing.update(blanks, { transaction });
  return existing;
};

/**
 * Links the children booked under a phone number to the mother booked under the same number.
 * Only done when exactly one mother uses that number, so a shared phone never guesses a parent.
 */
const linkFamily = async (phone, transaction) => {
  const mothers = await Patient.findAll({ where: { phone, type: 'mother' }, transaction });
  if (mothers.length !== 1) return;

  const children = await Patient.findAll({ where: { phone, type: 'child' }, transaction });
  for (const child of children) {
    await PatientRelation.findOrCreate({
      where: { patientId: mothers[0].id, relatedPatientId: child.id },
      defaults: { relation: 'mother_child' },
      transaction,
    });
  }
};

module.exports = { findOrCreateFromBooking, linkFamily };
