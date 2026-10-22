const { z } = require('zod');

const email = z.string().trim().toLowerCase().pipe(z.email('Enter a valid email address'));

// bcrypt only reads the first 72 bytes, so longer passwords are rejected instead of silently truncated.
const newPassword = z
  .string()
  .min(8, 'Use at least 8 characters')
  .refine((value) => Buffer.byteLength(value) <= 72, 'Use at most 72 characters')
  .refine((value) => /[A-Za-z]/.test(value) && /\d/.test(value), 'Include at least one letter and one number');

const login = z.object({
  email,
  password: z.string().min(1, 'Enter your password').max(200),
});

const forgotPassword = z.object({ email });

const resetPassword = z.object({
  token: z.string().regex(/^[a-f0-9]{64}$/, 'This reset link is invalid'),
  password: newPassword,
});

const changePassword = z.object({
  currentPassword: z.string().min(1, 'Enter your current password').max(200),
  newPassword,
});

module.exports = { login, forgotPassword, resetPassword, changePassword };
