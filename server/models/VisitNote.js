module.exports = (sequelize, DataTypes) =>
  sequelize.define(
    'VisitNote',
    { note: { type: DataTypes.TEXT('long'), allowNull: false } },
    { tableName: 'visit_notes' },
  );
