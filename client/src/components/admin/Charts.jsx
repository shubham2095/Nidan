import { formatDateOnly } from '../../utils/format.js';

/** Column chart of appointments per day. `data` = [{ date, count, isToday }]. */
export function DayBars({ data }) {
  const max = Math.max(1, ...data.map((item) => item.count));
  const total = data.reduce((sum, item) => sum + item.count, 0);

  return (
    <figure>
      <div role="img" aria-label={`Appointments per day: ${total} in total over ${data.length} days`} className="flex h-44 items-end gap-1.5 sm:gap-2">
        {data.map((item) => (
          <div key={item.date} className="flex h-full flex-1 flex-col justify-end" title={`${formatDateOnly(item.date)}: ${item.count}`}>
            <span className="mb-1 text-center text-xs font-semibold text-slate-600">{item.count || ''}</span>
            <div
              className={`min-h-1 rounded-t-lg ${item.isToday ? 'bg-brand-700' : item.date < data.find((d) => d.isToday)?.date ? 'bg-slate-300' : 'bg-brand-300'}`}
              style={{ height: `${(item.count / max) * 100}%` }}
            />
          </div>
        ))}
      </div>
      <div className="mt-2 flex gap-1.5 sm:gap-2" aria-hidden="true">
        {data.map((item) => (
          <span key={item.date} className={`flex-1 text-center text-[10px] sm:text-xs ${item.isToday ? 'font-bold text-brand-800' : 'text-slate-500'}`}>
            {new Date(`${item.date}T00:00:00Z`).getUTCDate()}
          </span>
        ))}
      </div>
      <figcaption className="mt-3 flex flex-wrap gap-4 text-xs text-slate-500">
        <span className="flex items-center gap-1.5"><i className="inline-block h-2.5 w-2.5 rounded-sm bg-slate-300" /> Past</span>
        <span className="flex items-center gap-1.5"><i className="inline-block h-2.5 w-2.5 rounded-sm bg-brand-700" /> Today</span>
        <span className="flex items-center gap-1.5"><i className="inline-block h-2.5 w-2.5 rounded-sm bg-brand-300" /> Upcoming</span>
      </figcaption>
    </figure>
  );
}

/** Horizontal bars for a short list. `data` = [{ label, count }]. */
export function HorizontalBars({ data, emptyText = 'No data yet' }) {
  if (!data.length) return <p className="py-6 text-center text-sm text-slate-500">{emptyText}</p>;
  const max = Math.max(...data.map((item) => item.count));

  return (
    <ul className="space-y-3">
      {data.map((item) => (
        <li key={item.label}>
          <div className="mb-1 flex justify-between text-sm">
            <span className="font-medium text-slate-700">{item.label}</span>
            <span className="font-semibold text-slate-900">{item.count}</span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
            <div className="h-full rounded-full bg-blush-400" style={{ width: `${(item.count / max) * 100}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
}
