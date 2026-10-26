const { Op } = require('sequelize');
const {
  Setting, Location, Doctor, DoctorSchedule, Service, Specialty, Testimonial,
  GalleryCategory, GalleryImage, BlogPost, BlogCategory,
} = require('../models');
const ApiError = require('../utils/ApiError');
const { sanitizeRichText, stripHtml } = require('../utils/sanitize');

// Only these settings are visible to visitors; anything else stays private.
const PUBLIC_SETTING_KEYS = ['clinic', 'social', 'hero', 'announcement', 'whyChooseUs', 'faq', 'about', 'seo'];
const BLOG_PAGE_SIZE = 9;
const WORDS_PER_MINUTE = 200;

/* ---------- serializers (only whitelisted fields leave the server) ---------- */

const serializeLocation = (location) => ({
  id: location.id,
  name: location.name,
  slug: location.slug,
  address: location.address,
  city: location.city,
  state: location.state,
  postalCode: location.postalCode,
  phone: location.phone,
  mapUrl: location.mapUrl,
  mapEmbedUrl: location.mapEmbedUrl,
  isOwnClinic: location.isOwnClinic,
});

const serializeDoctor = (doctor, schedules = []) => ({
  id: doctor.id,
  name: doctor.name,
  slug: doctor.slug,
  designation: doctor.designation,
  qualifications: doctor.qualifications,
  highlights: doctor.highlights,
  specialities: doctor.specialities,
  bio: sanitizeRichText(doctor.bio),
  quote: doctor.quote,
  photoUrl: doctor.photoUrl,
  metaTitle: doctor.metaTitle,
  metaDescription: doctor.metaDescription,
  schedules,
});

const serializeService = (service, { withDescription = false } = {}) => ({
  id: service.id,
  name: service.name,
  slug: service.slug,
  icon: service.icon,
  imageUrl: service.imageUrl,
  shortDescription: service.shortDescription,
  ...(withDescription && {
    description: sanitizeRichText(service.description),
    metaTitle: service.metaTitle,
    metaDescription: service.metaDescription,
  }),
});

const serializeSpecialty = (specialty) => ({
  id: specialty.id,
  title: specialty.title,
  description: specialty.description,
  icon: specialty.icon,
});

const serializeTestimonial = (testimonial) => ({
  id: testimonial.id,
  name: testimonial.name,
  label: testimonial.label,
  content: testimonial.content,
  rating: testimonial.rating,
});

const serializeImage = (image) => ({
  id: image.id,
  title: image.title,
  altText: image.altText,
  imageUrl: image.imageUrl,
  categoryId: image.categoryId,
});

const serializePost = (post, { withContent = false } = {}) => {
  const plain = stripHtml(post.content);
  return {
    id: post.id,
    title: post.title,
    slug: post.slug,
    excerpt: post.excerpt || (plain.length > 180 ? `${plain.slice(0, 177)}...` : plain),
    coverImageUrl: post.coverImageUrl,
    authorName: post.authorName,
    publishedAt: post.publishedAt,
    readingMinutes: Math.max(1, Math.round(plain.split(' ').length / WORDS_PER_MINUTE)),
    category: post.category ? { id: post.category.id, name: post.category.name, slug: post.category.slug } : null,
    ...(withContent && {
      content: sanitizeRichText(post.content),
      metaTitle: post.metaTitle,
      metaDescription: post.metaDescription,
    }),
  };
};

/* ---------- queries ---------- */

const activeLocations = () => Location.findAll({ where: { isActive: true }, order: [['sortOrder', 'ASC'], ['id', 'ASC']] });

/** Which doctors sit at each location and when, for the footer: Map of locationId -> [{ name, slug, slots }]. */
const loadTimingsByLocation = async (locations) => {
  const [doctors, rows] = await Promise.all([
    Doctor.findAll({ where: { isActive: true }, attributes: ['id', 'name', 'slug'], order: [['sortOrder', 'ASC'], ['id', 'ASC']] }),
    DoctorSchedule.findAll({
      where: { locationId: locations.map((location) => location.id), isActive: true },
      order: [['startTime', 'ASC'], ['weekday', 'ASC']],
    }),
  ]);

  const byLocation = new Map(locations.map((location) => [location.id, []]));
  for (const location of locations) {
    for (const doctor of doctors) {
      const slots = rows
        .filter((row) => row.doctorId === doctor.id && row.locationId === location.id)
        .map(({ weekday, startTime, endTime }) => ({ weekday, startTime, endTime }));
      if (slots.length) byLocation.get(location.id).push({ name: doctor.name, slug: doctor.slug, slots });
    }
  }
  return byLocation;
};

const getSite = async () => {
  const [settingRows, locations, services] = await Promise.all([
    Setting.findAll({ where: { settingKey: PUBLIC_SETTING_KEYS } }),
    activeLocations(),
    // names and addresses only: the footer links to each service page
    Service.findAll({ where: { isActive: true }, attributes: ['name', 'slug'], order: [['sortOrder', 'ASC'], ['id', 'ASC']] }),
  ]);
  const timings = await loadTimingsByLocation(locations);
  return {
    settings: Object.fromEntries(settingRows.map((row) => [row.settingKey, row.settingValue])),
    locations: locations.map((location) => ({ ...serializeLocation(location), doctors: timings.get(location.id) })),
    services: services.map((service) => ({ name: service.name, slug: service.slug })),
  };
};

/** Groups each doctor's weekly schedule by location, ordered like the locations list. */
const loadSchedules = async (doctorIds) => {
  const rows = await DoctorSchedule.findAll({
    where: { doctorId: doctorIds, isActive: true },
    include: [{ model: Location, as: 'location', where: { isActive: true } }],
    order: [['startTime', 'ASC'], ['weekday', 'ASC']],
  });

  const byDoctor = new Map();
  for (const row of rows) {
    const groups = byDoctor.get(row.doctorId) || new Map();
    const group = groups.get(row.locationId) || { location: row.location, slots: [] };
    group.slots.push({ weekday: row.weekday, startTime: row.startTime, endTime: row.endTime });
    groups.set(row.locationId, group);
    byDoctor.set(row.doctorId, groups);
  }

  return (doctorId) =>
    [...(byDoctor.get(doctorId)?.values() || [])]
      .sort((a, b) => a.location.sortOrder - b.location.sortOrder)
      .map((group) => ({ location: serializeLocation(group.location), slots: group.slots }));
};

const listDoctors = async () => {
  const doctors = await Doctor.findAll({ where: { isActive: true }, order: [['sortOrder', 'ASC'], ['id', 'ASC']] });
  const schedulesFor = await loadSchedules(doctors.map((doctor) => doctor.id));
  return doctors.map((doctor) => serializeDoctor(doctor, schedulesFor(doctor.id)));
};

const getDoctor = async (slug) => {
  const doctor = await Doctor.findOne({ where: { slug, isActive: true } });
  if (!doctor) throw ApiError.notFound('Doctor not found');
  const schedulesFor = await loadSchedules([doctor.id]);
  return serializeDoctor(doctor, schedulesFor(doctor.id));
};

const listServices = async () => {
  const services = await Service.findAll({ where: { isActive: true }, order: [['sortOrder', 'ASC'], ['id', 'ASC']] });
  return services.map((service) => serializeService(service));
};

const getService = async (slug) => {
  const service = await Service.findOne({ where: { slug, isActive: true } });
  if (!service) throw ApiError.notFound('Service not found');
  return serializeService(service, { withDescription: true });
};

const listSpecialties = async () => {
  const specialties = await Specialty.findAll({ where: { isActive: true }, order: [['sortOrder', 'ASC'], ['id', 'ASC']] });
  return specialties.map(serializeSpecialty);
};

const listTestimonials = async (limit) => {
  const testimonials = await Testimonial.findAll({
    where: { status: 'approved' },
    order: [['sortOrder', 'ASC'], ['id', 'DESC']],
    ...(limit && { limit }),
  });
  return testimonials.map(serializeTestimonial);
};

/** Visitor submissions always start as "pending" and are shown only after a staff member approves them. */
const createTestimonial = async ({ name, label, content, rating }) => {
  await Testimonial.create({ name, label, content, rating, status: 'pending', source: 'website', consentAt: new Date() });
};

const getGallery = async ({ limit } = {}) => {
  const [categories, images] = await Promise.all([
    GalleryCategory.findAll({ order: [['sortOrder', 'ASC'], ['id', 'ASC']] }),
    GalleryImage.findAll({ where: { isActive: true }, order: [['sortOrder', 'ASC'], ['id', 'DESC']], ...(limit && { limit }) }),
  ]);
  const usedCategoryIds = new Set(images.map((image) => image.categoryId));
  return {
    categories: categories
      .filter((category) => usedCategoryIds.has(category.id))
      .map((category) => ({ id: category.id, name: category.name, slug: category.slug })),
    images: images.map(serializeImage),
  };
};

const publishedWhere = () => ({ status: 'published', publishedAt: { [Op.lte]: new Date() } });

const escapeLike = (value) => value.replace(/[\\%_]/g, '\\$&');

const listPosts = async ({ page = 1, category, q } = {}) => {
  const where = publishedWhere();
  if (q) {
    const pattern = `%${escapeLike(q)}%`;
    where[Op.or] = [{ title: { [Op.like]: pattern } }, { excerpt: { [Op.like]: pattern } }];
  }

  const { rows, count } = await BlogPost.findAndCountAll({
    where,
    include: [{ model: BlogCategory, as: 'category', required: Boolean(category), ...(category && { where: { slug: category } }) }],
    order: [['publishedAt', 'DESC'], ['id', 'DESC']],
    limit: BLOG_PAGE_SIZE,
    offset: (page - 1) * BLOG_PAGE_SIZE,
    distinct: true,
  });

  return {
    items: rows.map((post) => serializePost(post)),
    page,
    pageSize: BLOG_PAGE_SIZE,
    total: count,
    totalPages: Math.max(1, Math.ceil(count / BLOG_PAGE_SIZE)),
  };
};

const listPostCategories = async () => {
  const categories = await BlogCategory.findAll({
    include: [{ model: BlogPost, as: 'posts', attributes: [], required: true, where: publishedWhere() }],
    order: [['name', 'ASC']],
  });
  return categories.map((category) => ({ id: category.id, name: category.name, slug: category.slug }));
};

const getPost = async (slug) => {
  const post = await BlogPost.findOne({
    where: { ...publishedWhere(), slug },
    include: [{ model: BlogCategory, as: 'category' }],
  });
  if (!post) throw ApiError.notFound('Article not found');

  const related = await BlogPost.findAll({
    where: { ...publishedWhere(), id: { [Op.ne]: post.id }, ...(post.categoryId && { categoryId: post.categoryId }) },
    include: [{ model: BlogCategory, as: 'category' }],
    order: [['publishedAt', 'DESC']],
    limit: 3,
  });
  return { ...serializePost(post, { withContent: true }), related: related.map((item) => serializePost(item)) };
};

/** Everything the home page needs in a single round trip. */
const getHome = async () => {
  const [doctors, services, specialties, testimonials, gallery, posts] = await Promise.all([
    listDoctors(),
    listServices(),
    listSpecialties(),
    listTestimonials(9),
    getGallery({ limit: 8 }),
    listPosts({ page: 1 }),
  ]);
  return { doctors, services, specialties, testimonials, gallery, posts: posts.items.slice(0, 3) };
};

module.exports = {
  getSite, getHome, listDoctors, getDoctor, listServices, getService, listSpecialties,
  listTestimonials, createTestimonial, getGallery, listPosts, listPostCategories, getPost,
};
