const { z } = require('zod');
const { ROLES, ICON_NAMES, TESTIMONIAL_STATUSES, POST_STATUSES } = require('../utils/constants');
const { SETTING_KEYS } = require('../services/settings.service');
const booking = require('./booking.validators');
const crm = require('./crm.validators');

const { id, date, startTime } = booking;
const { emptyToUndefined, optionalId, optionalDate, optionalText, clearable, paging, search } = crm.helpers;

const text = (max, min = 0) => z.string().trim().min(min).max(max, `Please use ${max} characters or fewer`);
const required = (max, message = 'This is required') => z.string().trim().min(1, message).max(max, `Please use ${max} characters or fewer`);
const icon = z.preprocess(emptyToUndefined, z.enum(ICON_NAMES).optional());
// Uploaded pictures (/uploads), pictures shipped with the website (/images) or an https link.
const imageUrl = z.string().trim().regex(/^(\/uploads\/|\/images\/|https:\/\/)/, 'Use an uploaded image or an https link');
const stringList = (maxItems, maxLength) => z.array(z.string().trim().min(1).max(maxLength)).max(maxItems);
const reorder = z.object({ ids: z.array(id).min(1).max(200) });
const idParam = crm.idParam;

/* ---------- vaccines ---------- */

const vaccine = z.object({
  name: required(150, 'Enter the vaccine name'),
  ageLabel: required(60, 'Say when it is due, e.g. "6 weeks"'),
  ageDays: z.coerce.number().int().min(0, 'Use 0 or more').max(7300, 'That is more than 20 years'),
  notes: clearable(text(1000)),
  isActive: z.boolean().default(true),
});
const updateVaccine = vaccine.partial();

const vaccineList = z.object({ all: z.preprocess((value) => value === 'true' || value === '1', z.boolean()) });
const markGiven = z.object({
  givenDate: clearable(date),
  notes: clearable(text(500)),
  givenByDoctorId: optionalId,
});
const vaccinationParams = z.object({ id, recordId: id });
const dueQuery = z.object({ window: z.enum(['overdue', 'week', 'month', 'all']).default('week'), ...paging });

/* ---------- doctors, timetable, leave ---------- */

const doctorFields = {
  name: required(150, 'Enter the name'),
  slug: optionalText(80),
  designation: required(200, 'Enter the designation'),
  qualifications: required(300, 'Enter the qualifications'),
  highlights: stringList(5, 60).optional(),
  specialities: stringList(10, 100).optional(),
  bio: optionalText(20000),
  quote: optionalText(500),
  slotMinutes: z.coerce.number().int().min(5).max(120),
  bookingWindowDays: z.coerce.number().int().min(1).max(365),
  minNoticeMinutes: z.coerce.number().int().min(0).max(1440),
  metaTitle: optionalText(200),
  metaDescription: optionalText(400),
  isActive: z.boolean(),
};
const createDoctor = z.object(doctorFields).partial({ slotMinutes: true, bookingWindowDays: true, minNoticeMinutes: true, isActive: true });
const updateDoctor = z.object({
  ...doctorFields,
  bio: clearable(text(20000)),
  quote: clearable(text(500)),
  metaTitle: clearable(text(200)),
  metaDescription: clearable(text(400)),
}).partial();

const scheduleRows = z.object({
  schedules: z.array(z.object({ locationId: id, weekday: z.coerce.number().int().min(0).max(6), startTime, endTime: startTime })).max(80),
});

const leave = z
  .object({
    locationId: optionalId,
    startDate: date,
    endDate: date,
    startTime: z.preprocess(emptyToUndefined, startTime.optional()),
    endTime: z.preprocess(emptyToUndefined, startTime.optional()),
    reason: optionalText(255),
  })
  .superRefine((value, ctx) => {
    if (value.endDate < value.startDate) ctx.addIssue({ code: 'custom', path: ['endDate'], message: 'The end date cannot be before the start date' });
    if (Boolean(value.startTime) !== Boolean(value.endTime)) ctx.addIssue({ code: 'custom', path: ['endTime'], message: 'Give both a start and an end time, or neither for a whole day' });
    if (value.startTime && value.endTime && value.endTime <= value.startTime) ctx.addIssue({ code: 'custom', path: ['endTime'], message: 'The end time must be after the start time' });
  });
const leaveParams = z.object({ id, leaveId: id });

/* ---------- locations ---------- */

const locationFields = {
  name: required(150, 'Enter the name'),
  slug: optionalText(80),
  address: required(500, 'Enter the address'),
  city: required(100),
  state: required(100),
  postalCode: optionalText(10),
  phone: optionalText(50),
  mapUrl: optionalText(1000),
  mapEmbedUrl: optionalText(1000),
  isOwnClinic: z.boolean(),
  isActive: z.boolean(),
};
const createLocation = z.object(locationFields).partial({ city: true, state: true, isOwnClinic: true, isActive: true });
const updateLocation = z.object({
  ...locationFields,
  postalCode: clearable(text(10)),
  phone: clearable(text(50)),
  mapUrl: clearable(text(1000)),
  mapEmbedUrl: clearable(text(1000)),
}).partial();

/* ---------- website content ---------- */

const serviceFields = {
  name: required(150, 'Enter the name'),
  slug: optionalText(80),
  shortDescription: optionalText(500),
  description: optionalText(50000),
  icon,
  imageUrl: z.preprocess(emptyToUndefined, imageUrl.optional()),
  metaTitle: optionalText(200),
  metaDescription: optionalText(400),
  isActive: z.boolean(),
};
const createService = z.object(serviceFields).partial({ isActive: true });
const updateService = z.object({
  ...serviceFields,
  shortDescription: clearable(text(500)),
  description: clearable(text(50000)),
  icon: clearable(z.enum(ICON_NAMES)),
  imageUrl: clearable(imageUrl),
  metaTitle: clearable(text(200)),
  metaDescription: clearable(text(400)),
}).partial();

const specialty = z.object({
  title: required(150, 'Enter the title'),
  description: optionalText(2000),
  icon,
  isActive: z.boolean().default(true),
});
const updateSpecialty = specialty.partial();

const category = z.object({ name: required(150, 'Enter the name'), slug: optionalText(80) });
const updateCategory = category.partial();

const testimonialList = z.object({ status: z.preprocess(emptyToUndefined, z.enum(TESTIMONIAL_STATUSES).optional()), ...paging });
const createTestimonial = z.object({
  name: required(150, 'Enter the name'),
  label: optionalText(150),
  content: required(1000, 'Write the testimonial'),
  rating: z.preprocess(emptyToUndefined, z.coerce.number().int().min(1).max(5).optional()),
  status: z.enum(TESTIMONIAL_STATUSES).default('approved'),
});
const updateTestimonial = z.object({
  name: required(150).optional(),
  label: clearable(text(150)),
  content: required(1000).optional(),
  rating: clearable(z.coerce.number().int().min(1).max(5)),
  status: z.enum(TESTIMONIAL_STATUSES).optional(),
  sortOrder: z.coerce.number().int().min(0).max(100000).optional(),
});

const galleryUpload = z.object({ title: optionalText(200), altText: required(300, 'Describe the picture for people who cannot see it'), categoryId: optionalId });
const galleryUpdate = z.object({
  title: clearable(text(200)),
  altText: required(300).optional(),
  categoryId: clearable(id),
  isActive: z.boolean().optional(),
});

const mediaUpload = z.object({ folder: z.preprocess(emptyToUndefined, z.enum(['content', 'doctors', 'gallery', 'blog']).default('content')) });

const blogList = z.object({
  status: z.preprocess(emptyToUndefined, z.enum(POST_STATUSES).optional()),
  categoryId: optionalId,
  q: search,
  ...paging,
});
const postFields = {
  title: required(250, 'Enter a title'),
  slug: optionalText(80),
  excerpt: optionalText(600),
  content: required(200000, 'Write the article'),
  coverImageUrl: z.preprocess(emptyToUndefined, imageUrl.optional()),
  categoryId: optionalId,
  authorName: optionalText(150),
  status: z.enum(POST_STATUSES),
  publishedAt: z.preprocess(emptyToUndefined, z.coerce.date().optional()),
  metaTitle: optionalText(200),
  metaDescription: optionalText(400),
};
const createPost = z.object(postFields).partial({ status: true }).transform((value) => ({ status: 'draft', ...value }));
const updatePost = z.object({
  ...postFields,
  excerpt: clearable(text(600)),
  coverImageUrl: clearable(imageUrl),
  categoryId: clearable(id),
  authorName: clearable(text(150)),
  publishedAt: clearable(z.coerce.date()),
  metaTitle: clearable(text(200)),
  metaDescription: clearable(text(400)),
}).partial();

/* ---------- settings ---------- */

const url = z.union([z.literal(''), z.url({ protocol: /^https?$/ })]);
const settingSchemas = {
  clinic: z.object({
    name: required(100),
    tagline: text(200),
    phonePrimary: required(30),
    phoneSecondary: text(30).default(''),
    whatsappNumber: z.string().trim().regex(/^\d{10,15}$/, 'Digits only, including the country code (e.g. 919773507333)'),
    email: z.string().trim().toLowerCase().pipe(z.email('Enter a valid email address')),
  }),
  social: z.object({ instagram: url.default(''), facebook: url.default(''), youtube: url.default(''), youtubeRajeev: url.default('') }),
  hero: z.object({
    heading: required(200),
    subheading: text(400),
    primaryCta: required(40),
    secondaryCta: required(40),
    imageUrl: z.union([z.literal(''), imageUrl]).default(''),
    imageAlt: text(200).default(''),
  }),
  announcement: z.object({ enabled: z.boolean(), text: text(200), link: text(300).default('') }),
  whyChooseUs: z.array(z.object({ title: required(100), description: text(300), icon: z.enum(ICON_NAMES).default('sparkles') })).min(1).max(8),
  faq: z.array(z.object({ question: required(200), answer: required(1500) })).max(12),
  hours: z.array(z.object({ days: required(60), time: required(60) })).max(10),
  about: z.object({ heading: required(150), body: text(50000) }),
  seo: z.object({ siteTitle: required(70), siteDescription: text(200) }),
};
const settingKey = z.object({ key: z.enum(SETTING_KEYS) });

/* ---------- users and activity ---------- */

const password = z
  .string()
  .min(8, 'Use at least 8 characters')
  .refine((value) => Buffer.byteLength(value) <= 72, 'Use at most 72 characters')
  .refine((value) => /[A-Za-z]/.test(value) && /\d/.test(value), 'Include at least one letter and one number');
const email = z.string().trim().toLowerCase().pipe(z.email('Enter a valid email address'));

const createUser = z.object({ name: required(150, 'Enter the name'), email, role: z.enum(Object.values(ROLES)), doctorId: optionalId, password });
const updateUser = z.object({
  name: required(150).optional(),
  email: email.optional(),
  role: z.enum(Object.values(ROLES)).optional(),
  doctorId: clearable(id),
  isActive: z.boolean().optional(),
});
const setPassword = z.object({ password });

const activityQuery = z.object({
  q: search,
  userId: optionalId,
  entityType: z.preprocess(emptyToUndefined, z.string().trim().max(50).optional()),
  action: z.preprocess(emptyToUndefined, z.string().trim().max(50).optional()),
  from: optionalDate,
  to: optionalDate,
  ...paging,
});

module.exports = {
  idParam, reorder, vaccine, updateVaccine, vaccineList, markGiven, vaccinationParams, dueQuery,
  createDoctor, updateDoctor, scheduleRows, leave, leaveParams, createLocation, updateLocation,
  createService, updateService, specialty, updateSpecialty, category, updateCategory,
  testimonialList, createTestimonial, updateTestimonial, galleryUpload, galleryUpdate, mediaUpload,
  blogList, createPost, updatePost, settingSchemas, settingKey, createUser, updateUser, setPassword, activityQuery,
};
