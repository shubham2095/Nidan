// The browser-supplied file name and MIME type can be faked, so uploads are identified from their first bytes.
const SIGNATURES = [
  { mime: 'application/pdf', extension: '.pdf', matches: (b) => b.length > 5 && b.subarray(0, 5).toString('latin1') === '%PDF-' },
  { mime: 'image/jpeg', extension: '.jpg', matches: (b) => b.length > 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  {
    mime: 'image/png',
    extension: '.png',
    matches: (b) => b.length > 8 && b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])),
  },
  {
    mime: 'image/webp',
    extension: '.webp',
    matches: (b) => b.length > 12 && b.subarray(0, 4).toString('latin1') === 'RIFF' && b.subarray(8, 12).toString('latin1') === 'WEBP',
  },
];

/** { mime, extension } for a PDF / JPEG / PNG / WebP buffer, otherwise null. */
const detectFileType = (buffer) => SIGNATURES.find((type) => type.matches(buffer)) || null;

module.exports = { detectFileType };
