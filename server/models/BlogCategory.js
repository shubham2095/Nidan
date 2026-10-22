module.exports = (sequelize, DataTypes) =>
  sequelize.define(
    'BlogCategory',
    {
      name: { type: DataTypes.STRING(150), allowNull: false },
      slug: { type: DataTypes.STRING(191), allowNull: false, unique: true },
    },
    { tableName: 'blog_categories' },
  );
