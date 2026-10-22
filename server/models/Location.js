module.exports = (sequelize, DataTypes) =>
  sequelize.define(
    'Location',
    {
      name: { type: DataTypes.STRING(150), allowNull: false },
      slug: { type: DataTypes.STRING(191), allowNull: false, unique: true },
      address: { type: DataTypes.STRING(500), allowNull: false },
      city: { type: DataTypes.STRING(100), allowNull: false, defaultValue: 'Noida' },
      state: { type: DataTypes.STRING(100), allowNull: false, defaultValue: 'Uttar Pradesh' },
      postalCode: DataTypes.STRING(10),
      phone: DataTypes.STRING(50),
      mapUrl: DataTypes.STRING(1000),
      mapEmbedUrl: DataTypes.STRING(1000),
      isOwnClinic: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
      isActive: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
      sortOrder: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    },
    { tableName: 'locations' },
  );
