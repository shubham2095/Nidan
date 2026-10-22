const jsonColumn = require('../utils/jsonColumn');

module.exports = (sequelize, DataTypes) =>
  sequelize.define(
    'Setting',
    {
      settingKey: { type: DataTypes.STRING(100), allowNull: false, unique: true },
      settingValue: jsonColumn(DataTypes, 'settingValue', null),
    },
    { tableName: 'settings' },
  );
