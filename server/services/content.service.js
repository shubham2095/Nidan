const { Op } = require('sequelize');
const {
  Location, Service, Specialty, Testimonial, GalleryCategory, BlogCategory,
} = require('../models');
const ApiError = require('../utils/ApiError');
const { slugify, uniqueSlug } = require('../utils/slug');
const { sanitizeRichText } = require('../utils/sanitize');
const { mapsSearchUrl, mapsEmbedUrl, locationQuery } = require('../utils/maps');
const { pageWindow, pageResult } = require('../utils/pagination');
const createCrud = require('./crud.factory');
const activityLog = require('./activityLog.service');
const mediaService = require('./media.service');

/** Gives a row a unique slug from its explicit slug or its name. */
const withSlug = async (Model, input, existing, source) => {
  const wanted = input.slug || (existing ? null : input[source]);
  if (!wanted) return input;
  return { ...input, slug: await uniqueSlug(Model, slugify(wanted), { exceptId: existing?.id }) };
};

/* ---------- locations ---------- */

const locations = createCrud({
  Model: Location,
  entity: 'location',
  label: 'Location',
  prepare: async (input, existing) => {
    const next = await withSlug(Location, input, existing, 'name');
    // Same defaults the database applies, so the generated link is identical whether built now or re-derived later.
    const merged = { city: 'Noida', state: 'Uttar Pradesh', ...(existing ? existing.toJSON() : {}), ...next };
    const query = locationQuery(merged);

    // Map links are generated from the address unless a custom one was typed in (and kept up to date while auto-generated).
    const autoMap = !existing?.mapUrl || existing.mapUrl === mapsSearchUrl(locationQuery(existing));    if (!next.mapUrl && autoMap) next.mapUrl = mapsSearchUrl(query);
    const autoEmbed = !existing?.mapEmbedUrl || existing.mapEmbedUrl === mapsEmbedUrl(locationQuery(existing));
    if (!next.mapEmbedUrl && autoEmbed) next.mapEmbedUrl = mapsEmbedUrl(query);
    return next;
  },
});

/* ---------- services ---------- */

const services = createCrud({
  Model: Service,
  entity: 'service',
  label: 'Service',
  prepare: async (input, existing) => {
    const next = await withSlug(Service, input, existing, 'name');
    if (next.description !== undefined) next.description = sanitizeRichText(next.description);
    return next;
  },
  beforeRemove: (row) => mediaService.removeByUrl(row.imageUrl),
});

/* ---------- specialties ---------- */

const specialties = createCrud({ Model: Specialty, entity: 'specialty', label: 'Specialty', describe: (row) => row.title });

/* ---------- categories ---------- */

const galleryCategories = createCrud({
  Model: GalleryCategory,
  entity: 'gallery_category',
  label: 'Gallery category',
  prepare: (input, existing) => withSlug(GalleryCategory, input, existing, 'name'),
});

const blogCategories = createCrud({
  Model: BlogCategory,
  entity: 'blog_category',
  label: 'Blog category',
  order: [['name', 'ASC']],
  prepare: (input, existing) => withSlug(BlogCategory, input, existing, 'name'),
});

/* ---------- testimonials (moderation) ---------- */

const testimonialCrud = createCrud({
  Model: Testimonial,
  entity: 'testimonial',
  label: 'Testimonial',
  order: [['createdAt', 'DESC']],
  describe: (row) => `from ${row.name}`,
});

const serializeTestimonial = (row) => ({
  id: row.id,
  name: row.name,
  label: row.label,
  content: row.content,
  rating: row.rating,
  status: row.status,
  source: row.source,
  sortOrder: row.sortOrder,
  createdAt: row.createdAt,
});

const listTestimonials = async ({ status, page, pageSize }) => {
  const { rows, count } = await Testimonial.findAndCountAll({
    where: status ? { status } : {},
    order: [['createdAt', 'DESC'], ['id', 'DESC']],
    ...pageWindow({ page, pageSize }),
  });
  const pending = await Testimonial.count({ where: { status: 'pending' } });
  return { ...pageResult(rows.map(serializeTestimonial), count, { page, pageSize }), pendingCount: pending };
};

const createTestimonial = async (actor, input, req) => {
  const row = await Testimonial.create({ ...input, status: input.status || 'approved', source: 'admin', consentAt: new Date() });
  await activityLog.record({ user: actor, entityType: 'testimonial', entityId: row.id, action: 'create', summary: `Added testimonial from ${row.name}`, req });
  return serializeTestimonial(row);
};

const updateTestimonial = async (actor, id, input, req) => {
  const row = await Testimonial.findByPk(id);
  if (!row) throw ApiError.notFound('Testimonial not found');
  const before = row.status;
  await row.update(input);
  const statusChanged = input.status && input.status !== before;
  await activityLog.record({
    user: actor,
    entityType: 'testimonial',
    entityId: id,
    action: statusChanged ? 'status_change' : 'update',
    summary: statusChanged ? `Testimonial from ${row.name}: ${before} -> ${row.status}` : `Edited testimonial from ${row.name}`,
    req,
  });
  return serializeTestimonial(row);
};

const removeTestimonial = (actor, id, req) => testimonialCrud.remove(actor, id, req);

module.exports = {
  locations, services, specialties, galleryCategories, blogCategories,
  listTestimonials, createTestimonial, updateTestimonial, removeTestimonial,
};
