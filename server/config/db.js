const { Sequelize } = require('sequelize');
const env = require('./env');

// Works with both MySQL and MariaDB (XAMPP). Tables are created only by migrations.
const sequelize = new Sequelize(env.db.name, env.db.user, env.db.password, {
  host: env.db.host,
  port: env.db.port,
  dialect: 'mysql',
  // created_at / updated_at are stored in UTC; appointment dates and times are
  // clinic wall-clock (Asia/Kolkata) DATE/TIME columns and are not converted.
  timezone: '+00:00',
  logging: env.db.logging ? console.log : false,
  dialectOptions: { charset: 'UTF8MB4_UNICODE_CI' },
  define: {
    underscored: true,
    timestamps: true,
    charset: 'utf8mb4',
    collate: 'utf8mb4_unicode_ci',
  },
  pool: { max: 10, min: 0, acquire: 30000, idle: 10000 },
});

module.exports = sequelize;
