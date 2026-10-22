const content = require('../services/publicContent.service');
const leadService = require('../services/lead.service');

const send = (loader) => async (req, res) => {
  res.json(await loader(req));
};

const site = send(() => content.getSite());
const home = send(() => content.getHome());
const doctors = send(async () => ({ items: await content.listDoctors() }));
const doctor = send((req) => content.getDoctor(req.valid.params.slug));
const services = send(async () => ({ items: await content.listServices() }));
const service = send((req) => content.getService(req.valid.params.slug));
const specialties = send(async () => ({ items: await content.listSpecialties() }));
const testimonials = send(async () => ({ items: await content.listTestimonials() }));
const gallery = send(() => content.getGallery());
const posts = send((req) => content.listPosts(req.valid.query));
const postCategories = send(async () => ({ items: await content.listPostCategories() }));
const post = send((req) => content.getPost(req.valid.params.slug));

const submitContact = async (req, res) => {
  // Bots fill the hidden "website" field: pretend it worked but store nothing.
  if (!req.valid.body.website) {
    await leadService.createFromContactForm(req.valid.body, req);
  }
  res.status(201).json({ message: 'Thank you! We have received your message and will call you back soon.' });
};

const submitTestimonial = async (req, res) => {
  if (!req.valid.body.website) {
    await content.createTestimonial(req.valid.body);
  }
  res.status(201).json({ message: 'Thank you for sharing your experience! It will appear on the website after our team reviews it.' });
};

module.exports = {
  site, home, doctors, doctor, services, service, specialties, testimonials,
  gallery, posts, postCategories, post, submitContact, submitTestimonial,
};
