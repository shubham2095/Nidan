const fs = require('fs');
const path = require('path');
const { Op } = require('sequelize');
const { Setting, Doctor, Service, BlogPost } = require('../models');
const env = require('../config/env');
const escapeHtml = require('../utils/escapeHtml');
const { stripHtml } = require('../utils/sanitize');

const SETTINGS_TTL_MS = 60 * 1000;
const SLUG = /^[a-z0-9-]+$/;
let settingsCache = null;

/** Clinic name, tagline and default search text. Cached briefly so every page view does not re-read settings. */
const siteSettings = async () => {
  if (settingsCache && Date.now() - settingsCache.at < SETTINGS_TTL_MS) return settingsCache.value;
  const rows = await Setting.findAll({ where: { settingKey: ['clinic', 'seo', 'hero'] } });
  const byKey = Object.fromEntries(rows.map((row) => [row.settingKey, row.settingValue]));
  settingsCache = { at: Date.now(), value: { clinic: byKey.clinic || {}, seo: byKey.seo || {}, hero: byKey.hero || {} } };
  return settingsCache.value;
};

/** Same word-boundary trimming as the website (client/src/utils/format.js). */
const truncate = (text = '', max = 158) => {
  const clean = text.replace(/\s+/g, ' ').trim();
  if (clean.length <= max) return clean;
  return `${clean.slice(0, max - 1).replace(/\s+\S*$/, '')}…`;
};

// stripHtml() leaves entities such as &amp; encoded; decode them so escapeHtml does not double-encode.
const decodeEntities = (text) =>
  text.replace(/&(amp|lt|gt|quot|#39);/g, (match, name) => ({ amp: '&', lt: '<', gt: '>', quot: '"', '#39': "'" })[name]);

const absolute = (pathOrUrl) => new URL(pathOrUrl, `${env.clientUrl}/`).href;

/* ---------- page meta ---------- */

// Static pages. The text matches the <Seo> tags in client/src/pages/public, so a shared link and the live page agree.
const STATIC_PAGES = {
  '/about-us': (clinic) => ({
    title: 'About Us',
    description: `Learn about ${clinic.name}: ${clinic.tagline}. Meet our doctors and find our clinic in Noida.`,
  }),
  '/doctors': () => ({
    title: 'Our Doctors',
    description: 'Meet Dr. Manisha Ranjan, Obstetrician & Gynaecologist, and Dr. Rajeev Ranjan, Paediatrician & Neonatologist, at Nidan Mother & Child Care in Noida.',
  }),
  '/services': () => ({
    title: 'Our Services',
    description: 'Maternity, gynaecology, fertility, neonatology, paediatrics, fetal medicine, surgery, lactation support and more, all at Nidan Mother & Child Care in Noida.',
  }),
  '/gallery': () => ({
    title: 'Gallery',
    description: 'Take a look inside Nidan Mother & Child Care: our clinic, our team and our community events in Noida.',
  }),
  '/testimonials': () => ({
    title: 'Patient Testimonials',
    description: 'Read what patients and parents say about their experience at Nidan Mother & Child Care in Noida, and share your own.',
  }),
  '/blog': () => ({
    title: 'Blog',
    description: "Practical, friendly advice on pregnancy, newborn care, vaccinations, fertility and women's health from the doctors at Nidan Mother & Child Care.",
  }),
  '/contact-us': (clinic) => ({
    title: 'Contact Us',
    description: `Call, WhatsApp or write to ${clinic.name}. Find our clinics in Noida and Greater Noida, with maps, opening hours and doctor timings.`,
  }),
  '/book-appointment': () => ({
    title: 'Book an Appointment',
    description: 'Book an appointment online with Dr. Manisha Ranjan or Dr. Rajeev Ranjan at Nidan Mother & Child Care, Noida. Choose a doctor, location, date and time.',
  }),
  '/privacy-policy': (clinic) => ({
    title: 'Privacy Policy',
    description: `How ${clinic.name} collects, uses and protects your personal information.`,
  }),
};

const isAdminPath = (pathname) => pathname === '/admin' || pathname.startsWith('/admin/');

/**
 * What the <head> of a public page should say: { status, title, description, url, image, type, noindex }.
 * Unknown addresses and slugs get status 404 so search engines do not index empty pages.
 */
const metaFor = async (pathname) => {
  if (isAdminPath(pathname)) return { status: 200, title: 'Nidan CRM', noindex: true };

  const { clinic, seo, hero } = await siteSettings();
  const siteName = clinic.name || 'Nidan Mother & Child Care';
  const fallbackText = seo.siteDescription || clinic.tagline || '';

  const page = ({ title, description, image, type = 'website', status = 200, noindex = false }) => ({
    status,
    siteName,
    title: title ? `${title} | ${siteName}` : seo.siteTitle || siteName,
    description: truncate(description || fallbackText),
    url: pathname === '/' ? env.clientUrl : absolute(pathname),
    image: image ? absolute(image) : null,
    type,
    noindex,
  });
  const missing = () => page({ title: 'Page not found', status: 404, noindex: true });

  if (pathname === '/') return page({ image: hero.imageUrl }); // the banner picture doubles as the link-preview picture
  if (STATIC_PAGES[pathname]) return page(STATIC_PAGES[pathname](clinic));

  const detail = pathname.match(/^\/(doctors|services|blog)\/([^/]+)$/);
  if (!detail || !SLUG.test(detail[2])) return missing();
  const [, section, slug] = detail;

  if (section === 'doctors') {
    const doctor = await Doctor.findOne({ where: { slug, isActive: true } });
    if (!doctor) return missing();
    return page({
      title: doctor.metaTitle || `${doctor.name} – ${doctor.designation}`,
      description: doctor.metaDescription || `${doctor.name} (${doctor.qualifications}) is a ${doctor.designation} at ${siteName}, Noida. Book an appointment online.`,
      image: doctor.photoUrl,
      type: 'profile',
    });
  }

  if (section === 'services') {
    const service = await Service.findOne({ where: { slug, isActive: true } });
    if (!service) return missing();
    return page({
      title: service.metaTitle || `${service.name} in Noida`,
      description: service.metaDescription || service.shortDescription,
      image: service.imageUrl,
    });
  }

  const post = await BlogPost.findOne({ where: { slug, status: 'published', publishedAt: { [Op.lte]: new Date() } } });
  if (!post) return missing();
  return page({
    title: post.metaTitle || post.title,
    description: post.metaDescription || post.excerpt || decodeEntities(stripHtml(post.content)),
    image: post.coverImageUrl,
    type: 'article',
  });
};

/* ---------- HTML template ---------- */

/** Reads the built index.html once. Returns null when `npm run build` has not run yet. */
const readTemplate = (distDir) => {
  const file = path.join(distDir, 'index.html');
  return fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : null;
};

// Tags carry data-rh="true" so react-helmet-async replaces them with its own once the page has loaded,
// instead of leaving duplicates behind.
const metaTag = (attributes) =>
  `<meta data-rh="true" ${Object.entries(attributes).map(([key, value]) => `${key}="${escapeHtml(value)}"`).join(' ')} />`;

/** Puts the page's own title, description, canonical URL and Open Graph tags into index.html. */
const renderPage = (template, meta) => {
  const lines = [];
  if (meta.noindex) lines.push(metaTag({ name: 'robots', content: 'noindex, nofollow' }));
  if (meta.description !== undefined) {
    lines.push(
      metaTag({ name: 'description', content: meta.description }),
      `<link data-rh="true" rel="canonical" href="${escapeHtml(meta.url)}" />`,
      metaTag({ property: 'og:site_name', content: meta.siteName }),
      metaTag({ property: 'og:type', content: meta.type }),
      metaTag({ property: 'og:title', content: meta.title }),
      metaTag({ property: 'og:description', content: meta.description }),
      metaTag({ property: 'og:url', content: meta.url }),
      metaTag({ property: 'og:locale', content: 'en_IN' }),
      ...(meta.image ? [metaTag({ property: 'og:image', content: meta.image })] : []),
      metaTag({ name: 'twitter:card', content: meta.image ? 'summary_large_image' : 'summary' }),
      metaTag({ name: 'twitter:title', content: meta.title }),
      metaTag({ name: 'twitter:description', content: meta.description }),
      ...(meta.image ? [metaTag({ name: 'twitter:image', content: meta.image })] : []),
    );
  }

  // `() =>` replacements keep "$&"-style sequences in page text from being treated as patterns.
  return template
    .replace(/<title>[\s\S]*?<\/title>/, () => `<title>${escapeHtml(meta.title)}</title>`)
    .replace(/<meta\s+name="description"[\s\S]*?\/>\s*/, () => '')
    .replace('</head>', () => `${lines.join('\n    ')}\n  </head>`);
};

/* ---------- robots.txt and sitemap.xml ---------- */

const robotsTxt = () =>
  env.isProd
    ? ['User-agent: *', 'Disallow: /admin', 'Disallow: /api/', '', `Sitemap: ${env.clientUrl}/sitemap.xml`, ''].join('\n')
    : 'User-agent: *\nDisallow: /\n'; // never let a staging or local copy be indexed

const day = (value) => new Date(value).toISOString().slice(0, 10);

const sitemapXml = async () => {
  const [doctors, services, posts] = await Promise.all([
    Doctor.findAll({ where: { isActive: true }, attributes: ['slug', 'updatedAt'], order: [['sortOrder', 'ASC'], ['id', 'ASC']] }),
    Service.findAll({ where: { isActive: true }, attributes: ['slug', 'updatedAt'], order: [['sortOrder', 'ASC'], ['id', 'ASC']] }),
    BlogPost.findAll({
      where: { status: 'published', publishedAt: { [Op.lte]: new Date() } },
      attributes: ['slug', 'updatedAt'],
      order: [['publishedAt', 'DESC']],
    }),
  ]);

  const entries = [
    { loc: '/' },
    ...Object.keys(STATIC_PAGES).map((loc) => ({ loc })),
    ...doctors.map((doctor) => ({ loc: `/doctors/${doctor.slug}`, lastmod: doctor.updatedAt })),
    ...services.map((service) => ({ loc: `/services/${service.slug}`, lastmod: service.updatedAt })),
    ...posts.map((post) => ({ loc: `/blog/${post.slug}`, lastmod: post.updatedAt })),
  ];

  const urls = entries
    .map(({ loc, lastmod }) => `  <url><loc>${escapeHtml(absolute(loc))}</loc>${lastmod ? `<lastmod>${day(lastmod)}</lastmod>` : ''}</url>`)
    .join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
};

module.exports = { metaFor, readTemplate, renderPage, robotsTxt, sitemapXml };
