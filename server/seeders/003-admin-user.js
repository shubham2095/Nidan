const bcrypt = require('bcryptjs');
const env = require('../config/env');
const { ROLES } = require('../utils/constants');
const { createOnce } = require('../utils/seedHelpers');

module.exports = {
  async up({ models: { User } }) {
    const { name, email, password } = env.admin;
    if (!email || !password) {
      throw new Error('Set ADMIN_EMAIL and ADMIN_PASSWORD in the environment before seeding the super admin');
    }
    if (password.length < 8) {
      throw new Error('ADMIN_PASSWORD must be at least 8 characters');
    }
    if (env.isProd && (env.isPlaceholder(password) || env.isPlaceholder(email))) {
      throw new Error('ADMIN_EMAIL / ADMIN_PASSWORD still hold the example values from .env.example; set real ones before seeding production');
    }

    const [, created] = await createOnce(User, { email }, {
      name,
      role: ROLES.SUPER_ADMIN,
      passwordHash: await bcrypt.hash(password, 12),
    });
    console.log(`[seed] super admin ${created ? 'created' : 'already exists'}: ${email}`);
  },
};
