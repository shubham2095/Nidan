import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import AdminHeader, { Card } from '../../components/admin/AdminHeader.jsx';
import ImageUpload from '../../components/admin/ImageUpload.jsx';
import LeavesPanel from '../../components/admin/LeavesPanel.jsx';
import RichTextEditor from '../../components/admin/RichTextEditor.jsx';
import ScheduleEditor from '../../components/admin/ScheduleEditor.jsx';
import StatusBadge from '../../components/admin/StatusBadge.jsx';
import Button from '../../components/public/Button.jsx';
import { Field, FormMessage } from '../../components/public/FormField.jsx';
import { ErrorState, LoadingState } from '../../components/public/States.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import useClinicOptions from '../../hooks/useClinicOptions.js';
import useFetch from '../../hooks/useFetch.js';
import { getAdminDoctor, removeDoctorPhoto, updateDoctor, uploadDoctorPhoto } from '../../services/adminService.js';
import { serverFieldErrors } from '../../utils/crm.js';
import NotFoundPage from '../public/NotFoundPage.jsx';

const lines = (text) => text.split('\n').map((line) => line.trim()).filter(Boolean);
const commas = (text) => text.split(',').map((part) => part.trim()).filter(Boolean);

function ProfileForm({ doctor, isAdmin, onSaved }) {
  const toast = useToast();
  const [values, setValues] = useState(() => ({
    name: doctor.name,
    designation: doctor.designation,
    qualifications: doctor.qualifications,
    highlights: doctor.highlights.join(', '),
    specialities: doctor.specialities.join('\n'),
    quote: doctor.quote || '',
    bio: doctor.bio || '',
    slotMinutes: String(doctor.slotMinutes),
    metaTitle: doctor.metaTitle || '',
    metaDescription: doctor.metaDescription || '',
    slug: doctor.slug,
    isActive: doctor.isActive,
    bookingWindowDays: String(doctor.bookingWindowDays),
    minNoticeMinutes: String(doctor.minNoticeMinutes),
  }));
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState(null);
  const [busy, setBusy] = useState(false);
  const set = (name) => (event) => setValues((current) => ({ ...current, [name]: event.target.value }));

  const save = async (event) => {
    event.preventDefault();
    setBusy(true);
    setFormError(null);
    setErrors({});
    try {
      const payload = {
        name: values.name,
        designation: values.designation,
        qualifications: values.qualifications,
        highlights: commas(values.highlights),
        specialities: lines(values.specialities),
        quote: values.quote,
        bio: values.bio,
        slotMinutes: Number(values.slotMinutes),
        metaTitle: values.metaTitle,
        metaDescription: values.metaDescription,
        ...(isAdmin && { slug: values.slug, isActive: values.isActive, bookingWindowDays: Number(values.bookingWindowDays), minNoticeMinutes: Number(values.minNoticeMinutes) }),
      };
      const { doctor: updated } = await updateDoctor(doctor.id, payload);
      toast.success('Profile saved.');
      onSaved(updated);
    } catch (error) {
      const { fields, message } = serverFieldErrors(error, []);
      setErrors(fields);
      setFormError(message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={save} noValidate className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Name" required error={errors.name}>{(props) => <input {...props} value={values.name} onChange={set('name')} className="field-input" />}</Field>
        <Field label="Designation" required error={errors.designation}>{(props) => <input {...props} value={values.designation} onChange={set('designation')} className="field-input" />}</Field>
        <Field label="Qualifications" required error={errors.qualifications}>{(props) => <input {...props} value={values.qualifications} onChange={set('qualifications')} className="field-input" />}</Field>
        <Field label="Badges (optional)" hint="Separate with commas, e.g. Gold Medalist" error={errors.highlights}>{(props) => <input {...props} value={values.highlights} onChange={set('highlights')} className="field-input" />}</Field>
      </div>
      <Field label="Areas of focus" hint="One per line" error={errors.specialities}>
        {(props) => <textarea {...props} rows={4} value={values.specialities} onChange={set('specialities')} className="field-input" />}
      </Field>
      <Field label="Quote (optional)" error={errors.quote}>{(props) => <textarea {...props} rows={2} value={values.quote} onChange={set('quote')} className="field-input" />}</Field>
      <div>
        <span className="mb-1.5 block text-sm font-semibold text-slate-800">About (shown on the doctor&apos;s page)</span>
        <RichTextEditor value={values.bio} onChange={(bio) => setValues((current) => ({ ...current, bio }))} label="About the doctor" minHeight="10rem" />
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Appointment length" hint="Minutes per patient" error={errors.slotMinutes}>
          {(props) => (
            <select {...props} value={values.slotMinutes} onChange={set('slotMinutes')} className="field-input">
              {[10, 15, 20, 30, 45, 60].map((minutes) => (
                <option key={minutes} value={minutes}>{minutes} minutes</option>
              ))}
            </select>
          )}
        </Field>
        {isAdmin && (
          <>
            <Field label="Bookable up to" hint="Days ahead on the website" error={errors.bookingWindowDays}>{(props) => <input {...props} type="number" min="1" max="365" value={values.bookingWindowDays} onChange={set('bookingWindowDays')} className="field-input" />}</Field>
            <Field label="Minimum notice" hint="Minutes before the visit" error={errors.minNoticeMinutes}>{(props) => <input {...props} type="number" min="0" max="1440" value={values.minNoticeMinutes} onChange={set('minNoticeMinutes')} className="field-input" />}</Field>
          </>
        )}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Search title (optional)" error={errors.metaTitle}>{(props) => <input {...props} value={values.metaTitle} onChange={set('metaTitle')} className="field-input" />}</Field>
        {isAdmin && <Field label="Web address" hint="/doctors/…" error={errors.slug}>{(props) => <input {...props} value={values.slug} onChange={set('slug')} className="field-input" />}</Field>}
        <div className="sm:col-span-2">
          <Field label="Search description (optional)" error={errors.metaDescription}>{(props) => <textarea {...props} rows={2} value={values.metaDescription} onChange={set('metaDescription')} className="field-input" />}</Field>
        </div>
      </div>
      {isAdmin && (
        <label className="flex items-center gap-3 text-sm font-medium text-slate-800">
          <input type="checkbox" checked={values.isActive} onChange={(event) => setValues((current) => ({ ...current, isActive: event.target.checked }))} className="h-5 w-5 rounded border-slate-300 text-brand-700" />
          Show this doctor on the website and allow online booking
        </label>
      )}
      <FormMessage type="error">{formError}</FormMessage>
      <Button type="submit" disabled={busy}>
        {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
        Save profile
      </Button>
    </form>
  );
}

export default function DoctorEditPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const toast = useToast();
  const options = useClinicOptions();
  const { data, loading, error, status, reload } = useFetch((signal) => getAdminDoctor(id, signal), [id]);
  const [override, setOverride] = useState(null);

  if (status === 404) return <NotFoundPage />;
  if (loading && !data) return <LoadingState className="py-24" />;
  if (error) return <ErrorState message={error} onRetry={reload} />;

  const doctor = override?.id === data.doctor.id ? override : data.doctor;
  const isAdmin = user.role === 'super_admin';
  const isOwn = user.role === 'doctor' && user.doctorId === doctor.id;
  const canEdit = isAdmin || isOwn;
  const canManageLeaves = canEdit || user.role === 'receptionist';
  const apply = (updated) => { setOverride(updated); reload(); };

  return (
    <>
      <p className="mb-3 text-sm"><Link to="/admin/doctors" className="font-semibold text-brand-700 hover:underline">← All doctors</Link></p>
      <AdminHeader title={doctor.name} description={doctor.designation} actions={<StatusBadge status={doctor.isActive ? 'confirmed' : 'cancelled'} label={doctor.isActive ? 'Visible on website' : 'Hidden'} />} />
      {!canEdit && <p className="mb-5 rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">You can view this profile and manage leave dates. Only the doctor or an administrator can change the profile or timetable.</p>}

      <div className="space-y-6">
        <Card title="Profile">
          {canEdit ? (
            <div className="space-y-6">
              <ImageUpload
                label="Photo"
                round
                value={doctor.photoUrl}
                hint="A clear, front-facing picture works best. JPEG, PNG or WebP, up to 5 MB."
                upload={async (file) => {
                  const { doctor: updated } = await uploadDoctorPhoto(doctor.id, file);
                  setOverride(updated);
                  return updated.photoUrl;
                }}
                onChange={async (url) => {
                  if (url !== null) return;
                  try {
                    const { doctor: updated } = await removeDoctorPhoto(doctor.id);
                    setOverride(updated);
                  } catch (failure) {
                    toast.error(failure.message);
                  }
                }}
              />
              <ProfileForm key={doctor.id} doctor={doctor} isAdmin={isAdmin} onSaved={apply} />
            </div>
          ) : (
            <dl className="grid gap-4 text-sm sm:grid-cols-2">
              <div><dt className="font-semibold text-slate-500">Qualifications</dt><dd>{doctor.qualifications}</dd></div>
              <div><dt className="font-semibold text-slate-500">Appointment length</dt><dd>{doctor.slotMinutes} minutes</dd></div>
              <div className="sm:col-span-2"><dt className="font-semibold text-slate-500">Areas of focus</dt><dd>{doctor.specialities.join(', ') || '—'}</dd></div>
            </dl>
          )}
        </Card>

        <Card title="Weekly timetable">
          {options.loading ? <LoadingState className="py-6" /> : <ScheduleEditor key={`${doctor.id}-${doctor.schedules.length}`} doctor={doctor} locations={options.locations} canEdit={canEdit} onSaved={apply} />}
        </Card>

        <Card title="Leave and blocked dates">
          <LeavesPanel doctor={doctor} locations={options.locations} canManage={canManageLeaves} onChanged={reload} />
        </Card>

        {isAdmin && (
          <Card title="Staff login">
            {doctor.login ? (
              <p className="text-sm text-slate-700">
                Signs in as <strong>{doctor.login.email}</strong> {doctor.login.isActive ? '' : '(switched off)'}. Manage it under <Link to="/admin/users" className="font-semibold text-brand-700 hover:underline">Users</Link>.
              </p>
            ) : (
              <p className="text-sm text-slate-700">This doctor has no login yet. Create one under <Link to="/admin/users" className="font-semibold text-brand-700 hover:underline">Users</Link> so they can see their own appointments.</p>
            )}
          </Card>
        )}
      </div>
    </>
  );
}
