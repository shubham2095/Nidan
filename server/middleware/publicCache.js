/** Lets browsers and the CDN reuse public content briefly, so pages stay fast but edits show up within a minute. */
const publicCache =
  (seconds = 60) =>
  (req, res, next) => {
    res.set('Cache-Control', `public, max-age=${seconds}, stale-while-revalidate=${seconds * 5}`);
    next();
  };

module.exports = publicCache;
