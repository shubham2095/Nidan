/**
 * Database CLI used by the `db:*` npm scripts.
 *   node server/utils/dbTasks.js create | migrate | seed | reset
 */
const mysql = require('mysql2/promise');
const env = require('../config/env');
const sequelize = require('../config/db');
const { runMigrations, runSeeders } = require('./migrator');

const createDatabase = async () => {
  if (!/^[A-Za-z0-9_]+$/.test(env.db.name)) {
    throw new Error(`DB_NAME "${env.db.name}" may only contain letters, numbers and underscores`);
  }
  const connection = await mysql.createConnection({
    host: env.db.host,
    port: env.db.port,
    user: env.db.user,
    password: env.db.password,
  });
  try {
    await connection.query(
      `CREATE DATABASE IF NOT EXISTS \`${env.db.name}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,
    );
    console.log(`[db] database "${env.db.name}" is ready`);
  } finally {
    await connection.end();
  }
};

const resetDatabase = async () => {
  if (env.isProd) {
    throw new Error('db:reset drops every table and is blocked when NODE_ENV=production');
  }
  await sequelize.getQueryInterface().dropAllTables();
  console.log('[db] all tables dropped');
  await runMigrations();
  await runSeeders();
};

const tasks = {
  create: createDatabase,
  migrate: runMigrations,
  seed: runSeeders,
  reset: resetDatabase,
};

const main = async () => {
  const name = process.argv[2];
  const task = tasks[name];
  if (!task) {
    console.error(`Unknown task "${name}". Use one of: ${Object.keys(tasks).join(', ')}`);
    process.exitCode = 1;
    return;
  }
  try {
    await task();
  } catch (error) {
    console.error(`[db] ${name} failed: ${error.message}`);
    process.exitCode = 1;
  } finally {
    await sequelize.close();
  }
};

main();
