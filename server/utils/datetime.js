const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');
const env = require('../config/env');

dayjs.extend(utc);
dayjs.extend(timezone);

/**
 * Appointment dates and times are clinic wall-clock (Asia/Kolkata): dates are "YYYY-MM-DD"
 * strings and times are "HH:mm:ss" strings, never JavaScript Dates, so no timezone shift can occur.
 */

/** Current date and minutes-since-midnight in India. */
const nowInIndia = () => {
  const now = dayjs().tz(env.timezone);
  return { date: now.format('YYYY-MM-DD'), minutes: now.hour() * 60 + now.minute() };
};

const pad = (value) => String(value).padStart(2, '0');

const toMinutes = (time) => {
  const [hours, minutes] = String(time).split(':').map(Number);
  return hours * 60 + minutes;
};

const toTime = (minutes) => `${pad(Math.floor(minutes / 60))}:${pad(minutes % 60)}:00`;

const isValidDate = (value) => /^\d{4}-\d{2}-\d{2}$/.test(value) && dayjs.utc(value).format('YYYY-MM-DD') === value;

const addDays = (date, days) => dayjs.utc(date).add(days, 'day').format('YYYY-MM-DD');

/** 0 = Sunday ... 6 = Saturday, matching doctor_schedules.weekday */
const weekdayOf = (date) => dayjs.utc(date).day();

/** Date a person of the given age was born, approximately (used when only an age is known). */
const dateFromAge = (today, years = 0, months = 0) =>
  dayjs.utc(today).subtract(years, 'year').subtract(months, 'month').format('YYYY-MM-DD');

const formatTime12 = (time) => {
  const minutes = toMinutes(time);
  const hours = Math.floor(minutes / 60);
  const suffix = hours >= 12 ? 'pm' : 'am';
  return `${hours % 12 === 0 ? 12 : hours % 12}:${pad(minutes % 60)} ${suffix}`;
};

const formatDateLong = (date) => dayjs.utc(date).format('dddd, D MMMM YYYY');

module.exports = {
  nowInIndia, toMinutes, toTime, isValidDate, addDays, weekdayOf, dateFromAge, formatTime12, formatDateLong,
};
