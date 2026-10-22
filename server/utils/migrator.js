const path = require('path');
const { Sequelize, DataTypes } = require('sequelize');
const { Umzug, SequelizeStorage } = require('umzug');
const sequelize = require('../config/db');

// Umzug would otherwise create its tracking tables as utf8; keep everything utf8mb4.
const trackingModel = (tableName) =>
  sequelize.define(
    `tracking_${tableName}`,
    { name: { type: DataTypes.STRING(191), allowNull: false, primaryKey: true } },
    { tableName, timestamps: false, charset: 'utf8mb4', collate: 'utf8mb4_unicode_ci' },
  );

const logger = (label) => ({
  info: (message) => {
    if (message && message.event && message.name) console.log(`[${label}] ${message.event}: ${message.name}`);
  },
  warn: console.warn,
  error: console.error,
  debug: () => {},
});

/**
 * Umzug runner for a folder of `{ up, down }` modules.
 * Applied files are tracked in `tableName`, so each file runs once per database.
 */
const createRunner = ({ folder, tableName, label, getContext }) =>
  new Umzug({
    migrations: {
      glob: ['*.js', { cwd: path.join(__dirname, '..', folder) }],
      resolve: ({ name, path: filePath, context }) => {
        const mod = require(filePath);
        return {
          name,
          up: async () => mod.up(context, Sequelize),
          down: async () => (mod.down ? mod.down(context, Sequelize) : undefined),
        };
      },
    },
    context: getContext,
    storage: new SequelizeStorage({ sequelize, model: trackingModel(tableName) }),
    logger: logger(label),
  });

const migrator = createRunner({
  folder: 'migrations',
  tableName: 'schema_migrations',
  label: 'migrate',
  getContext: () => sequelize.getQueryInterface(),
});

const seeder = createRunner({
  folder: 'seeders',
  tableName: 'schema_seeders',
  label: 'seed',
  // Models are loaded lazily so migrations can run before they are needed.
  getContext: () => ({ sequelize, models: require('../models') }),
});

const runMigrations = () => migrator.up();
const runSeeders = () => seeder.up();

module.exports = { runMigrations, runSeeders };
