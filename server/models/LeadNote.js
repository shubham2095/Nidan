module.exports = (sequelize, DataTypes) =>
  sequelize.define(
    'LeadNote',
    { note: { type: DataTypes.TEXT, allowNull: false } },
    { tableName: 'lead_notes' },
  );
