const { DataTypes, Sequelize } = require('sequelize');

/** Table options so every table is utf8mb4 / utf8mb4_unicode_ci on InnoDB. */
const tableOptions = { charset: 'utf8mb4', collate: 'utf8mb4_unicode_ci', engine: 'InnoDB' };

const id = () => ({
  id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, primaryKey: true, autoIncrement: true },
});

const now = () => Sequelize.literal('CURRENT_TIMESTAMP');

const timestamps = () => ({
  created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: now() },
  updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: now() },
});

const createdAtOnly = () => ({
  created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: now() },
});

const deletedAt = () => ({
  deleted_at: { type: DataTypes.DATE, allowNull: true },
});

/** Foreign key to `<model>.id`. Nullable keys default to SET NULL, required ones to RESTRICT. */
const ref = (model, { allowNull = false, onDelete } = {}) => ({
  type: DataTypes.INTEGER.UNSIGNED,
  allowNull,
  references: { model, key: 'id' },
  onUpdate: 'CASCADE',
  onDelete: onDelete || (allowNull ? 'SET NULL' : 'RESTRICT'),
});

/** Drops tables in the given order (dependants first). */
const dropTables = async (queryInterface, names) => {
  for (const name of names) {
    await queryInterface.dropTable(name);
  }
};

module.exports = { tableOptions, id, timestamps, createdAtOnly, deletedAt, ref, dropTables, DataTypes };
