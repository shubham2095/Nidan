const { POST_STATUSES } = require('../utils/constants');

module.exports = (sequelize, DataTypes) =>
  sequelize.define(
    'BlogPost',
    {
      title: { type: DataTypes.STRING(250), allowNull: false },
      slug: { type: DataTypes.STRING(191), allowNull: false, unique: true },
      excerpt: DataTypes.STRING(600),
      content: { type: DataTypes.TEXT('long'), allowNull: false },
      coverImageUrl: DataTypes.STRING(500),
      authorName: DataTypes.STRING(150),
      status: {
        type: DataTypes.STRING(20),
        allowNull: false,
        defaultValue: 'draft',
        validate: { isIn: [POST_STATUSES] },
      },
      publishedAt: DataTypes.DATE,
      metaTitle: DataTypes.STRING(200),
      metaDescription: DataTypes.STRING(400),
    },
    { tableName: 'blog_posts' },
  );
