const seo = require('../services/seo.service');

const robots = (req, res) => {
  res.type('text/plain').set('Cache-Control', 'public, max-age=3600').send(seo.robotsTxt());
};

const sitemap = async (req, res) => {
  const xml = await seo.sitemapXml();
  res.type('application/xml').set('Cache-Control', 'public, max-age=3600').send(xml);
};

/**
 * Serves the React app's index.html with this page's own <head> (title, description, canonical, Open Graph), so link
 * previews and search engines see real text without running JavaScript. Missing pages answer 404.
 */
const page = (template) => async (req, res) => {
  if (!template) return res.status(503).type('text/plain').send('The website has not been built yet. Run `npm run build`.');

  const meta = await seo.metaFor(req.path);
  res.status(meta.status).set('Cache-Control', 'no-cache');
  if (meta.noindex) res.set('X-Robots-Tag', 'noindex, nofollow');
  return res.type('html').send(seo.renderPage(template, meta));
};

module.exports = { robots, sitemap, page };
