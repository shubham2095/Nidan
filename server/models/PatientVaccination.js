module.exports = (sequelize, DataTypes) =>
  sequelize.define(
    'PatientVaccination',
    {
      dueDate: { type: DataTypes.DATEONLY, allowNull: false },
      givenDate: DataTypes.DATEONLY,
      notes: DataTypes.STRING(500),
    },
    { tableName: 'patient_vaccinations' },
  );
