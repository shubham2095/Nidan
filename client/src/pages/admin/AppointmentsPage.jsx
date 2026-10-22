import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CalendarDays, Download, List, MessageCircle, Plus, Printer } from 'lucide-react';
import AdminHeader from '../../components/admin/AdminHeader.jsx';
import AppointmentCalendar from '../../components/admin/AppointmentCalendar.jsx';
import AppointmentDetailModal from '../../components/admin/AppointmentDetailModal.jsx';
import AppointmentFormModal from '../../components/admin/AppointmentFormModal.jsx';
import DataTable from '../../components/admin/DataTable.jsx';
import SearchBox from '../../components/admin/SearchBox.jsx';
import StatusBadge from '../../components/admin/StatusBadge.jsx';
import Button from '../../components/public/Button.jsx';
import Pagination from '../../components/public/Pagination.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import useClinicOptions from '../../hooks/useClinicOptions.js';
import useFetch from '../../hooks/useFetch.js';
import { downloadAppointmentsCsv, getAppointment, listAppointments } from '../../services/crmService.js';
import { APPOINTMENT_STATUSES, addDaysIso, appointmentWhatsappLink, todayIso, weekStartIso } from '../../utils/crm.js';
import { formatDateOnly, formatTime } from '../../utils/format.js';

const RANGES = [
  ['today', 'Today'],
  ['tomorrow', 'Tomorrow'],
  ['week', 'This week'],
  ['upcoming', 'Upcoming'],
  ['past', 'Past'],
  ['all', 'All'],
];

/** Turns the chosen range chip into from / to / sort. */
function resolveRange(range, params) {
  const today = todayIso();
  switch (range) {
    case 'today': return { from: today, to: today, sort: 'asc' };
    case 'tomorrow': return { from: addDaysIso(today, 1), to: addDaysIso(today, 1), sort: 'asc' };
    case 'week': return { from: weekStartIso(today), to: addDaysIso(weekStartIso(today), 6), sort: 'asc' };
    case 'upcoming': return { from: today, sort: 'asc' };
    case 'past': return { to: addDaysIso(today, -1), sort: 'desc' };
    case 'all': return { sort: 'desc' };
    default: return { from: params.get('from') || undefined, to: params.get('to') || undefined, sort: 'asc' };
  }
}

export default function AppointmentsPage() {
  const { user } = useAuth();
  const toast = useToast();
  const options = useClinicOptions();
  const [params, setParams] = useSearchParams();
  const [selected, setSelected] = useState(null);
  const [creating, setCreating] = useState(false);
  const [exporting, setExporting] = useState(false);

  const view = params.get('view') === 'calendar' ? 'calendar' : 'list';
  const calView = params.get('cal') === 'day' ? 'day' : 'week';
  const anchor = params.get('date') || todayIso();
  const isDoctor = user.role === 'doctor';
  const canCreate = !isDoctor;

  const range = params.get('range') || (params.get('from') || params.get('to') ? 'custom' : 'upcoming');
  const filters = {
    doctorId: params.get('doctorId') || '',
    locationId: params.get('locationId') || '',
    status: params.get('status') || '',
    q: params.get('q') || '',
  };
  const page = Math.max(1, Number(params.get('page')) || 1);
  const query = { ...resolveRange(range, params), doctorId: filters.doctorId || undefined, locationId: filters.locationId || undefined, status: filters.status || undefined, q: filters.q || undefined };

  const update = (changes, { keepPage = false } = {}) => {
    const next = new URLSearchParams(params);
    Object.entries(changes).forEach(([key, value]) => (value ? next.set(key, value) : next.delete(key)));
    if (!keepPage) next.delete('page');
    setParams(next, { replace: true });
  };

  const list = useFetch(
    (signal) => (view === 'list' ? listAppointments({ ...query, page, pageSize: 20 }, signal) : Promise.resolve(null)),
    [view, page, range, params.get('from'), params.get('to'), filters.doctorId, filters.locationId, filters.status, filters.q],
  );
  // Bumped after any change so the calendar view reloads its data.
  const [calendarVersion, setCalendarVersion] = useState(0);

  // A link like /admin/appointments?open=12 (from the dashboard) opens that appointment straight away.
  const openId = params.get('open');
  useEffect(() => {
    if (!openId) return;
    getAppointment(openId)
      .then(({ appointment }) => setSelected(appointment))
      .catch((error) => toast.error(error.message))
      .finally(() => update({ open: '' }, { keepPage: true }));
  }, [openId]);

  const exportCsv = async () => {
    setExporting(true);
    try {
      await downloadAppointmentsCsv(query);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setExporting(false);
    }
  };

  const onChanged = () => {
    list.reload();
    setCalendarVersion((count) => count + 1);
  };

  const columns = [
    {
      key: 'when',
      header: 'When',
      render: (a) => (
        <span className="whitespace-nowrap">
          <span className="block font-semibold text-slate-900">{formatDateOnly(a.appointmentDate, { short: true })}</span>
          <span className="mb-1 block text-slate-600">{formatTime(a.startTime)}</span>
          <StatusBadge status={a.status} />
        </span>
      ),
    },
    {
      key: 'patient',
      header: 'Patient',
      render: (a) => (
        <span>
          <span className="flex items-center gap-2 font-semibold text-slate-900">
            {a.patient?.name} <StatusBadge status={a.patient?.type || 'mother'} />
          </span>
          <span className="block text-xs text-slate-500">{a.patient?.phone}</span>
        </span>
      ),
    },
    { key: 'doctor', header: 'Doctor / place', render: (a) => (<span><span className="block">{a.doctor.name}</span><span className="block text-xs text-slate-500">{a.location.name}</span></span>) },
    { key: 'ref', header: 'ID', className: 'whitespace-nowrap text-xs text-slate-500', render: (a) => a.bookingRef },
    {
      key: 'actions',
      header: <span className="sr-only">Actions</span>,
      className: 'text-right print:hidden',
      render: (a) => (
        <a
          href={appointmentWhatsappLink(a)}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(event) => event.stopPropagation()}
          aria-label={`WhatsApp ${a.patient?.name}`}
          className="inline-grid h-9 w-9 place-items-center rounded-full text-emerald-700 hover:bg-emerald-50"
        >
          <MessageCircle className="h-5 w-5" aria-hidden="true" />
        </a>
      ),
    },
  ];

  const select = 'field-input py-2 text-sm';

  return (
    <>
      <AdminHeader
        title="Appointments"
        description={isDoctor ? 'Your appointments.' : 'Every booking from the website, phone and walk-ins.'}
        actions={
          <>
            <Button variant="outline" onClick={() => window.print()}>
              <Printer className="h-4 w-4" aria-hidden="true" />
              Print
            </Button>
            <Button variant="outline" onClick={exportCsv} disabled={exporting}>
              <Download className="h-4 w-4" aria-hidden="true" />
              Export CSV
            </Button>
            {canCreate && (
              <Button onClick={() => setCreating(true)}>
                <Plus className="h-4 w-4" aria-hidden="true" />
                New appointment
              </Button>
            )}
          </>
        }
      />

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 print:hidden">
        <div role="group" aria-label="Display" className="flex rounded-full bg-slate-100 p-1 text-sm font-semibold">
          <button type="button" aria-pressed={view === 'list'} onClick={() => update({ view: '' })} className={`flex items-center gap-2 rounded-full px-4 py-1.5 ${view === 'list' ? 'bg-white shadow-sm' : 'text-slate-600'}`}>
            <List className="h-4 w-4" aria-hidden="true" /> List
          </button>
          <button type="button" aria-pressed={view === 'calendar'} onClick={() => update({ view: 'calendar' })} className={`flex items-center gap-2 rounded-full px-4 py-1.5 ${view === 'calendar' ? 'bg-white shadow-sm' : 'text-slate-600'}`}>
            <CalendarDays className="h-4 w-4" aria-hidden="true" /> Calendar
          </button>
        </div>
        {view === 'list' && (
          <div role="group" aria-label="Date range" className="flex flex-wrap gap-1.5">
            {RANGES.map(([key, label]) => (
              <button key={key} type="button" aria-pressed={range === key} onClick={() => update({ range: key === 'upcoming' ? '' : key, from: '', to: '' })} className={`rounded-full px-3.5 py-1.5 text-sm font-semibold ${range === key ? 'bg-brand-700 text-white' : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50'}`}>
                {label}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5 print:hidden">
        <div className="lg:col-span-2">{view === 'list' && <SearchBox value={filters.q} onChange={(value) => update({ q: value })} placeholder="Search name, phone or booking ID" label="Search appointments" />}</div>
        {!isDoctor && (
          <select aria-label="Filter by doctor" value={filters.doctorId} onChange={(event) => update({ doctorId: event.target.value })} className={select}>
            <option value="">All doctors</option>
            {options.doctors.map((doctor) => (
              <option key={doctor.id} value={doctor.id}>{doctor.name}</option>
            ))}
          </select>
        )}
        <select aria-label="Filter by location" value={filters.locationId} onChange={(event) => update({ locationId: event.target.value })} className={select}>
          <option value="">All locations</option>
          {options.locations.map((location) => (
            <option key={location.id} value={location.id}>{location.name}</option>
          ))}
        </select>
        {view === 'list' && (
          <select aria-label="Filter by status" value={filters.status} onChange={(event) => update({ status: event.target.value })} className={select}>
            <option value="">All statuses</option>
            {APPOINTMENT_STATUSES.map((status) => (
              <option key={status} value={status}>{status.replace('_', ' ').replace(/^\w/, (c) => c.toUpperCase())}</option>
            ))}
          </select>
        )}
      </div>

      {view === 'list' ? (
        <>
          <DataTable
            caption="Appointments"
            minWidth="34rem"
            columns={columns}
            rows={list.data?.items}
            loading={list.loading}
            error={list.error}
            onRetry={list.reload}
            onRowClick={setSelected}
            emptyTitle="No appointments found"
            emptyMessage={filters.q || filters.status || filters.doctorId || filters.locationId ? 'Try clearing a filter.' : 'Bookings will appear here as they come in.'}
          />
          {list.data && (
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-sm text-slate-500 print:hidden">
              <span>{list.data.total} appointment{list.data.total === 1 ? '' : 's'}</span>
            </div>
          )}
          {list.data && (
            <div className="print:hidden">
              <Pagination page={list.data.page} totalPages={list.data.totalPages} onChange={(next) => update({ page: next > 1 ? String(next) : '' }, { keepPage: true })} />
            </div>
          )}
        </>
      ) : (
        <AppointmentCalendar
          key={calendarVersion}
          view={calView}
          anchor={anchor}
          filters={filters}
          onAnchorChange={(date) => update({ date: date === todayIso() ? '' : date })}
          onViewChange={(next) => update({ cal: next === 'week' ? '' : next })}
          onOpen={setSelected}
        />
      )}

      {selected && <AppointmentDetailModal appointment={selected} onClose={() => setSelected(null)} onChanged={onChanged} />}
      {creating && <AppointmentFormModal onClose={() => setCreating(false)} onCreated={onChanged} />}
    </>
  );
}
