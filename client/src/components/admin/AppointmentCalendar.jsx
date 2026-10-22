import { ChevronLeft, ChevronRight } from 'lucide-react';
import { EmptyState, ErrorState, LoadingState } from '../public/States.jsx';
import useFetch from '../../hooks/useFetch.js';
import { getCalendar } from '../../services/crmService.js';
import { addDaysIso, todayIso, weekStartIso } from '../../utils/crm.js';
import { formatDateOnly, formatTime } from '../../utils/format.js';
import Button from '../public/Button.jsx';

const BORDER = {
  pending: 'border-l-amber-400 bg-amber-50',
  confirmed: 'border-l-sky-500 bg-sky-50',
  completed: 'border-l-emerald-500 bg-emerald-50',
  no_show: 'border-l-red-500 bg-red-50',
  cancelled: 'border-l-slate-300 bg-slate-50 opacity-70',
};

function Item({ item, onOpen, showDoctor }) {
  return (
    <button
      type="button"
      onClick={() => onOpen(item)}
      className={`block w-full rounded-lg border-l-4 px-2.5 py-1.5 text-left text-xs transition hover:shadow-md ${BORDER[item.status]}`}
    >
      <span className={`block font-bold text-slate-900 ${item.status === 'cancelled' ? 'line-through' : ''}`}>{formatTime(item.startTime)}</span>
      <span className="block truncate font-semibold text-slate-800">{item.patient?.name}</span>
      {showDoctor && <span className="block truncate text-slate-500">{item.doctor.name}</span>}
    </button>
  );
}

/** Day or week calendar. `anchor` is any date inside the period being shown. */
export default function AppointmentCalendar({ view, anchor, filters, onAnchorChange, onViewChange, onOpen }) {
  const today = todayIso();
  const weekStart = weekStartIso(anchor);
  const days = view === 'week' ? Array.from({ length: 7 }, (_, index) => addDaysIso(weekStart, index)) : [anchor];
  const from = days[0];
  const to = days[days.length - 1];
  const step = view === 'week' ? 7 : 1;

  const { data, loading, error, reload } = useFetch(
    (signal) => getCalendar({ from, to, doctorId: filters.doctorId || undefined, locationId: filters.locationId || undefined }, signal),
    [from, to, filters.doctorId, filters.locationId],
  );

  const byDay = new Map(days.map((day) => [day, []]));
  for (const item of data?.items || []) byDay.get(item.appointmentDate)?.push(item);

  const title = view === 'week' ? `${formatDateOnly(from, { short: true })} – ${formatDateOnly(to, { short: true })}` : formatDateOnly(anchor);

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 print:hidden">
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => onAnchorChange(addDaysIso(anchor, -step))} aria-label="Previous" className="grid h-10 w-10 place-items-center rounded-full border border-slate-200 bg-white hover:bg-slate-50">
            <ChevronLeft className="h-5 w-5" aria-hidden="true" />
          </button>
          <button type="button" onClick={() => onAnchorChange(addDaysIso(anchor, step))} aria-label="Next" className="grid h-10 w-10 place-items-center rounded-full border border-slate-200 bg-white hover:bg-slate-50">
            <ChevronRight className="h-5 w-5" aria-hidden="true" />
          </button>
          <Button variant="outline" onClick={() => onAnchorChange(today)}>
            Today
          </Button>
          <h2 className="ml-2 font-heading text-lg font-extrabold">{title}</h2>
        </div>
        <div role="group" aria-label="Calendar view" className="flex rounded-full bg-slate-100 p-1 text-sm font-semibold">
          {['day', 'week'].map((option) => (
            <button key={option} type="button" aria-pressed={view === option} onClick={() => onViewChange(option)} className={`rounded-full px-4 py-1.5 capitalize ${view === option ? 'bg-white shadow-sm' : 'text-slate-600'}`}>
              {option}
            </button>
          ))}
        </div>
      </div>

      {loading && !data && <LoadingState className="py-12" />}
      {error && <ErrorState message={error} onRetry={reload} className="py-12" />}

      {data && view === 'week' && (
        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4 xl:grid-cols-7">
          {days.map((day) => {
            const items = byDay.get(day);
            const isToday = day === today;
            return (
              <section key={day} aria-label={formatDateOnly(day)} className={`min-h-[7rem] rounded-2xl border p-2 ${isToday ? 'border-brand-400 bg-brand-50/40' : 'border-slate-200 bg-white'}`}>
                <h3 className={`mb-2 px-1 text-xs font-bold uppercase ${isToday ? 'text-brand-800' : 'text-slate-500'}`}>
                  <button type="button" onClick={() => { onAnchorChange(day); onViewChange('day'); }} className="hover:underline">
                    {formatDateOnly(day, { short: true })}
                  </button>
                  {items.length > 0 && <span className="ml-1 rounded-full bg-slate-200 px-1.5 py-0.5 text-[10px] text-slate-700">{items.length}</span>}
                </h3>
                <div className="space-y-1.5">
                  {items.map((item) => (
                    <Item key={item.id} item={item} onOpen={onOpen} showDoctor />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}

      {data && view === 'day' && (
        <DayList items={byDay.get(anchor)} onOpen={onOpen} />
      )}
    </div>
  );
}

function DayList({ items, onOpen }) {
  if (!items.length) return <EmptyState title="No appointments this day" className="py-10" />;
  const groups = new Map();
  for (const item of items) {
    const group = groups.get(item.doctor.id) || { doctor: item.doctor, items: [] };
    group.items.push(item);
    groups.set(item.doctor.id, group);
  }
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {[...groups.values()].map(({ doctor, items: list }) => (
        <section key={doctor.id} className="rounded-2xl border border-slate-200 bg-white p-4">
          <h3 className="mb-3 font-heading text-base font-extrabold">{doctor.name}</h3>
          <div className="space-y-2">
            {list.map((item) => (
              <button key={item.id} type="button" onClick={() => onOpen(item)} className={`flex w-full items-center gap-4 rounded-xl border-l-4 px-3 py-2.5 text-left transition hover:shadow-md ${BORDER[item.status]}`}>
                <span className="w-20 shrink-0 font-bold text-slate-900">{formatTime(item.startTime)}</span>
                <span className="min-w-0 flex-1">
                  <span className={`block truncate font-semibold ${item.status === 'cancelled' ? 'line-through' : ''}`}>{item.patient?.name}</span>
                  <span className="block truncate text-xs text-slate-500">{item.location.name}</span>
                </span>
                <span className="text-xs font-semibold text-slate-600 capitalize">{item.status.replace('_', ' ')}</span>
              </button>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
