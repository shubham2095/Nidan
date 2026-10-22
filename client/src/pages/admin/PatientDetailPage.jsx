import { useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { CalendarPlus, Mail, MessageCircle, Pencil, Phone, Plus, Trash2, X } from 'lucide-react';
import AdminHeader, { Card } from '../../components/admin/AdminHeader.jsx';
import AppointmentDetailModal from '../../components/admin/AppointmentDetailModal.jsx';
import AppointmentFormModal from '../../components/admin/AppointmentFormModal.jsx';
import ConfirmDialog from '../../components/admin/ConfirmDialog.jsx';
import DataTable from '../../components/admin/DataTable.jsx';
import FamilyLinks from '../../components/admin/FamilyLinks.jsx';
import FollowUpFormModal from '../../components/admin/FollowUpFormModal.jsx';
import FollowUpList from '../../components/admin/FollowUpList.jsx';
import PatientFiles from '../../components/admin/PatientFiles.jsx';
import PatientFormModal from '../../components/admin/PatientFormModal.jsx';
import PatientNotes from '../../components/admin/PatientNotes.jsx';
import PatientVaccinations from '../../components/admin/PatientVaccinations.jsx';
import StatusBadge from '../../components/admin/StatusBadge.jsx';
import Button from '../../components/public/Button.jsx';
import { EmptyState, ErrorState, LoadingState } from '../../components/public/States.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import useFetch from '../../hooks/useFetch.js';
import { deletePatient, getPatient, listFollowUps, updatePatient } from '../../services/crmService.js';
import { ageText, phoneDigits } from '../../utils/crm.js';
import { formatDate, formatDateOnly, formatTime, telHref, whatsappHref } from '../../utils/format.js';
import NotFoundPage from '../public/NotFoundPage.jsx';

function Detail({ label, children }) {
  if (!children) return null;
  return (
    <div>
      <dt className="text-xs font-semibold tracking-wide text-slate-500 uppercase">{label}</dt>
      <dd className="mt-0.5 text-slate-900">{children}</dd>
    </div>
  );
}

function Tags({ patient, onSaved }) {
  const toast = useToast();
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);

  const save = async (tags) => {
    setBusy(true);
    try {
      const { patient: updated } = await updatePatient(patient.id, { tags });
      onSaved(updated);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setBusy(false);
    }
  };

  const add = async (event) => {
    event.preventDefault();
    const tag = text.trim();
    if (!tag || patient.tags.includes(tag)) return setText('');
    await save([...patient.tags, tag]);
    return setText('');
  };

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        {patient.tags.map((tag) => (
          <span key={tag} className="flex items-center gap-1 rounded-full bg-slate-100 py-1 pr-1.5 pl-3 text-sm font-medium text-slate-700">
            {tag}
            <button type="button" disabled={busy} onClick={() => save(patient.tags.filter((item) => item !== tag))} aria-label={`Remove tag ${tag}`} className="rounded-full p-0.5 text-slate-400 hover:bg-white hover:text-red-600">
              <X className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </span>
        ))}
        <form onSubmit={add} className="flex items-center gap-1.5">
          <label htmlFor="new-tag" className="sr-only">Add a tag</label>
          <input id="new-tag" value={text} onChange={(event) => setText(event.target.value)} placeholder="Add tag…" maxLength={30} className="w-28 rounded-full border border-dashed border-slate-300 px-3 py-1 text-sm focus:border-brand-600 focus:outline-none" />
          <button type="submit" disabled={busy || !text.trim()} aria-label="Add tag" className="rounded-full p-1.5 text-brand-700 hover:bg-brand-50 disabled:opacity-40">
            <Plus className="h-4 w-4" aria-hidden="true" />
          </button>
        </form>
      </div>
    </div>
  );
}

export default function PatientDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const { data, loading, error, status, reload } = useFetch((signal) => getPatient(id, signal), [id]);
  const [searchParams] = useSearchParams();
  const [tab, setTab] = useState(searchParams.get('tab') || 'appointments');
  const [dialog, setDialog] = useState(null); // 'edit' | 'book' | 'delete' | 'followup'
  const [selected, setSelected] = useState(null);
  const [patientOverride, setPatientOverride] = useState(null);
  const [relationsOverride, setRelationsOverride] = useState(null);
  const followUps = useFetch((signal) => listFollowUps({ patientId: id, bucket: 'all', pageSize: 50 }, signal), [id]);

  if (status === 404) return <NotFoundPage />;
  if (loading && !data) return <LoadingState className="py-24" />;
  if (error) return <ErrorState message={error} onRetry={reload} />;

  const patient = { ...data.patient, ...(patientOverride?.id === data.patient.id ? patientOverride : {}) };
  const relations = relationsOverride || data.patient.relations;
  const isDoctor = user.role === 'doctor';
  const canSeeNotes = isDoctor || user.role === 'super_admin';
  const canEditLinks = !isDoctor;

  const tabs = [
    ['appointments', `Appointments (${data.patient.appointments.length})`],
    ...(patient.type === 'child' ? [['vaccinations', 'Vaccinations']] : []),
    ...(canSeeNotes ? [['notes', 'Visit notes']] : []),
    ['files', 'Files'],
    ['followups', 'Follow-ups'],
  ];

  const history = data.patient.appointments.map((appointment) => ({ ...appointment, patient }));

  const columns = [
    {
      key: 'when',
      header: 'When',
      className: 'whitespace-nowrap',
      render: (a) => (
        <span>
          <span className="block font-semibold">{formatDateOnly(a.appointmentDate, { short: true })}</span>
          <span className="mb-1 block text-slate-600">{formatTime(a.startTime)}</span>
          <StatusBadge status={a.status} />
        </span>
      ),
    },
    { key: 'doctor', header: 'Doctor / place', render: (a) => (<span><span className="block">{a.doctor.name}</span><span className="block text-xs text-slate-500">{a.location.name}</span></span>) },
    { key: 'reason', header: 'Reason', render: (a) => a.reason || <span className="text-slate-400">—</span> },
  ];

  return (
    <>
      <p className="mb-3 text-sm">
        <Link to="/admin/patients" className="font-semibold text-brand-700 hover:underline">← All patients</Link>
      </p>
      <AdminHeader
        title={patient.name}
        description={`${patient.patientCode} · added ${formatDate(patient.createdAt)}`}
        actions={
          <>
            {!isDoctor && (
              <Button onClick={() => setDialog('book')}>
                <CalendarPlus className="h-4 w-4" aria-hidden="true" />
                Book appointment
              </Button>
            )}
            <Button variant="outline" onClick={() => setDialog('edit')}>
              <Pencil className="h-4 w-4" aria-hidden="true" />
              Edit
            </Button>
            {user.role === 'super_admin' && (
              <Button variant="outline" className="!border-red-300 !text-red-700 hover:!bg-red-50" onClick={() => setDialog('delete')}>
                <Trash2 className="h-4 w-4" aria-hidden="true" />
                Delete
              </Button>
            )}
          </>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-1">
          <Card title="Details">
            <dl className="space-y-4">
              <Detail label="Type"><StatusBadge status={patient.type} /></Detail>
              <Detail label="Phone">
                <span className="flex flex-wrap items-center gap-2">
                  {patient.phone}
                  <a href={telHref(patient.phone)} aria-label="Call" className="rounded-full p-1.5 text-brand-700 hover:bg-brand-50"><Phone className="h-4 w-4" aria-hidden="true" /></a>
                  <a href={whatsappHref(phoneDigits(patient.phone))} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp" className="rounded-full p-1.5 text-emerald-700 hover:bg-emerald-50"><MessageCircle className="h-4 w-4" aria-hidden="true" /></a>
                </span>
              </Detail>
              <Detail label="Email">
                {patient.email && (
                  <a href={`mailto:${patient.email}`} className="inline-flex items-center gap-1.5 break-all text-brand-700 hover:underline"><Mail className="h-4 w-4 shrink-0" aria-hidden="true" />{patient.email}</a>
                )}
              </Detail>
              <Detail label="Date of birth">{patient.dob && `${formatDateOnly(patient.dob)} (${ageText(patient.dob)})`}</Detail>
              <Detail label="Gender">{patient.gender && patient.gender.replace(/^\w/, (c) => c.toUpperCase())}</Detail>
              <Detail label="Parent / guardian">{patient.guardianName}</Detail>
              <Detail label="Consent recorded">{patient.consentAt ? formatDate(patient.consentAt) : <span className="text-amber-700">Not recorded</span>}</Detail>
            </dl>
            <div className="mt-5 border-t border-slate-100 pt-4">
              <h3 className="mb-2 text-xs font-semibold tracking-wide text-slate-500 uppercase">Tags</h3>
              <Tags patient={patient} onSaved={setPatientOverride} />
            </div>
          </Card>

          <Card title="Family">
            <FamilyLinks patient={patient} relations={relations} canEdit={canEditLinks} onChange={setRelationsOverride} />
          </Card>
        </div>

        <div className="lg:col-span-2">
          <div role="tablist" aria-label="Patient records" className="mb-4 flex flex-wrap gap-1.5">
            {tabs.map(([key, label]) => (
              <button key={key} type="button" role="tab" aria-selected={tab === key} onClick={() => setTab(key)} className={`rounded-full px-4 py-2 text-sm font-semibold ${tab === key ? 'bg-brand-700 text-white' : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50'}`}>
                {label}
              </button>
            ))}
          </div>

          <div role="tabpanel">
            {tab === 'appointments' && (
              <DataTable caption="Appointment history" minWidth="24rem" columns={columns} rows={history} onRowClick={setSelected} emptyTitle="No appointments yet" emptyMessage="Appointments booked for this patient will be listed here." />
            )}
            {tab === 'vaccinations' && patient.type === 'child' && <PatientVaccinations patient={patient} />}
            {tab === 'notes' && canSeeNotes && <PatientNotes patientId={patient.id} appointments={data.patient.appointments} currentDoctorId={user.doctorId} />}
            {tab === 'files' && <PatientFiles patientId={patient.id} />}
            {tab === 'followups' && (
              <div className="space-y-4">
                <Button variant="outline" onClick={() => setDialog('followup')}>
                  <Plus className="h-4 w-4" aria-hidden="true" />
                  Add follow-up
                </Button>
                {followUps.loading && !followUps.data && <LoadingState className="py-8" />}
                {followUps.data && followUps.data.items.length === 0 && <EmptyState title="No follow-ups" message="Reminders about this patient appear here." className="py-8" />}
                {followUps.data && followUps.data.items.length > 0 && <FollowUpList items={followUps.data.items} onChange={followUps.reload} />}
              </div>
            )}
          </div>
        </div>
      </div>

      {dialog === 'edit' && <PatientFormModal patient={patient} onClose={() => setDialog(null)} onSaved={setPatientOverride} />}
      {dialog === 'book' && <AppointmentFormModal presetPatient={patient} onClose={() => setDialog(null)} onCreated={reload} />}
      {dialog === 'followup' && (
        <FollowUpFormModal defaults={{ patientId: patient.id, title: `Follow up: ${patient.name}` }} context={patient.name} onClose={() => setDialog(null)} onSaved={() => { toast.success('Follow-up added.'); followUps.reload(); }} />
      )}
      {dialog === 'delete' && (
        <ConfirmDialog
          title="Delete this patient?"
          message={`${patient.name} will be removed from the patient list. Their appointments stay in the history. This cannot be undone from the CRM.`}
          confirmLabel="Delete patient"
          danger
          onConfirm={async () => {
            await deletePatient(patient.id);
            toast.success('Patient deleted.');
            navigate('/admin/patients', { replace: true });
          }}
          onClose={() => setDialog(null)}
        />
      )}
      {selected && <AppointmentDetailModal appointment={selected} onClose={() => setSelected(null)} onChanged={reload} />}
    </>
  );
}
