module.exports = (sequelize, DataTypes) =>
  sequelize.define(
    'DoctorSchedule',
    {
      // 0 = Sunday ... 6 = Saturday (same as JavaScript's Date#getDay)
      weekday: { type: DataTypes.TINYINT.UNSIGNED, allowNull: false, validate: { min: 0, max: 6 } },
      startTime: { type: DataTypes.TIME, allowNull: false },
      endTime: { type: DataTypes.TIME, allowNull: false },
      isActive: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    },
    { tableName: 'doctor_schedules' },
  );
