module.exports = (sequelize, DataTypes) =>
  sequelize.define(
    'GalleryCategory',
    {
      name: { type: DataTypes.STRING(150), allowNull: false },
      slug: { type: DataTypes.STRING(191), allowNull: false, unique: true },
      sortOrder: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    },
    { tableName: 'gallery_categories' },
  );
