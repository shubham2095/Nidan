module.exports = (sequelize, DataTypes) =>
  sequelize.define(
    'DoctorLeave',
    {
      startDate: { type: DataTypes.DATEONLY, allowNull: false },
      endDate: { type: DataTypes.DATEONLY, allowNull: false },
      startTime: DataTypes.TIME,
      endTime: DataTypes.TIME,
      reason: DataTypes.STRING(255),
    },
    { tableName: 'doctor_leaves' },
  );
