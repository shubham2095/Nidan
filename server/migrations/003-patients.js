const { tableOptions, id, timestamps, deletedAt, ref, dropTables, DataTypes } = require('../utils/migrationHelpers');

module.exports = {
  async up(queryInterface) {
    await queryInterface.createTable(
      'patients',
      {
        ...id(),
        patient_code: { type: DataTypes.STRING(20), allowNull: true, unique: true },
        // mother | child
        type: { type: DataTypes.STRING(10), allowNull: false },
        name: { type: DataTypes.STRING(150), allowNull: false },
        // normalised E.164-style number, e.g. +919773507333
        phone: { type: DataTypes.STRING(20), allowNull: false },
        email: { type: DataTypes.STRING(191), allowNull: true },
        dob: { type: DataTypes.DATEONLY, allowNull: true },
        gender: { type: DataTypes.STRING(10), allowNull: true },
        guardian_name: { type: DataTypes.STRING(150), allowNull: true },
        tags: { type: DataTypes.TEXT, allowNull: true },
        consent_at: { type: DataTypes.DATE, allowNull: true },
        created_by: ref('users', { allowNull: true }),
        ...timestamps(),
        ...deletedAt(),
      },
      tableOptions,
    );
    await queryInterface.addIndex('patients', ['phone'], { name: 'idx_patients_phone' });
    await queryInterface.addIndex('patients', ['name'], { name: 'idx_patients_name' });
    await queryInterface.addIndex('patients', ['type', 'dob'], { name: 'idx_patients_type_dob' });

    await queryInterface.createTable(
      'patient_relations',
      {
        ...id(),
        // patient = the parent / primary person, related_patient = the linked family member
        patient_id: ref('patients', { onDelete: 'CASCADE' }),
        related_patient_id: ref('patients', { onDelete: 'CASCADE' }),
        relation: { type: DataTypes.STRING(30), allowNull: false, defaultValue: 'mother_child' },
        ...timestamps(),
      },
      tableOptions,
    );
    await queryInterface.addIndex('patient_relations', ['patient_id', 'related_patient_id'], {
      name: 'uniq_patient_relation',
      unique: true,
    });
    await queryInterface.addIndex('patient_relations', ['related_patient_id'], { name: 'idx_relations_related' });
  },

  async down(queryInterface) {
    await dropTables(queryInterface, ['patient_relations', 'patients']);
  },
};
