module.exports = (sequelize, DataTypes) =>
  sequelize.define(
    'Specialty',
    {
      title: { type: DataTypes.STRING(150), allowNull: false },
      description: DataTypes.TEXT,
      icon: DataTypes.STRING(50),
      isActive: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
      sortOrder: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    },
    { tableName: 'specialties' },
  );
