module.exports = (sequelize, DataTypes) =>
  sequelize.define(
    'Service',
    {
      name: { type: DataTypes.STRING(150), allowNull: false },
      slug: { type: DataTypes.STRING(191), allowNull: false, unique: true },
      shortDescription: DataTypes.STRING(500),
      description: DataTypes.TEXT('long'),
      icon: DataTypes.STRING(50),
      imageUrl: DataTypes.STRING(500),
      metaTitle: DataTypes.STRING(200),
      metaDescription: DataTypes.STRING(400),
      isActive: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
      sortOrder: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    },
    { tableName: 'services' },
  );
