const { tableOptions, id, timestamps, deletedAt, ref, dropTables, DataTypes } = require('../utils/migrationHelpers');

module.exports = {
  async up(queryInterface) {
    await queryInterface.createTable(
      'appointments',
      {
        ...id(),
        booking_ref: { type: DataTypes.STRING(20), allowNull: false, unique: true },
        patient_id: ref('patients'),
        doctor_id: ref('doctors'),
        location_id: ref('locations'),
        // Clinic wall-clock time (Asia/Kolkata), stored as DATE + TIME.
        appointment_date: { type: DataTypes.DATEONLY, allowNull: false },
        start_time: { type: DataTypes.TIME, allowNull: false },
        end_time: { type: DataTypes.TIME, allowNull: false },
        // pending | confirmed | completed | cancelled | no_show
        status: { type: DataTypes.STRING(20), allowNull: false, defaultValue: 'pending' },
        // website | phone | walk_in
        source: { type: DataTypes.STRING(20), allowNull: false, defaultValue: 'website' },
        reason: { type: DataTypes.TEXT, allowNull: true },
        staff_note: { type: DataTypes.TEXT, allowNull: true },
        cancel_reason: { type: DataTypes.STRING(500), allowNull: true },
        consent_at: { type: DataTypes.DATE, allowNull: true },
        // 1 while the slot is held (pending/confirmed/completed), NULL once cancelled / no-show / deleted.
        // NULLs never collide in a unique index, so this works as a portable "partial" unique key.
        slot_lock: { type: DataTypes.TINYINT.UNSIGNED, allowNull: true },
        created_by: ref('users', { allowNull: true }),
        ...timestamps(),
        ...deletedAt(),
      },
      tableOptions,
    );
    await queryInterface.addIndex('appointments', ['doctor_id', 'appointment_date', 'start_time', 'slot_lock'], {
      name: 'uniq_appointment_slot',
      unique: true,
    });
    await queryInterface.addIndex('appointments', ['appointment_date', 'status'], { name: 'idx_appt_date_status' });
    await queryInterface.addIndex('appointments', ['patient_id'], { name: 'idx_appt_patient' });
    await queryInterface.addIndex('appointments', ['location_id', 'appointment_date'], { name: 'idx_appt_location_date' });

    await queryInterface.createTable(
      'visit_notes',
      {
        ...id(),
        appointment_id: ref('appointments', { allowNull: true }),
        patient_id: ref('patients', { onDelete: 'CASCADE' }),
        doctor_id: ref('doctors'),
        note: { type: DataTypes.TEXT('long'), allowNull: false },
        ...timestamps(),
      },
      tableOptions,
    );
    await queryInterface.addIndex('visit_notes', ['patient_id', 'created_at'], { name: 'idx_notes_patient' });

    await queryInterface.createTable(
      'attachments',
      {
        ...id(),
        patient_id: ref('patients', { onDelete: 'CASCADE' }),
        visit_note_id: ref('visit_notes', { allowNull: true }),
        title: { type: DataTypes.STRING(200), allowNull: false },
        original_name: { type: DataTypes.STRING(255), allowNull: false },
        storage_key: { type: DataTypes.STRING(500), allowNull: false },
        mime_type: { type: DataTypes.STRING(100), allowNull: false },
        size_bytes: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
        uploaded_by: ref('users', { allowNull: true }),
        ...timestamps(),
      },
      tableOptions,
    );
    await queryInterface.addIndex('attachments', ['patient_id'], { name: 'idx_attachments_patient' });
  },

  async down(queryInterface) {
    await dropTables(queryInterface, ['attachments', 'visit_notes', 'appointments']);
  },
};
