const jsonColumn = require('../utils/jsonColumn');

module.exports = (sequelize, DataTypes) =>
  sequelize.define(
    'ActivityLog',
    {
      userName: DataTypes.STRING(150),
      entityType: { type: DataTypes.STRING(50), allowNull: false },
      entityId: DataTypes.INTEGER.UNSIGNED,
      action: { type: DataTypes.STRING(50), allowNull: false },
      summary: DataTypes.STRING(500),
      changes: jsonColumn(DataTypes, 'changes', null),
      ipAddress: DataTypes.STRING(45),
    },
    { tableName: 'activity_logs', updatedAt: false },
  );
