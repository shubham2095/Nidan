const fs = require('fs');
const path = require('path');
const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const models = {};

fs.readdirSync(__dirname)
  .filter((file) => file !== 'index.js' && file.endsWith('.js'))
  .forEach((file) => {
    const model = require(path.join(__dirname, file))(sequelize, DataTypes);
    models[model.name] = model;
  });

const {
  Location, Doctor, DoctorSchedule, DoctorLeave, User, ActivityLog,
  Patient, PatientRelation, Appointment, VisitNote, Attachment,
  Lead, LeadNote, FollowUp, Vaccine, PatientVaccination,
  GalleryCategory, GalleryImage, BlogCategory, BlogPost, Setting,
} = models;

// Clinic setup
Doctor.hasMany(DoctorSchedule, { foreignKey: { name: 'doctorId', allowNull: false }, as: 'schedules' });
DoctorSchedule.belongsTo(Doctor, { foreignKey: 'doctorId', as: 'doctor' });
Location.hasMany(DoctorSchedule, { foreignKey: { name: 'locationId', allowNull: false }, as: 'schedules' });
DoctorSchedule.belongsTo(Location, { foreignKey: 'locationId', as: 'location' });

Doctor.hasMany(DoctorLeave, { foreignKey: { name: 'doctorId', allowNull: false }, as: 'leaves' });
DoctorLeave.belongsTo(Doctor, { foreignKey: 'doctorId', as: 'doctor' });
Location.hasMany(DoctorLeave, { foreignKey: 'locationId', as: 'leaves' });
DoctorLeave.belongsTo(Location, { foreignKey: 'locationId', as: 'location' });

// Users and audit trail
Doctor.hasOne(User, { foreignKey: 'doctorId', as: 'user' });
User.belongsTo(Doctor, { foreignKey: 'doctorId', as: 'doctor' });
User.hasMany(ActivityLog, { foreignKey: 'userId', as: 'activity' });
ActivityLog.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// Patients and family links
User.hasMany(Patient, { foreignKey: 'createdBy', as: 'createdPatients' });
Patient.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });
Patient.hasMany(PatientRelation, { foreignKey: { name: 'patientId', allowNull: false }, as: 'relationsFrom' });
Patient.hasMany(PatientRelation, { foreignKey: { name: 'relatedPatientId', allowNull: false }, as: 'relationsTo' });
PatientRelation.belongsTo(Patient, { foreignKey: 'patientId', as: 'patient' });
PatientRelation.belongsTo(Patient, { foreignKey: 'relatedPatientId', as: 'relatedPatient' });

// Appointments and visit records
Patient.hasMany(Appointment, { foreignKey: { name: 'patientId', allowNull: false }, as: 'appointments' });
Appointment.belongsTo(Patient, { foreignKey: 'patientId', as: 'patient' });
Doctor.hasMany(Appointment, { foreignKey: { name: 'doctorId', allowNull: false }, as: 'appointments' });
Appointment.belongsTo(Doctor, { foreignKey: 'doctorId', as: 'doctor' });
Location.hasMany(Appointment, { foreignKey: { name: 'locationId', allowNull: false }, as: 'appointments' });
Appointment.belongsTo(Location, { foreignKey: 'locationId', as: 'location' });
Appointment.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });

Appointment.hasMany(VisitNote, { foreignKey: 'appointmentId', as: 'visitNotes' });
VisitNote.belongsTo(Appointment, { foreignKey: 'appointmentId', as: 'appointment' });
Patient.hasMany(VisitNote, { foreignKey: { name: 'patientId', allowNull: false }, as: 'visitNotes' });
VisitNote.belongsTo(Patient, { foreignKey: 'patientId', as: 'patient' });
Doctor.hasMany(VisitNote, { foreignKey: { name: 'doctorId', allowNull: false }, as: 'visitNotes' });
VisitNote.belongsTo(Doctor, { foreignKey: 'doctorId', as: 'doctor' });

Patient.hasMany(Attachment, { foreignKey: { name: 'patientId', allowNull: false }, as: 'attachments' });
Attachment.belongsTo(Patient, { foreignKey: 'patientId', as: 'patient' });
VisitNote.hasMany(Attachment, { foreignKey: 'visitNoteId', as: 'attachments' });
Attachment.belongsTo(VisitNote, { foreignKey: 'visitNoteId', as: 'visitNote' });
Attachment.belongsTo(User, { foreignKey: 'uploadedBy', as: 'uploader' });

// Leads and follow-ups
Doctor.hasMany(Lead, { foreignKey: 'preferredDoctorId', as: 'leads' });
Lead.belongsTo(Doctor, { foreignKey: 'preferredDoctorId', as: 'preferredDoctor' });
Lead.belongsTo(User, { foreignKey: 'assignedTo', as: 'assignee' });
Lead.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });
Patient.hasMany(Lead, { foreignKey: 'patientId', as: 'leads' });
Lead.belongsTo(Patient, { foreignKey: 'patientId', as: 'patient' });
Lead.hasMany(LeadNote, { foreignKey: { name: 'leadId', allowNull: false }, as: 'notes' });
LeadNote.belongsTo(Lead, { foreignKey: 'leadId', as: 'lead' });
LeadNote.belongsTo(User, { foreignKey: 'userId', as: 'author' });

Lead.hasMany(FollowUp, { foreignKey: 'leadId', as: 'followUps' });
FollowUp.belongsTo(Lead, { foreignKey: 'leadId', as: 'lead' });
Patient.hasMany(FollowUp, { foreignKey: 'patientId', as: 'followUps' });
FollowUp.belongsTo(Patient, { foreignKey: 'patientId', as: 'patient' });
Appointment.hasMany(FollowUp, { foreignKey: 'appointmentId', as: 'followUps' });
FollowUp.belongsTo(Appointment, { foreignKey: 'appointmentId', as: 'appointment' });
FollowUp.belongsTo(User, { foreignKey: 'assignedTo', as: 'assignee' });
FollowUp.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });

// Vaccination tracker
Patient.hasMany(PatientVaccination, { foreignKey: { name: 'patientId', allowNull: false }, as: 'vaccinations' });
PatientVaccination.belongsTo(Patient, { foreignKey: 'patientId', as: 'patient' });
Vaccine.hasMany(PatientVaccination, { foreignKey: { name: 'vaccineId', allowNull: false }, as: 'doses' });
PatientVaccination.belongsTo(Vaccine, { foreignKey: 'vaccineId', as: 'vaccine' });
PatientVaccination.belongsTo(Doctor, { foreignKey: 'givenByDoctorId', as: 'givenBy' });

// Content
GalleryCategory.hasMany(GalleryImage, { foreignKey: 'categoryId', as: 'images' });
GalleryImage.belongsTo(GalleryCategory, { foreignKey: 'categoryId', as: 'category' });
BlogCategory.hasMany(BlogPost, { foreignKey: 'categoryId', as: 'posts' });
BlogPost.belongsTo(BlogCategory, { foreignKey: 'categoryId', as: 'category' });
BlogPost.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });
Setting.belongsTo(User, { foreignKey: 'updatedBy', as: 'updater' });

module.exports = { sequelize, ...models };
