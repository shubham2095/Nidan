import { Clock } from 'lucide-react';
import { useSite } from '../../context/SiteContext.jsx';

/**
 * The clinic's opening hours (Site settings > Opening hours).
 *  - default: heading, underline and a row per day range with the time in a coloured tag
 *  - `variant="card"`: tidy rows for a white card (day on the left, time in a pill on the right)
 *  - `variant="dark"`: compact list for the footer
 */
export default function OpeningHours({ variant = 'default', heading = true, className = '' }) {
  const { settings } = useSite();
  const hours = settings.hours || [];
  if (hours.length === 0) return null;

  if (variant === 'dark') {
    return (
      <ul className={`space-y-2 text-sm ${className}`}>
        {hours.map((row) => (
          <li key={`${row.days}-${row.time}`} className="flex items-start gap-2">
            <Clock className="mt-0.5 h-4 w-4 shrink-0 text-blush-300" aria-hidden="true" />
            <span>
              <strong className="font-semibold text-white">{row.days}</strong>
              <span className="block sm:inline"> {row.time}</span>
            </span>
          </li>
        ))}
      </ul>
    );
  }

  if (variant === 'card') {
    return (
      <ul className={`divide-y divide-slate-100 ${className}`}>
        {hours.map((row) => (
          <li key={`${row.days}-${row.time}`} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 py-3.5">
            <span className="font-semibold text-slate-700">{row.days}</span>
            <span className="inline-flex items-center gap-2 rounded-full bg-brand-50 px-3.5 py-1.5 text-sm font-bold text-brand-800">
              <Clock className="h-4 w-4 text-brand-600" aria-hidden="true" />
              {row.time}
            </span>
          </li>
        ))}
      </ul>
    );
  }

  return (
    <div className={className}>
      {heading && (
        <>
          <h2 className="text-3xl font-extrabold tracking-tight text-brand-700 sm:text-4xl">Opening Hours</h2>
          <div aria-hidden="true" className="mt-4 h-0.5 w-20 bg-slate-800" />
        </>
      )}
      <ul className={`${heading ? 'mt-8' : ''} space-y-4`}>
        {hours.map((row) => (
          <li key={`${row.days}-${row.time}`} className="grid items-center gap-x-6 gap-y-2 sm:grid-cols-[minmax(0,1fr)_auto]">
            <span className="text-lg font-bold text-slate-600">{row.days}</span>
            <span className="inline-flex items-center justify-between gap-4 rounded-lg bg-brand-700 px-5 py-2.5 text-base font-bold text-white shadow-sm sm:min-w-[13rem]">
              {row.time}
              <Clock className="h-4 w-4 shrink-0" aria-hidden="true" />
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
