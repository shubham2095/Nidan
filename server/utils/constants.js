const ROLES = Object.freeze({
  SUPER_ADMIN: 'super_admin',
  DOCTOR: 'doctor',
  RECEPTIONIST: 'receptionist',
});

const APPOINTMENT_STATUSES = ['pending', 'confirmed', 'completed', 'cancelled', 'no_show'];
/** Statuses that hold a slot; cancelled and no_show free it up again. */
const SLOT_HOLDING_STATUSES = ['pending', 'confirmed', 'completed'];
const APPOINTMENT_SOURCES = ['website', 'phone', 'walk_in'];

const PATIENT_TYPES = ['mother', 'child'];
const RELATION_TYPES = ['mother_child', 'sibling', 'guardian', 'other'];

const LEAD_STATUSES = ['new', 'contacted', 'converted', 'lost'];
const LEAD_SOURCES = ['website', 'phone', 'walk_in', 'instagram', 'referral', 'booking_dropoff', 'other'];

const FOLLOW_UP_STATUSES = ['open', 'done', 'cancelled'];
const TESTIMONIAL_STATUSES = ['pending', 'approved', 'rejected'];
const POST_STATUSES = ['draft', 'published'];

module.exports = {
  ROLES,
  APPOINTMENT_STATUSES,
  SLOT_HOLDING_STATUSES,
  APPOINTMENT_SOURCES,
  PATIENT_TYPES,
  RELATION_TYPES,
  LEAD_STATUSES,
  LEAD_SOURCES,
  FOLLOW_UP_STATUSES,
  TESTIMONIAL_STATUSES,
  POST_STATUSES,
};
