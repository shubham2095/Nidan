module.exports = (sequelize, DataTypes) =>
  sequelize.define(
    'GalleryImage',
    {
      title: DataTypes.STRING(200),
      altText: { type: DataTypes.STRING(300), allowNull: false },
      imageUrl: { type: DataTypes.STRING(500), allowNull: false },
      isActive: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
      sortOrder: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    },
    { tableName: 'gallery_images' },
  );
