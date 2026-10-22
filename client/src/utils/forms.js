import { z } from 'zod';

const phone = z
  .string()
  .trim()
  .min(1, 'Enter your phone number')
  .refine((value) => {
    const digits = value.replace(/\D/g, '');
    return digits.length >= 10 && digits.length <= 13;
  }, 'Enter a valid phone number');

const name = z.string().trim().min(2, 'Enter your name').max(100, 'Please use 100 characters or fewer');
const consent = z.literal(true, { error: 'Please tick the box to continue' });

export const contactSchema = z.object({
  name,
  phone,
  email: z.union([z.literal(''), z.email('Enter a valid email address')]),
  preferredDoctorId: z.string(),
  message: z.string().trim().min(5, 'Tell us a little about how we can help').max(2000, 'Please use 2000 characters or fewer'),
  consent,
  website: z.string().optional(),
});

export const testimonialSchema = z.object({
  name,
  label: z.string().trim().max(100, 'Please use 100 characters or fewer'),
  rating: z.string(),
  content: z.string().trim().min(10, 'Please write at least a sentence').max(1000, 'Please use 1000 characters or fewer'),
  consent,
  website: z.string().optional(),
});

/** Shows the server's field-level validation messages next to the matching inputs. */
export function applyServerErrors(error, setError) {
  const details = error.response?.data?.details;
  if (!Array.isArray(details)) return false;
  details.forEach(({ field, message }) => setError(field, { type: 'server', message }));
  return details.length > 0;
}
