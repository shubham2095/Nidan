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

/** Fail fast on settings the web server cannot run safely without. */
env.assertServerConfig = () => {
  const problems = [];
  if (env.jwt.secret.length < 32) problems.push('JWT_SECRET must be set to a random string of at least 32 characters');
  if (problems.length) {
    throw new Error(`Invalid environment configuration:\n - ${problems.join('\n - ')}`);
  }
};

module.exports = env;
