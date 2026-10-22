const sanitizeHtml = require('sanitize-html');

const RICH_TEXT = {
  allowedTags: [
    'h2', 'h3', 'h4', 'p', 'br', 'hr', 'strong', 'b', 'em', 'i', 'u',
    'ul', 'ol', 'li', 'blockquote', 'a', 'img', 'figure', 'figcaption',
  ],
  allowedAttributes: {
    a: ['href', 'title', 'target', 'rel'],
    img: ['src', 'alt', 'title', 'width', 'height', 'loading'],
  },
  allowedSchemes: ['http', 'https', 'mailto', 'tel'],
  allowedSchemesByTag: { img: ['http', 'https'] },
  allowProtocolRelative: false,
  transformTags: {
    a: (tagName, attribs) => ({
      tagName,
      attribs: attribs.target === '_blank' ? { ...attribs, rel: 'noopener noreferrer' } : attribs,
    }),
    img: sanitizeHtml.simpleTransform('img', { loading: 'lazy' }),
  },
};

/** Cleans admin-authored HTML (bios, blog posts, service pages) before it reaches visitors. */
const sanitizeRichText = (html) => sanitizeHtml(html || '', RICH_TEXT);

/** Plain text version, used for excerpts and reading time. */
const stripHtml = (html) =>
  sanitizeHtml(html || '', { allowedTags: [], allowedAttributes: {} })
    .replace(/\s+/g, ' ')
    .trim();

module.exports = { sanitizeRichText, stripHtml };
