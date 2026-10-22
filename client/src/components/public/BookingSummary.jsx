import { CalendarDays, Clock, MapPin, Stethoscope } from 'lucide-react';
import { formatDateOnly, formatTime } from '../../utils/format.js';

/** What has been chosen so far, with a "Change" link for each part. */
export default function BookingSummary({ selection, onGo }) {
  const { doctor, location, date, slot } = selection;
  if (!doctor) return null;

  const rows = [
    { step: 1, label: 'doctor', Icon: Stethoscope, text: doctor.name },
    location && { step: 2, label: 'location', Icon: MapPin, text: location.name },
    date && { step: 3, label: 'date', Icon: CalendarDays, text: formatDateOnly(date) },
    slot && { step: 4, label: 'time', Icon: Clock, text: `${formatTime(slot.startTime)} – ${formatTime(slot.endTime)}` },
  ].filter(Boolean);

  return (
    <ul aria-label="Your selection so far" className="mb-6 grid gap-2 rounded-2xl bg-brand-50 p-4 sm:grid-cols-2">
      {rows.map(({ step, label, Icon, text }) => (
        <li key={step} className="flex items-center justify-between gap-3 text-sm">
          <span className="flex items-center gap-2 font-semibold text-slate-800">
            <Icon className="h-4 w-4 shrink-0 text-brand-700" aria-hidden="true" />
            {text}
          </span>
          <button type="button" onClick={() => onGo(step)} aria-label={`Change ${label}`} className="shrink-0 font-semibold text-brand-700 hover:underline">
            Change
          </button>
        </li>
      ))}
    </ul>
  );
}
