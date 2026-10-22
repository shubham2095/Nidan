module.exports = (sequelize, DataTypes) =>
  sequelize.define(
    'Attachment',
    {
      title: { type: DataTypes.STRING(200), allowNull: false },
      originalName: { type: DataTypes.STRING(255), allowNull: false },
      storageKey: { type: DataTypes.STRING(500), allowNull: false },
      mimeType: { type: DataTypes.STRING(100), allowNull: false },
      sizeBytes: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    },
    { tableName: 'attachments' },
  );
