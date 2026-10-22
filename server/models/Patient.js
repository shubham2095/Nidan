const { PATIENT_TYPES } = require('../utils/constants');
const jsonColumn = require('../utils/jsonColumn');

module.exports = (sequelize, DataTypes) => {
  const Patient = sequelize.define(
    'Patient',
    {
      patientCode: { type: DataTypes.STRING(20), unique: true },
      type: { type: DataTypes.STRING(10), allowNull: false, validate: { isIn: [PATIENT_TYPES] } },
      name: { type: DataTypes.STRING(150), allowNull: false },
      phone: { type: DataTypes.STRING(20), allowNull: false },
      email: DataTypes.STRING(191),
      dob: DataTypes.DATEONLY,
      gender: DataTypes.STRING(10),
      guardianName: DataTypes.STRING(150),
      tags: jsonColumn(DataTypes, 'tags', []),
      consentAt: DataTypes.DATE,
    },
    { tableName: 'patients', paranoid: true },
  );

  // Human-friendly patient number derived from the primary key, e.g. NMC-000042.
  Patient.afterCreate(async (patient, options) => {
    await patient.update(
      { patientCode: `NMC-${String(patient.id).padStart(6, '0')}` },
      { transaction: options.transaction, hooks: false },
    );
  });

  return Patient;
};
