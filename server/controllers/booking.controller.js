const bookingService = require('../services/booking.service');

// Availability changes with every booking, so it must never be cached.
const noStore = (res) => res.set('Cache-Control', 'no-store');

const dates = async (req, res) => {
  noStore(res);
  res.json(await bookingService.listDates(req.valid.query));
};

const slots = async (req, res) => {
  noStore(res);
  res.json(await bookingService.listSlots(req.valid.query));
};

const create = async (req, res) => {
  noStore(res);
  // Bots fill the hidden "website" field: answer like a failure so they get no useful signal, and store nothing.
  if (req.valid.body.website) {
    return res.status(409).json({ message: 'Sorry, that time is no longer available. Please choose another slot.' });
  }
  const booking = await bookingService.createBooking(req.valid.body, req);
  return res.status(201).json({ booking });
};

module.exports = { dates, slots, create };
