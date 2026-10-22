import { formatTime } from '../../utils/format.js';

const PERIODS = [
  { label: 'Morning', test: (hour) => hour < 12 },
  { label: 'Afternoon', test: (hour) => hour >= 12 && hour < 17 },
  { label: 'Evening', test: (hour) => hour >= 17 },
];

/** Free time slots grouped into morning / afternoon / evening. `slots` = [{ startTime, endTime }] */
export default function SlotPicker({ slots, value, onChange }) {
  return (
    <div className="space-y-6">
      {PERIODS.map(({ label, test }) => {
        const group = slots.filter((slot) => test(Number(slot.startTime.slice(0, 2))));
        if (!group.length) return null;
        return (
          <fieldset key={label}>
            <legend className="mb-3 font-heading text-base font-extrabold">{label}</legend>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
              {group.map((slot) => {
                const selected = slot.startTime === value;
                return (
                  <button
                    key={slot.startTime}
                    type="button"
                    onClick={() => onChange(slot)}
                    aria-pressed={selected}
                    className={`rounded-xl border px-2 py-2.5 text-sm font-semibold transition-colors ${
                      selected ? 'border-brand-700 bg-brand-700 text-white' : 'border-slate-200 bg-white text-slate-800 hover:border-brand-400 hover:bg-brand-50'
                    }`}
                  >
                    {formatTime(slot.startTime)}
                  </button>
                );
              })}
            </div>
          </fieldset>
        );
      })}
    </div>
  );
}
