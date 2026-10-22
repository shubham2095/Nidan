const { z } = require('zod');
const { normalizePhone } = require('../utils/phone');

const name = z.string().trim().min(2, 'Enter your name').max(100, 'Please use 100 characters or fewer');

const phone = z
  .string()
  .trim()
  .min(1, 'Enter your phone number')
  .transform((value, ctx) => {
    const normalized = normalizePhone(value);
    if (!normalized) {
      ctx.addIssue({ code: 'custom', message: 'Enter a valid phone number' });
      return z.NEVER;
    }
    return normalized;
  });

const optionalEmail = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.email('Enter a valid email address'))
  .or(z.literal(''))
  .optional()
  .transform((value) => value || undefined);

const emptyToUndefined = (value) => (value === '' || value === null ? undefined : value);

const optionalId = z.preprocess(emptyToUndefined, z.coerce.number().int().positive().optional());

const consent = z.literal(true, { error: 'Please tick the box to continue' });

// Real visitors never see or fill this field; bots do.
const honeypot = z.string().max(200).optional();

const contact = z.object({
  name,
  phone,
  email: optionalEmail,
  message: z.string().trim().min(5, 'Tell us a little about how we can help').max(2000),
  preferredDoctorId: optionalId,
  consent,
  website: honeypot,
});

const testimonial = z.object({
  name,
  label: z.string().trim().max(100).optional().transform((value) => value || undefined),
  content: z.string().trim().min(10, 'Please write at least a sentence').max(1000, 'Please use 1000 characters or fewer'),
  rating: z.preprocess(emptyToUndefined, z.coerce.number().int().min(1).max(5).optional()),
  consent,
  website: honeypot,
});

const slugParam = z.object({ slug: z.string().regex(/^[a-z0-9-]{1,191}$/, 'Invalid link') });

const blogQuery = z.object({
  page: z.coerce.number().int().min(1).max(1000).default(1),
  category: z.string().regex(/^[a-z0-9-]{1,191}$/).optional(),
  q: z.string().trim().max(100).optional(),
});

module.exports = { contact, testimonial, slugParam, blogQuery };
