const { LEAD_STATUSES, LEAD_SOURCES } = require('../utils/constants');

module.exports = (sequelize, DataTypes) =>
  sequelize.define(
    'Lead',
    {
      name: { type: DataTypes.STRING(150), allowNull: false },
      phone: { type: DataTypes.STRING(20), allowNull: false },
      email: DataTypes.STRING(191),
      message: DataTypes.TEXT,
      source: {
        type: DataTypes.STRING(30),
        allowNull: false,
        defaultValue: 'website',
        validate: { isIn: [LEAD_SOURCES] },
      },
      status: {
        type: DataTypes.STRING(20),
        allowNull: false,
        defaultValue: 'new',
        validate: { isIn: [LEAD_STATUSES] },
      },
      lostReason: DataTypes.STRING(500),
      nextFollowUpDate: DataTypes.DATEONLY,
      consentAt: DataTypes.DATE,
    },
    { tableName: 'leads', paranoid: true },
  );
