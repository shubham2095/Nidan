const fs = require('fs');
const path = require('path');
const env = require('./config/env');

env.assertServerConfig();

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const cookieParser = require('cookie-parser');
const { sequelize } = require('./models');
const routes = require('./routes');
const { apiLimiter } = require('./middleware/rateLimit');
const { notFound, errorHandler } = require('./middleware/errorHandler');
const { runMigrations } = require('./utils/migrator');

const app = express();

// Hostinger terminates TLS in front of the app; trust it so req.ip and secure cookies work.
if (env.isProd) app.set('trust proxy', 1);

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        fontSrc: ["'self'", 'https://fonts.gstatic.com', 'data:'],
        imgSrc: ["'self'", 'data:', 'blob:', 'https:'],
        frameSrc: ["'self'", 'https://www.google.com', 'https://www.youtube.com', 'https://www.youtube-nocookie.com'],
        connectSrc: ["'self'"],
        objectSrc: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
        frameAncestors: ["'self'"],
        upgradeInsecureRequests: null,
      },
    },
  }),
);
app.use(compression());
// In development the Vite proxy makes requests same-origin; CORS is only a safety net for direct calls.
if (!env.isProd) app.use(cors({ origin: env.clientUrl, credentials: true }));
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());

// Only the public upload area is web-accessible. Patient files live in `private/`
// and must be streamed through authenticated routes.
app.use('/uploads', express.static(env.publicUploadDir, { maxAge: '7d', index: false }));

app.use('/api', apiLimiter, routes, notFound);

if (env.isProd) {
  const distDir = path.join(env.rootDir, 'client', 'dist');
  if (!fs.existsSync(path.join(distDir, 'index.html'))) {
    console.warn('[server] client/dist/index.html not found - run `npm run build` first');
  }
  app.use(
    express.static(distDir, {
      index: false,
      setHeaders: (res, filePath) => {
        // Vite fingerprints everything in /assets, so it can be cached forever.
        if (filePath.includes(`${path.sep}assets${path.sep}`)) {
          res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
        }
      },
    }),
  );
  // Express 5 needs a regex (not '*'). Requests for files (anything with an extension), /api and /uploads are excluded.
  app.get(/^(?!\/api(?:\/|$)|\/uploads(?:\/|$))(?!.*\.[A-Za-z0-9]+$).*/, (req, res) => {
    res.setHeader('Cache-Control', 'no-cache');
    res.sendFile(path.join(distDir, 'index.html'));
  });
}

app.use(errorHandler);

const start = async () => {
  await sequelize.authenticate();
  if (env.runMigrations) {
    console.log('[server] RUN_MIGRATIONS=true - applying pending migrations');
    await runMigrations();
  }
  fs.mkdirSync(env.publicUploadDir, { recursive: true });
  fs.mkdirSync(env.privateUploadDir, { recursive: true });

  const server = app.listen(env.port, () => {
    console.log(`[server] ${env.nodeEnv} server listening on port ${env.port}`);
  });

  const shutdown = () => {
    server.close(async () => {
      await sequelize.close();
      process.exit(0);
    });
  };
  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
};

start().catch((error) => {
  console.error(`[server] failed to start: ${error.message}`);
  process.exit(1);
});
