import { useId, useState } from 'react';
import { Clock, MapPin } from 'lucide-react';
import { groupSchedule } from '../../utils/schedule.js';

/** One tab per location; each panel lists the doctor's days and hours there. */
export default function ScheduleTabs({ schedules, showAddress = true }) {
  const [active, setActive] = useState(0);
  const baseId = useId();

  if (!schedules.length) {
    return <p className="text-sm text-slate-500">Timings will be updated soon. Please call us to confirm.</p>;
  }

  const current = schedules[Math.min(active, schedules.length - 1)];

  return (
    <div>
      {/* with a single location there is nothing to choose, so the tab is not shown */}
      <div role="tablist" aria-label="Choose a location" className={schedules.length > 1 ? 'flex flex-wrap gap-2' : 'hidden'}>
        {schedules.map(({ location }, index) => {
          const selected = index === active;
          return (
            <button
              key={location.id}
              type="button"
              role="tab"
              id={`${baseId}-tab-${index}`}
              aria-selected={selected}
              aria-controls={`${baseId}-panel`}
              tabIndex={selected ? 0 : -1}
              onClick={() => setActive(index)}
              onKeyDown={(event) => {
                if (event.key === 'ArrowRight') setActive((index + 1) % schedules.length);
                if (event.key === 'ArrowLeft') setActive((index - 1 + schedules.length) % schedules.length);
              }}
              className={`rounded-full px-3.5 py-1.5 text-sm font-semibold transition-colors ${
                selected ? 'bg-brand-700 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {location.name}
            </button>
          );
        })}
      </div>

      <div
        role="tabpanel"
        id={`${baseId}-panel`}
        aria-labelledby={`${baseId}-tab-${Math.min(active, schedules.length - 1)}`}
        className={`rounded-2xl bg-brand-50/70 p-4 ${schedules.length > 1 ? 'mt-4' : ''}`}
      >
        <ul className="space-y-2">
          {groupSchedule(current.slots).map((line) => (
            <li key={`${line.days}-${line.time}`} className="flex items-start gap-2 text-sm">
              <Clock className="mt-0.5 h-4 w-4 shrink-0 text-brand-700" aria-hidden="true" />
              <span>
                <strong className="font-semibold text-slate-900">{line.days}</strong>
                <span className="text-slate-600"> · {line.time}</span>
              </span>
            </li>
          ))}
        </ul>
        {showAddress && (
          <p className="mt-3 flex items-start gap-2 border-t border-brand-100 pt-3 text-sm text-slate-600">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-blush-500" aria-hidden="true" />
            <span>
              {current.location.address}
              {current.location.mapUrl && (
                <>
                  {' · '}
                  <a href={current.location.mapUrl} target="_blank" rel="noopener noreferrer" className="font-medium text-brand-700 hover:underline">
                    Map
                  </a>
                </>
              )}
            </span>
          </p>
        )}
      </div>
    </div>
  );
}
