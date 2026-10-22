module.exports = (sequelize, DataTypes) =>
  sequelize.define(
    'Vaccine',
    {
      name: { type: DataTypes.STRING(150), allowNull: false },
      ageLabel: { type: DataTypes.STRING(60), allowNull: false },
      // Recommended age in days from birth; due dates are DOB + ageDays.
      ageDays: { type: DataTypes.SMALLINT.UNSIGNED, allowNull: false },
      notes: DataTypes.TEXT,
      isActive: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
      sortOrder: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    },
    { tableName: 'vaccines' },
  );
