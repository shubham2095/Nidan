import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CalendarOff, Clock, Loader2, Plus } from 'lucide-react';
import AdminHeader from '../../components/admin/AdminHeader.jsx';
import Modal from '../../components/admin/Modal.jsx';
import StatusBadge from '../../components/admin/StatusBadge.jsx';
import Button from '../../components/public/Button.jsx';
import DoctorAvatar from '../../components/public/DoctorAvatar.jsx';
import { Field, FormMessage } from '../../components/public/FormField.jsx';
import { EmptyState, ErrorState, LoadingState } from '../../components/public/States.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import useFetch from '../../hooks/useFetch.js';
import { createDoctor, listAdminDoctors } from '../../services/adminService.js';
import { serverFieldErrors } from '../../utils/crm.js';

function NewDoctorModal({ onClose, onCreated }) {
  const [values, setValues] = useState({ name: '', designation: '', qualifications: '' });
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState(null);
  const set = (name) => (event) => setValues((current) => ({ ...current, [name]: event.target.value }));

  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setFormError(null);
    try {
      const { doctor } = await createDoctor(values);
      onCreated(doctor);
    } catch (error) {
      const { fields, message } = serverFieldErrors(error, []);
      setErrors(fields);
      setFormError(message);
      setBusy(false);
    }
  };

  return (
    <Modal
      title="Add a doctor"
      onClose={onClose}
      dismissible={!busy}
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={busy}>Cancel</Button>
          <Button type="submit" form="new-doctor" disabled={busy}>
            {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
            Add doctor
          </Button>
        </>
      }
    >
      <form id="new-doctor" onSubmit={submit} noValidate className="space-y-4">
        <Field label="Name" required error={errors.name}>{(props) => <input {...props} value={values.name} onChange={set('name')} data-autofocus placeholder="Dr. Full Name" className="field-input" />}</Field>
        <Field label="Designation" required error={errors.designation}>{(props) => <input {...props} value={values.designation} onChange={set('designation')} placeholder="e.g. Consultant Dermatologist" className="field-input" />}</Field>
        <Field label="Qualifications" required error={errors.qualifications}>{(props) => <input {...props} value={values.qualifications} onChange={set('qualifications')} placeholder="e.g. MBBS, MD" className="field-input" />}</Field>
        <p className="text-sm text-slate-500">You can add the photo, biography and timetable on the next screen.</p>
        <FormMessage type="error">{formError}</FormMessage>
      </form>
    </Modal>
  );
}

export default function DoctorsAdminPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data, loading, error, reload } = useFetch((signal) => listAdminDoctors(signal), []);
  const [adding, setAdding] = useState(false);
  const isAdmin = user.role === 'super_admin';

  return (
    <>
      <AdminHeader
        title="Doctors"
        description="Profiles, weekly timetables and leave. Changes reach the website and the booking page within a minute."
        actions={isAdmin && (
          <Button onClick={() => setAdding(true)}>
            <Plus className="h-4 w-4" aria-hidden="true" />
            Add doctor
          </Button>
        )}
      />
      {loading && !data && <LoadingState />}
      {error && <ErrorState message={error} onRetry={reload} />}
      {data && data.items.length === 0 && <EmptyState title="No doctors yet" />}
      <div className="grid gap-5 lg:grid-cols-2">
        {data?.items.map((doctor) => {
          const places = new Set(doctor.schedules.map((row) => row.locationId)).size;
          const own = user.role === 'doctor' && user.doctorId === doctor.id;
          return (
            <Link key={doctor.id} to={`/admin/doctors/${doctor.id}`} className="flex gap-5 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
              <DoctorAvatar doctor={doctor} size="lg" />
              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-center gap-2">
                  <span className="font-heading text-xl font-extrabold text-slate-900">{doctor.name}</span>
                  {own && <StatusBadge status="new" label="You" />}
                  {!doctor.isActive && <StatusBadge status="cancelled" label="Hidden" />}
                </span>
                <span className="block font-semibold text-brand-700">{doctor.designation}</span>
                <span className="block text-sm text-slate-600">{doctor.qualifications}</span>
                <span className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                  <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" aria-hidden="true" />{doctor.schedules.length ? `${places} location${places === 1 ? '' : 's'} · ${doctor.slotMinutes}-min visits` : 'No timetable yet'}</span>
                  {doctor.leaves.length > 0 && <span className="flex items-center gap-1 text-amber-700"><CalendarOff className="h-3.5 w-3.5" aria-hidden="true" />{doctor.leaves.length} upcoming leave{doctor.leaves.length === 1 ? '' : 's'}</span>}
                </span>
              </span>
            </Link>
          );
        })}
      </div>
      {adding && <NewDoctorModal onClose={() => setAdding(false)} onCreated={(doctor) => navigate(`/admin/doctors/${doctor.id}`)} />}
    </>
  );
}
