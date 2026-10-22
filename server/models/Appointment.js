const { APPOINTMENT_STATUSES, APPOINTMENT_SOURCES, SLOT_HOLDING_STATUSES } = require('../utils/constants');

module.exports = (sequelize, DataTypes) => {
  const Appointment = sequelize.define(
    'Appointment',
    {
      bookingRef: { type: DataTypes.STRING(20), allowNull: false, unique: true },
      // Clinic wall-clock time (Asia/Kolkata)
      appointmentDate: { type: DataTypes.DATEONLY, allowNull: false },
      startTime: { type: DataTypes.TIME, allowNull: false },
      endTime: { type: DataTypes.TIME, allowNull: false },
      status: {
        type: DataTypes.STRING(20),
        allowNull: false,
        defaultValue: 'pending',
        validate: { isIn: [APPOINTMENT_STATUSES] },
      },
      source: {
        type: DataTypes.STRING(20),
        allowNull: false,
        defaultValue: 'website',
        validate: { isIn: [APPOINTMENT_SOURCES] },
      },
      reason: DataTypes.TEXT,
      staffNote: DataTypes.TEXT,
      cancelReason: DataTypes.STRING(500),
      consentAt: DataTypes.DATE,
      // Managed by the hooks below; backs the unique index `uniq_appointment_slot`.
      slotLock: DataTypes.TINYINT.UNSIGNED,
    },
    { tableName: 'appointments', paranoid: true },
  );

  // A slot stays locked only while the appointment still needs it. NULL never
  // collides in the unique index, so cancelled / no-show slots can be re-booked.
  // (Hooks run for instance saves; do not change `status` through bulk updates.)
  Appointment.beforeSave((appointment) => {
    appointment.slotLock = SLOT_HOLDING_STATUSES.includes(appointment.status) ? 1 : null;
  });

  Appointment.afterDestroy(async (appointment, options) => {
    await Appointment.update(
      { slotLock: null },
      { where: { id: appointment.id }, paranoid: false, transaction: options.transaction, hooks: false },
    );
  });

  return Appointment;
};
