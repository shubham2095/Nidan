const { toMinutes, toTime, addDays, weekdayOf } = require('../utils/datetime');

/**
 * Pure slot logic (no database access), so it is easy to reason about and test.
 *
 * ctx = {
 *   doctor:    { slotMinutes, bookingWindowDays, minNoticeMinutes }
 *   schedules: [{ weekday, startTime, endTime }]   this doctor at ONE location
 *   leaves:    [{ startDate, endDate, startTime, endTime }]   applying to that location
 *   booked:    [{ appointmentDate, startTime, endTime }]      this doctor's active bookings at ANY location
 * }
 * now = { date: 'YYYY-MM-DD', minutes }   current time in India
 *
 * A doctor cannot be in two places at once, so bookings at other locations also block a slot.
 */

const overlaps = (startA, endA, startB, endB) => startA < endB && startB < endA;

/** Free slots on `date`, earliest first: [{ startTime: '18:00:00', endTime: '18:15:00' }] */
const slotsForDate = (ctx, date, now) => {
  const { doctor, schedules, leaves, booked } = ctx;

  if (date < now.date) return [];
  if (date > addDays(now.date, doctor.bookingWindowDays)) return [];

  const dayLeaves = leaves.filter((leave) => leave.startDate <= date && leave.endDate >= date);
  if (dayLeaves.some((leave) => !leave.startTime || !leave.endTime)) return [];

  const blocked = [
    ...dayLeaves.map((leave) => [toMinutes(leave.startTime), toMinutes(leave.endTime)]),
    ...booked
      .filter((appointment) => appointment.appointmentDate === date)
      .map((appointment) => [toMinutes(appointment.startTime), toMinutes(appointment.endTime)]),
  ];

  const earliest = date === now.date ? now.minutes + doctor.minNoticeMinutes : 0;
  const weekday = weekdayOf(date);
  const step = doctor.slotMinutes;
  const slots = new Map();

  for (const schedule of schedules) {
    if (schedule.weekday !== weekday) continue;
    const windowEnd = toMinutes(schedule.endTime);
    for (let start = toMinutes(schedule.startTime); start + step <= windowEnd; start += step) {
      const end = start + step;
      if (start < earliest) continue;
      if (blocked.some(([blockedStart, blockedEnd]) => overlaps(start, end, blockedStart, blockedEnd))) continue;
      slots.set(start, { startTime: toTime(start), endTime: toTime(end) });
    }
  }

  return [...slots.entries()].sort(([a], [b]) => a - b).map(([, slot]) => slot);
};

/** Dates in the booking window that still have at least one free slot: [{ date, slots: 12 }] */
const availableDates = (ctx, now) => {
  const dates = [];
  for (let offset = 0; offset <= ctx.doctor.bookingWindowDays; offset += 1) {
    const date = addDays(now.date, offset);
    const count = slotsForDate(ctx, date, now).length;
    if (count > 0) dates.push({ date, slots: count });
  }
  return dates;
};

module.exports = { slotsForDate, availableDates };
