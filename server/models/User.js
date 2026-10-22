const { ROLES } = require('../utils/constants');

module.exports = (sequelize, DataTypes) =>
  sequelize.define(
    'User',
    {
      name: { type: DataTypes.STRING(150), allowNull: false },
      email: { type: DataTypes.STRING(191), allowNull: false, unique: true, validate: { isEmail: true } },
      passwordHash: { type: DataTypes.STRING(255), allowNull: false },
      role: { type: DataTypes.STRING(30), allowNull: false, validate: { isIn: [Object.values(ROLES)] } },
      isActive: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
      lastLoginAt: DataTypes.DATE,
      // Sessions issued before this moment are rejected (set on password change / reset).
      passwordChangedAt: DataTypes.DATE,
      resetTokenHash: DataTypes.STRING(64),
      resetTokenExpiresAt: DataTypes.DATE,
    },
    {
      tableName: 'users',
      // Credentials never leave the model unless a caller asks for them explicitly.
      defaultScope: { attributes: { exclude: ['passwordHash', 'resetTokenHash', 'resetTokenExpiresAt'] } },
      // User.scope('withSecrets') replaces the default scope, so every column is loaded.
      scopes: { withSecrets: {} },
    },
  );
