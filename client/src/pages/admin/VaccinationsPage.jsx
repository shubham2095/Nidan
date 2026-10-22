import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { MessageCircle, Syringe } from 'lucide-react';
import AdminHeader from '../../components/admin/AdminHeader.jsx';
import DataTable from '../../components/admin/DataTable.jsx';
import MarkGivenModal from '../../components/admin/MarkGivenModal.jsx';
import ResourceManager from '../../components/admin/ResourceManager.jsx';
import StatusBadge from '../../components/admin/StatusBadge.jsx';
import Button from '../../components/public/Button.jsx';
import Pagination from '../../components/public/Pagination.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import useFetch from '../../hooks/useFetch.js';
import { createVaccine, deleteVaccine, getDueVaccinations, getVaccinationCounts, listVaccines, updateVaccine } from '../../services/adminService.js';
import { ageText, phoneDigits, todayIso } from '../../utils/crm.js';
import { formatDateOnly, whatsappHref } from '../../utils/format.js';

const WINDOWS = [
  ['overdue', 'Overdue'],
  ['week', 'Next 7 days'],
  ['month', 'Next 30 days'],
  ['all', 'All pending'],
];

const daysBetween = (from, to) => Math.round((new Date(`${to}T00:00:00Z`) - new Date(`${from}T00:00:00Z`)) / 86400000);

const dueText = (dueDate) => {
  const days = daysBetween(todayIso(), dueDate);
  if (days === 0) return 'Due today';
  if (days < 0) return `${-days} day${days === -1 ? '' : 's'} overdue`;
  return `In ${days} day${days === 1 ? '' : 's'}`;
};

const reminderLink = (item, clinicName = 'Nidan Mother & Child Care') =>
  whatsappHref(
    phoneDigits(item.patient.phone),
    `Hello ${item.patient.guardianName || 'there'}, this is ${clinicName}. ${item.patient.name}'s ${item.vaccine.name} ${item.dueDate < todayIso() ? 'was due on' : 'is due on'} ${formatDateOnly(item.dueDate)}. Please call us or book online to arrange it.`,
  );

function DueList() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const [recording, setRecording] = useState(null);
  const range = WINDOWS.some(([key]) => key === params.get('window')) ? params.get('window') : 'week';
  const page = Math.max(1, Number(params.get('page')) || 1);

  const set = (changes) => {
    const next = new URLSearchParams(params);
    Object.entries(changes).forEach(([key, value]) => (value ? next.set(key, value) : next.delete(key)));
    setParams(next, { replace: true });
  };

  const counts = useFetch((signal) => getVaccinationCounts(signal), []);
  const { data, loading, error, reload } = useFetch((signal) => getDueVaccinations({ window: range, page, pageSize: 20 }, signal), [range, page]);

  const columns = [
    {
      key: 'due',
      header: 'Due',
      className: 'whitespace-nowrap',
      render: (item) => (
        <span>
          <span className="block font-semibold text-slate-900">{formatDateOnly(item.dueDate, { short: true })}</span>
          <StatusBadge status={item.status} label={dueText(item.dueDate)} />
        </span>
      ),
    },
    {
      key: 'child',
      header: 'Child',
      render: (item) => (
        <span>
          <span className="block font-semibold text-slate-900">{item.patient.name}</span>
          <span className="block text-xs text-slate-500">{item.patient.patientCode} · {ageText(item.patient.dob)}</span>
        </span>
      ),
    },
    { key: 'vaccine', header: 'Vaccine', render: (item) => (<span><span className="block">{item.vaccine.name}</span><span className="block text-xs text-slate-500">{item.vaccine.ageLabel}</span></span>) },
    { key: 'guardian', header: 'Parent / guardian', render: (item) => (<span><span className="block">{item.patient.guardianName || '—'}</span><span className="block text-xs text-slate-500">{item.patient.phone}</span></span>) },
    {
      key: 'actions',
      header: <span className="sr-only">Actions</span>,
      className: 'text-right whitespace-nowrap',
      render: (item) => (
        <span className="inline-flex items-center gap-1" onClick={(event) => event.stopPropagation()}>
          <a href={reminderLink(item)} target="_blank" rel="noopener noreferrer" aria-label={`WhatsApp reminder for ${item.patient.name}`} className="grid h-9 w-9 place-items-center rounded-full text-emerald-700 hover:bg-emerald-50">
            <MessageCircle className="h-5 w-5" aria-hidden="true" />
          </a>
          <Button variant="outline" onClick={() => setRecording(item)}>
            <Syringe className="h-4 w-4" aria-hidden="true" />
            Record
          </Button>
        </span>
      ),
    },
  ];

  return (
    <>
      <div role="tablist" aria-label="Due window" className="mb-4 flex flex-wrap gap-1.5">
        {WINDOWS.map(([key, label]) => {
          const count = key === 'overdue' ? counts.data?.overdue : key === 'week' ? counts.data?.week : undefined;
          return (
            <button key={key} type="button" role="tab" aria-selected={range === key} onClick={() => set({ window: key === 'week' ? '' : key, page: '' })} className={`rounded-full px-4 py-2 text-sm font-semibold ${range === key ?(key === 'overdue' ? 'bg-red-600 text-white' : 'bg-brand-700 text-white') : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50'}`}>
              {label}{count !== undefined && ` (${count})`}
            </button>
          );
        })}
      </div>
      <DataTable
        caption="Vaccinations due"
        columns={columns}
        rows={data?.items}
        loading={loading}
        error={error}
        onRetry={reload}
        onRowClick={(item) => navigate(`/admin/patients/${item.patient.id}?tab=vaccinations`)}
        emptyTitle="Nothing due here"
        emptyMessage="Doses appear automatically from each child's date of birth."
      />
      {data && <Pagination page={data.page} totalPages={data.totalPages} onChange={(next) => set({ page: next > 1 ? String(next) : '' })} />}
      {recording && (
        <MarkGivenModal patientId={recording.patient.id} childName={recording.patient.name} record={{ ...recording, notes: '' }} onClose={() => setRecording(null)} onSaved={() => { reload(); counts.reload(); }} />
      )}
    </>
  );
}

const vaccineInitial = { name: '', ageLabel: '', ageDays: '', notes: '', isActive: true };
const vaccineFields = [
  { name: 'name', label: 'Vaccine and dose', required: true, wide: true, hint: 'e.g. Hepatitis B – Dose 2' },
  { name: 'ageLabel', label: 'Due at (label)', required: true, hint: 'e.g. 6 weeks, 9 months' },
  { name: 'ageDays', label: 'Due at (days from birth)', type: 'number', required: true, hint: '42 = 6 weeks, 274 = 9 months, 365 = 1 year' },
  { name: 'notes', label: 'Notes (optional)', type: 'textarea', rows: 2 },
  { name: 'isActive', type: 'checkbox', checkboxLabel: 'Use this vaccine in the schedule', hint: 'Switch off to stop tracking it for children (doses already given are kept).' },
];

function Schedule({ readOnly }) {
  const api = { list: (signal) => listVaccines({ all: true }, signal), create: createVaccine, update: updateVaccine, remove: deleteVaccine };
  const columns = [
    { key: 'age', header: 'Due at', className: 'whitespace-nowrap', render: (vaccine) => (<span><span className="block font-semibold text-slate-900">{vaccine.ageLabel}</span><span className="block text-xs text-slate-500">{vaccine.ageDays} days</span></span>) },
    { key: 'name', header: 'Vaccine', render: (vaccine) => vaccine.name },
    { key: 'notes', header: 'Notes', className: 'max-w-xs', render: (vaccine) => <span className="text-slate-600">{vaccine.notes}</span> },
    { key: 'status', header: 'Status', render: (vaccine) => <StatusBadge status={vaccine.isActive ? 'confirmed' : 'cancelled'} label={vaccine.isActive ? 'In use' : 'Switched off'} /> },
  ];

  return (
    <>
      <p className="mb-4 rounded-2xl bg-amber-50 p-4 text-sm text-amber-900">
        This is a standard starter schedule. Dr. Rajeev Ranjan should review it. Changing a vaccine&apos;s age moves the due date of every pending dose; doses already given never change.
      </p>
      <ResourceManager
        embedded
        readOnly={readOnly}
        title="Vaccine schedule"
        singular="Vaccine"
        api={api}
        columns={columns}
        fields={vaccineFields}
        initial={vaccineInitial}
        deleteMessage={(vaccine) => `“${vaccine.name}” and all pending doses will be removed. If any dose was already given you will be asked to switch it off instead.`}
      />
    </>
  );
}

export default function VaccinationsPage() {
  const { user } = useAuth();
  const [params, setParams] = useSearchParams();
  const tab = params.get('tab') === 'schedule' ? 'schedule' : 'due';
  const canEditSchedule = user.role === 'super_admin' || user.role === 'doctor';

  return (
    <>
      <AdminHeader title="Vaccinations" description="Doses coming due for children, worked out from their dates of birth, and the schedule behind them." />
      <div role="tablist" aria-label="Vaccination views" className="mb-5 flex gap-1.5">
        {[['due', 'Due doses'], ['schedule', 'Schedule']].map(([key, label]) => (
          <button key={key} type="button" role="tab" aria-selected={tab === key} onClick={() => setParams(key === 'due' ? {} : { tab: key }, { replace: true })} className={`rounded-full px-5 py-2 text-sm font-semibold ${tab === key ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50'}`}>
            {label}
          </button>
        ))}
      </div>
      {tab === 'due' ? <DueList /> : <Schedule readOnly={!canEditSchedule} />}
    </>
  );
}
