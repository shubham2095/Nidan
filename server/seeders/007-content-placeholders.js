const { createOnce } = require('../utils/seedHelpers');

const galleryCategories = [
  { slug: 'clinic', name: 'Our Clinic' },
  { slug: 'team', name: 'Doctors & Team' },
  { slug: 'community', name: 'Events & Community' },
];

const blogCategories = [
  { slug: 'pregnancy', name: 'Pregnancy' },
  { slug: 'newborn-and-child-care', name: 'Newborn & Child Care' },
  { slug: 'vaccination', name: 'Vaccination' },
  { slug: 'fertility', name: 'Fertility' },
  { slug: 'womens-health', name: "Women's Health" },
];

// Placeholders only. They stay "pending" so they never appear on the public site
// until the clinic replaces them with real, consented testimonials.
const testimonials = [
  {
    name: 'TODO: Patient name',
    label: 'TODO: e.g. Mother of a newborn',
    content: 'TODO: Replace with a real patient testimonial (with their consent) before approving.',
  },
  {
    name: 'TODO: Patient name',
    label: 'TODO: e.g. Expecting mother',
    content: 'TODO: Replace with a real patient testimonial (with their consent) before approving.',
  },
  {
    name: 'TODO: Patient name',
    label: 'TODO: e.g. Parent of a toddler',
    content: 'TODO: Replace with a real patient testimonial (with their consent) before approving.',
  },
];

module.exports = {
  async up({ models: { GalleryCategory, BlogCategory, Testimonial } }) {
    for (const [index, { slug, name }] of galleryCategories.entries()) {
      await createOnce(GalleryCategory, { slug }, { name, sortOrder: index + 1 });
    }
    for (const { slug, name } of blogCategories) {
      await createOnce(BlogCategory, { slug }, { name });
    }
    for (const [index, { content, ...values }] of testimonials.entries()) {
      await createOnce(Testimonial, { content, label: values.label }, {
        name: values.name,
        status: 'pending',
        source: 'admin',
        sortOrder: index + 1,
      });
    }
  },
};
