const path = require('path');

const rootDir = path.resolve(__dirname, '..', '..');
require('dotenv').config({ path: path.join(rootDir, '.env'), quiet: true });

const toBool = (value, fallback = false) =>
  value === undefined || value === '' ? fallback : String(value).toLowerCase() === 'true';

const nodeEnv = process.env.NODE_ENV || 'development';
const isProd = nodeEnv === 'production';

const uploadDir = path.resolve(process.env.UPLOAD_DIR || path.join(rootDir, 'uploads'));

const env = {
  rootDir,
  nodeEnv,
  isProd,
  port: Number(process.env.PORT) || 5000,
  timezone: 'Asia/Kolkata',
  clientUrl: (process.env.CLIENT_URL || 'http://localhost:5173').replace(/\/+$/, ''),
  runMigrations: toBool(process.env.RUN_MIGRATIONS),
  runSeeds: toBool(process.env.RUN_SEEDS),
  cookieSecure: toBool(process.env.COOKIE_SECURE, isProd),
  db: {
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT) || 3306,
    name: process.env.DB_NAME || 'nidan_crm',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    logging: toBool(process.env.DB_LOGGING),
  },
  jwt: {
    secret: process.env.JWT_SECRET || '',
    expiresIn: process.env.JWT_EXPIRES_IN || '12h',
  },
  admin: {
    name: process.env.ADMIN_NAME || 'Clinic Admin',
    email: (process.env.ADMIN_EMAIL || '').trim().toLowerCase(),
    password: process.env.ADMIN_PASSWORD || '',
  },
  mail: {
    host: process.env.SMTP_HOST || '',
    port: Number(process.env.SMTP_PORT) || 465,
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
    from: process.env.MAIL_FROM || 'Nidan Mother & Child Care <info@nidanmotherandchildcare.com>',
    notifyEmail: process.env.CLINIC_NOTIFY_EMAIL || '',
  },
  uploadDir,
  publicUploadDir: path.join(uploadDir, 'public'),
  privateUploadDir: path.join(uploadDir, 'private'),
};

// Values copied from .env.example that must never reach a live site.
const isPlaceholder = (value) => /^change-me/i.test(value) || value === 'admin@example.com';
env.isPlaceholder = isPlaceholder;

/** Fail fast on settings the web server cannot run safely without. */
env.assertServerConfig = () => {
  const problems = [];
  if (env.jwt.secret.length < 32) problems.push('JWT_SECRET must be set to a random string of at least 32 characters');
  if (env.isProd && isPlaceholder(env.jwt.secret)) problems.push('JWT_SECRET is still the example value; generate a random one (see .env.example)');
  if (problems.length) {
    throw new Error(`Invalid environment configuration:\n - ${problems.join('\n - ')}`);
  }

  if (env.isProd && !env.cookieSecure) console.warn('[server] COOKIE_SECURE is false in production: login cookies will also travel over plain HTTP');
  if (env.isProd && !/^https:\/\//.test(env.clientUrl)) console.warn(`[server] CLIENT_URL (${env.clientUrl}) is not an https:// address: canonical links, the sitemap and emailed links will use it`);
};

module.exports = env;
