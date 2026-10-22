const appointments = require('../services/appointment.service');
const bookingService = require('../services/booking.service');
const { nowInIndia } = require('../utils/datetime');
const respond = require('../utils/respond');

const list = respond((req) => appointments.list(req.user, req.valid.query));
const calendar = respond((req) => appointments.calendar(req.user, req.valid.query));
const get = respond((req) => appointments.get(req.user, req.valid.params.id).then((appointment) => ({ appointment })));
const create = respond((req) => appointments.createByStaff(req.user, req.valid.body, req).then((appointment) => ({ appointment })), 201);
const changeStatus = respond((req) => appointments.changeStatus(req.user, req.valid.params.id, req.valid.body, req).then((appointment) => ({ appointment })));
const reschedule = respond((req) => appointments.reschedule(req.user, req.valid.params.id, req.valid.body, req).then((appointment) => ({ appointment })));
const update = respond((req) => appointments.updateDetails(req.user, req.valid.params.id, req.valid.body, req).then((appointment) => ({ appointment })));

// Staff can book same-day and further ahead than the public site allows.
const dates = respond((req) => bookingService.listDates(req.valid.query, { staff: true }));
const slots = respond((req) => bookingService.listSlots(req.valid.query, { staff: true }));

const exportCsv = async (req, res) => {
  const csv = await appointments.exportCsv(req.user, req.valid.query);
  res.set({
    'Content-Type': 'text/csv; charset=utf-8',
    'Content-Disposition': `attachment; filename="appointments-${nowInIndia().date}.csv"`,
    'Cache-Control': 'private, no-store',
  });
  res.send(csv);
};

module.exports = { list, calendar, get, create, changeStatus, reschedule, update, dates, slots, exportCsv };
