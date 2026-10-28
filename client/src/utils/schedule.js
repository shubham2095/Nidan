import { formatTime } from './format.js';

// Display order starts on Monday; weekday numbers follow JavaScript (0 = Sunday).
const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0];
const DAY_NAMES = { 0: 'Sun', 1: 'Mon', 2: 'Tue', 3: 'Wed', 4: 'Thu', 5: 'Fri', 6: 'Sat' };
const EVENING_FROM = '16:00:00';

/** [1,2,3,4,5] -> "Mon–Fri", [1,3,5] -> "Mon, Wed, Fri", [6,0] -> "Sat & Sun", all seven -> "Every day" */
export function formatDays(weekdays) {
  const positions = [...new Set(weekdays)].map((day) => WEEK_ORDER.indexOf(day)).sort((a, b) => a - b);
  if (positions.length === 7) return 'Every day';

  const runs = [];
  for (const position of positions) {
    const last = runs[runs.length - 1];
    if (last && position === last[last.length - 1] + 1) last.push(position);
    else runs.push([position]);
  }

  const name = (position) => DAY_NAMES[WEEK_ORDER[position]];
  const parts = runs.map((run) => {
    if (run.length >= 3) return `${name(run[0])}–${name(run[run.length - 1])}`;
    if (run.length === 2) return runs.length === 1 ? `${name(run[0])} & ${name(run[1])}` : `${name(run[0])}, ${name(run[1])}`;
    return name(run[0]);
  });
  return parts.join(', ');
}

/**
 * Turns raw schedule rows into display lines, earliest first:
 * [{ days: "Mon–Fri", time: "9 am – 1 pm" }, { days: "Every day (Evening)", time: "6 pm – 9 pm" }]
 * An "Every day" range that starts at 4 pm or later says "(Evening)", so it is not read as the whole day.
 */
export function groupSchedule(slots = []) {
  const groups = new Map();
  for (const { weekday, startTime, endTime } of slots) {
    const key = `${startTime}|${endTime}`;
    const group = groups.get(key) || { startTime, endTime, weekdays: [] };
    group.weekdays.push(weekday);
    groups.set(key, group);
  }

  return [...groups.values()]
    .sort((a, b) => a.startTime.localeCompare(b.startTime) || a.endTime.localeCompare(b.endTime))
    .map((group) => {
      const days = formatDays(group.weekdays);
      return {
        days: days === 'Every day' && group.startTime >= EVENING_FROM ? `${days} (Evening)` : days,
        time: `${formatTime(group.startTime)} – ${formatTime(group.endTime)}`,
      };
    });
}

/**
 * The locations of a doctor that the website lists: our own clinics only. A partner hospital (a location whose "own
 * clinic" switch is off in Admin > Locations) is left out of these lists on purpose; the booking steps still offer it,
 * because they read `doctor.schedules` directly.
 */
export const ownSchedules = (doctor) => doctor.schedules.filter(({ location }) => location.isOwnClinic);
