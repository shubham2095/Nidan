const { tableOptions, id, timestamps, ref, dropTables, DataTypes } = require('../utils/migrationHelpers');

module.exports = {
  async up(queryInterface) {
    // Master schedule: age_days is the recommended age (in days from birth) for the dose.
    await queryInterface.createTable(
      'vaccines',
      {
        ...id(),
        name: { type: DataTypes.STRING(150), allowNull: false },
        age_label: { type: DataTypes.STRING(60), allowNull: false },
        age_days: { type: DataTypes.SMALLINT.UNSIGNED, allowNull: false },
        notes: { type: DataTypes.TEXT, allowNull: true },
        is_active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
        sort_order: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
        ...timestamps(),
      },
      tableOptions,
    );
    await queryInterface.addIndex('vaccines', ['age_days', 'sort_order'], { name: 'idx_vaccines_age' });

    await queryInterface.createTable(
      'patient_vaccinations',
      {
        ...id(),
        patient_id: ref('patients', { onDelete: 'CASCADE' }),
        vaccine_id: ref('vaccines', { onDelete: 'CASCADE' }),
        due_date: { type: DataTypes.DATEONLY, allowNull: false },
        given_date: { type: DataTypes.DATEONLY, allowNull: true },
        given_by_doctor_id: ref('doctors', { allowNull: true }),
        notes: { type: DataTypes.STRING(500), allowNull: true },
        ...timestamps(),
      },
      tableOptions,
    );
    await queryInterface.addIndex('patient_vaccinations', ['patient_id', 'vaccine_id'], {
      name: 'uniq_patient_vaccine',
      unique: true,
    });
    await queryInterface.addIndex('patient_vaccinations', ['due_date', 'given_date'], { name: 'idx_pv_due' });
  },

  async down(queryInterface) {
    await dropTables(queryInterface, ['patient_vaccinations', 'vaccines']);
  },
};
