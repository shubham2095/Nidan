const { tableOptions, id, timestamps, deletedAt, ref, dropTables, DataTypes } = require('../utils/migrationHelpers');

module.exports = {
  async up(queryInterface) {
    await queryInterface.createTable(
      'leads',
      {
        ...id(),
        name: { type: DataTypes.STRING(150), allowNull: false },
        phone: { type: DataTypes.STRING(20), allowNull: false },
        email: { type: DataTypes.STRING(191), allowNull: true },
        message: { type: DataTypes.TEXT, allowNull: true },
        preferred_doctor_id: ref('doctors', { allowNull: true }),
        // website | phone | walk_in | instagram | referral | booking_dropoff | other
        source: { type: DataTypes.STRING(30), allowNull: false, defaultValue: 'website' },
        // new | contacted | converted | lost
        status: { type: DataTypes.STRING(20), allowNull: false, defaultValue: 'new' },
        lost_reason: { type: DataTypes.STRING(500), allowNull: true },
        assigned_to: ref('users', { allowNull: true }),
        next_follow_up_date: { type: DataTypes.DATEONLY, allowNull: true },
        patient_id: ref('patients', { allowNull: true }),
        consent_at: { type: DataTypes.DATE, allowNull: true },
        created_by: ref('users', { allowNull: true }),
        ...timestamps(),
        ...deletedAt(),
      },
      tableOptions,
    );
    await queryInterface.addIndex('leads', ['status', 'created_at'], { name: 'idx_leads_status' });
    await queryInterface.addIndex('leads', ['phone'], { name: 'idx_leads_phone' });
    await queryInterface.addIndex('leads', ['assigned_to'], { name: 'idx_leads_assigned' });

    await queryInterface.createTable(
      'lead_notes',
      {
        ...id(),
        lead_id: ref('leads', { onDelete: 'CASCADE' }),
        user_id: ref('users', { allowNull: true }),
        note: { type: DataTypes.TEXT, allowNull: false },
        ...timestamps(),
      },
      tableOptions,
    );
    await queryInterface.addIndex('lead_notes', ['lead_id'], { name: 'idx_lead_notes_lead' });

    await queryInterface.createTable(
      'follow_ups',
      {
        ...id(),
        title: { type: DataTypes.STRING(200), allowNull: false },
        description: { type: DataTypes.TEXT, allowNull: true },
        due_date: { type: DataTypes.DATEONLY, allowNull: false },
        // open | done | cancelled
        status: { type: DataTypes.STRING(20), allowNull: false, defaultValue: 'open' },
        completed_at: { type: DataTypes.DATE, allowNull: true },
        lead_id: ref('leads', { allowNull: true, onDelete: 'CASCADE' }),
        patient_id: ref('patients', { allowNull: true, onDelete: 'CASCADE' }),
        appointment_id: ref('appointments', { allowNull: true, onDelete: 'CASCADE' }),
        assigned_to: ref('users', { allowNull: true }),
        created_by: ref('users', { allowNull: true }),
        ...timestamps(),
      },
      tableOptions,
    );
    await queryInterface.addIndex('follow_ups', ['status', 'due_date'], { name: 'idx_followups_status_due' });
    await queryInterface.addIndex('follow_ups', ['assigned_to'], { name: 'idx_followups_assigned' });
  },

  async down(queryInterface) {
    await dropTables(queryInterface, ['follow_ups', 'lead_notes', 'leads']);
  },
};
