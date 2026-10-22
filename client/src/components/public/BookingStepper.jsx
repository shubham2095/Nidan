import { Check } from 'lucide-react';

export const BOOKING_STEPS = ['Doctor', 'Location', 'Date', 'Time', 'Details'];

/** Progress indicator. Steps already completed can be clicked to go back and change a choice. */
export default function BookingStepper({ current, onGo }) {
  return (
    <div>
      <p className="text-sm font-semibold text-brand-800 sm:hidden" aria-live="polite">
        Step {current} of {BOOKING_STEPS.length}: {BOOKING_STEPS[current - 1]}
      </p>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100 sm:hidden" aria-hidden="true">
        <div className="h-full rounded-full bg-brand-600 transition-all" style={{ width: `${(current / BOOKING_STEPS.length) * 100}%` }} />
      </div>

      <ol className="hidden items-center sm:flex" aria-label="Booking progress">
        {BOOKING_STEPS.map((label, index) => {
          const number = index + 1;
          const done = number < current;
          const active = number === current;
          return (
            <li key={label} className="flex flex-1 items-center last:flex-none">
              <button
                type="button"
                disabled={!done}
                onClick={() => onGo(number)}
                aria-current={active ? 'step' : undefined}
                className="flex items-center gap-2 text-sm font-semibold disabled:cursor-default"
              >
                <span
                  className={`grid h-8 w-8 place-items-center rounded-full text-sm transition-colors ${
                    done ? 'bg-brand-700 text-white' : active ? 'bg-brand-100 text-brand-800 ring-2 ring-brand-600' : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {done ? <Check className="h-4 w-4" aria-hidden="true" /> : number}
                </span>
                <span className={active ? 'text-slate-900' : done ? 'text-brand-800' : 'text-slate-500'}>{label}</span>
              </button>
              {number < BOOKING_STEPS.length && <span aria-hidden="true" className={`mx-3 h-0.5 flex-1 rounded ${done ? 'bg-brand-600' : 'bg-slate-200'}`} />}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
