import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { formatDateOnly } from '../../utils/format.js';

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

/** Month calendar where only dates with free slots can be chosen. `dates` = [{ date: 'YYYY-MM-DD', slots }] */
export default function DatePicker({ dates, value, onChange }) {
  const available = useMemo(() => new Map(dates.map((item) => [item.date, item.slots])), [dates]);
  const months = useMemo(() => [...new Set(dates.map((item) => item.date.slice(0, 7)))], [dates]);
  const [monthIndex, setMonthIndex] = useState(0);

  useEffect(() => {
    const selected = value ? months.indexOf(value.slice(0, 7)) : 0;
    setMonthIndex(selected >= 0 ? selected : 0);
  }, [months, value]);

  const month = months[Math.min(monthIndex, months.length - 1)];
  const [year, monthNumber] = month.split('-').map(Number);
  const leadingBlanks = (new Date(Date.UTC(year, monthNumber - 1, 1)).getUTCDay() + 6) % 7; // Monday first
  const daysInMonth = new Date(Date.UTC(year, monthNumber, 0)).getUTCDate();
  const monthLabel = new Intl.DateTimeFormat('en-IN', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(Date.UTC(year, monthNumber - 1, 1)));

  const navButton = 'grid h-10 w-10 place-items-center rounded-full border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40';

  return (
    <div className="mx-auto max-w-sm">
      <div className="mb-3 flex items-center justify-between">
        <button type="button" onClick={() => setMonthIndex((index) => index - 1)} disabled={monthIndex <= 0} aria-label="Previous month" className={navButton}>
          <ChevronLeft className="h-5 w-5" aria-hidden="true" />
        </button>
        <h3 className="font-heading text-lg font-extrabold" aria-live="polite">
          {monthLabel}
        </h3>
        <button type="button" onClick={() => setMonthIndex((index) => index + 1)} disabled={monthIndex >= months.length - 1} aria-label="Next month" className={navButton}>
          <ChevronRight className="h-5 w-5" aria-hidden="true" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center">
        {WEEKDAYS.map((day) => (
          <span key={day} className="py-1 text-xs font-semibold text-slate-500">
            {day}
          </span>
        ))}
        {Array.from({ length: leadingBlanks }, (_, index) => (
          <span key={`blank-${index}`} />
        ))}
        {Array.from({ length: daysInMonth }, (_, index) => {
          const day = index + 1;
          const date = `${month}-${String(day).padStart(2, '0')}`;
          const slots = available.get(date);
          const selected = date === value;
          return (
            <button
              key={date}
              type="button"
              disabled={!slots}
              onClick={() => onChange(date)}
              aria-pressed={selected}
              aria-label={`${formatDateOnly(date)}${slots ? `, ${slots} times available` : ', not available'}`}
              className={`aspect-square rounded-xl text-sm font-semibold transition-colors ${
                selected
                  ? 'bg-brand-700 text-white'
                  : slots
                    ? 'bg-brand-50 text-brand-900 hover:bg-brand-100'
                    : 'text-slate-300'
              }`}
            >
              {day}
            </button>
          );
        })}
      </div>
      <p className="mt-3 text-center text-xs text-slate-500">Greyed-out days have no free appointments.</p>
    </div>
  );
}
