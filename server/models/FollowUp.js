const { FOLLOW_UP_STATUSES } = require('../utils/constants');

module.exports = (sequelize, DataTypes) =>
  sequelize.define(
    'FollowUp',
    {
      title: { type: DataTypes.STRING(200), allowNull: false },
      description: DataTypes.TEXT,
      dueDate: { type: DataTypes.DATEONLY, allowNull: false },
      status: {
        type: DataTypes.STRING(20),
        allowNull: false,
        defaultValue: 'open',
        validate: { isIn: [FOLLOW_UP_STATUSES] },
      },
      completedAt: DataTypes.DATE,
    },
    { tableName: 'follow_ups' },
  );
