import { Link } from 'react-router-dom';
import { CalendarCheck, CalendarClock, ClipboardCheck, MapPin, PhoneIncoming, Syringe } from 'lucide-react';
import { Card } from '../../components/admin/AdminHeader.jsx';
import AdminHeader from '../../components/admin/AdminHeader.jsx';
import { DayBars, HorizontalBars } from '../../components/admin/Charts.jsx';
import StatusBadge from '../../components/admin/StatusBadge.jsx';
import { EmptyState, ErrorState, LoadingState } from '../../components/public/States.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import useFetch from '../../hooks/useFetch.js';
import { getDashboard } from '../../services/crmService.js';
import { sourceLabel } from '../../utils/crm.js';
import { formatDateOnly, formatTime } from '../../utils/format.js';

function Stat({ to, Icon, label, value, tone = 'brand', hint }) {
  const tones = { brand: 'bg-brand-50 text-brand-700', blush: 'bg-blush-100 text-blush-600', amber: 'bg-amber-100 text-amber-700', red: 'bg-red-100 text-red-700' };
  return (
    <Link to={to} className="flex items-center gap-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl ${tones[tone]}`}>
        <Icon className="h-6 w-6" aria-hidden="true" />
      </span>
      <span>
        <span className="block font-heading text-3xl font-extrabold text-slate-900">{value}</span>
        <span className="block text-sm font-semibold text-slate-600">{label}</span>
        {hint && <span className="block text-xs text-slate-500">{hint}</span>}
      </span>
    </Link>
  );
}

/** Today's appointments grouped by doctor. */
function TodaySchedule({ items }) {
  if (!items.length) return <EmptyState title="No appointments today" message="Bookings made for today will appear here." className="py-8" />;

  const byDoctor = new Map();
  for (const item of items) {
    const group = byDoctor.get(item.doctor.id) || { doctor: item.doctor, items: [] };
    group.items.push(item);
    byDoctor.set(item.doctor.id, group);
  }

  return (
    <div className="space-y-6">
      {[...byDoctor.values()].map(({ doctor, items: list }) => (
        <div key={doctor.id}>
          <h3 className="mb-2 text-sm font-bold tracking-wide text-slate-500 uppercase">{doctor.name}</h3>
          <ul className="divide-y divide-slate-100 rounded-2xl border border-slate-200">
            {list.map((item) => (
              <li key={item.id}>
                <Link to={`/admin/appointments?open=${item.id}`} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3 hover:bg-brand-50/50">
                  <span className="w-20 font-bold text-slate-900">{formatTime(item.startTime)}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold text-slate-900">{item.patient?.name}</span>
                    <span className="flex items-center gap-1 text-xs text-slate-500">
                      <MapPin className="h-3 w-3" aria-hidden="true" />
                      {item.location.name}
                    </span>
                  </span>
                  <StatusBadge status={item.status} />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

/** "Dr. Manisha Ranjan" -> "Dr. Manisha", "Riya Sharma" -> "Riya" */
const greetingName = (name) => {
  const [first, second] = name.trim().split(/\s+/);
  return /^dr\.?$/i.test(first) && second ? `${first} ${second}` : first;
};

export default function DashboardPage() {
  const { user } = useAuth();
  const { data, loading, error, reload } = useFetch((signal) => getDashboard(signal), []);
  const isDoctor = user.role === 'doctor';

  if (loading) return <LoadingState className="py-24" />;
  if (error) return <ErrorState message={error} onRetry={reload} />;

  const { counts, today } = data;
  const followUpsDue = counts.followUpsDueToday + counts.followUpsOverdue;

  return (
    <>
      <AdminHeader title={`Hello, ${greetingName(user.name)}`} description={`${formatDateOnly(today)}. Here is what needs attention.`} />

      <div className="grid grid-cols-[repeat(auto-fit,minmax(15rem,1fr))] gap-4">
        <Stat to={`/admin/appointments?from=${today}&to=${today}`} Icon={CalendarCheck} label="Appointments today" value={counts.appointmentsToday} hint={`${counts.appointmentsTomorrow} tomorrow`} />
        <Stat to={`/admin/appointments?status=pending&from=${today}`} Icon={CalendarClock} label="Awaiting confirmation" value={counts.pendingConfirmations} tone="amber" />
        {!isDoctor && <Stat to="/admin/leads?status=new" Icon={PhoneIncoming} label="New leads" value={counts.newLeads} tone="blush" />}
        <Stat
          to="/admin/follow-ups"
          Icon={ClipboardCheck}
          label="Follow-ups due"
          value={followUpsDue}
          tone={counts.followUpsOverdue ? 'red' : 'brand'}
          hint={counts.followUpsOverdue ? `${counts.followUpsOverdue} overdue` : 'Nothing overdue'}
        />
        <Stat
          to="/admin/vaccinations"
          Icon={Syringe}
          label="Vaccinations due this week"
          value={counts.vaccinationsDueThisWeek}
          tone={counts.vaccinationsOverdue ? 'red' : 'brand'}
          hint={counts.vaccinationsOverdue ? `${counts.vaccinationsOverdue} overdue` : 'None overdue'}
        />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <Card title="Today's schedule" className="xl:col-span-2">
          <TodaySchedule items={data.todaysAppointments} />
        </Card>

        <div className="space-y-6">
          <Card title="Appointments, 14 days">
            <DayBars data={data.appointmentsPerDay} />
          </Card>
          {data.leadSources && (
            <Card title="Lead sources, last 30 days">
              <HorizontalBars data={data.leadSources.map((row) => ({ label: sourceLabel(row.source), count: row.count }))} emptyText="No enquiries in the last 30 days" />
            </Card>
          )}
        </div>
      </div>
    </>
  );
}
