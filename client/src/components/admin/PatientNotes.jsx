import { useState } from 'react';
import { Loader2, Lock, Pencil } from 'lucide-react';
import { EmptyState, ErrorState, LoadingState } from '../public/States.jsx';
import Button from '../public/Button.jsx';
import { Field, FormMessage } from '../public/FormField.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import useFetch from '../../hooks/useFetch.js';
import { createVisitNote, listVisitNotes, updateVisitNote } from '../../services/crmService.js';
import { formatDate, formatDateOnly, formatTime } from '../../utils/format.js';

/**
 * Visit notes. Doctors write and edit their own; super admins can read all; reception never sees this tab.
 * `appointments` lets a doctor optionally tie a note to one of this patient's visits.
 */
export default function PatientNotes({ patientId, appointments, currentDoctorId }) {
  const toast = useToast();
  const { data, loading, error, reload } = useFetch((signal) => listVisitNotes(patientId, signal), [patientId]);
  const [text, setText] = useState('');
  const [appointmentId, setAppointmentId] = useState('');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState(null);
  const [editing, setEditing] = useState(null); // { id, text }

  const visits = appointments.filter((a) => a.status !== 'cancelled');

  const add = async (event) => {
    event.preventDefault();
    if (!text.trim()) return;
    setSaving(true);
    setFormError(null);
    try {
      await createVisitNote(patientId, { note: text, appointmentId: appointmentId || undefined });
      setText('');
      setAppointmentId('');
      toast.success('Note saved.');
      reload();
    } catch (failure) {
      setFormError(failure.message);
    } finally {
      setSaving(false);
    }
  };

  const saveEdit = async () => {
    setSaving(true);
    try {
      await updateVisitNote(patientId, editing.id, { note: editing.text });
      setEditing(null);
      toast.success('Note updated.');
      reload();
    } catch (failure) {
      toast.error(failure.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading && !data) return <LoadingState className="py-10" />;
  if (error) return <ErrorState message={error} onRetry={reload} className="py-10" />;

  return (
    <div className="space-y-5">
      <p className="flex items-center gap-2 rounded-xl bg-slate-50 px-4 py-2.5 text-sm text-slate-600">
        <Lock className="h-4 w-4 shrink-0" aria-hidden="true" />
        Visit notes are medical records. Only the writing doctor and administrators can see them.
      </p>

      {data.canWrite && (
        <form onSubmit={add} className="space-y-3 rounded-2xl border border-slate-200 p-4">
          <Field label="New visit note">{(props) => <textarea {...props} rows={4} value={text} onChange={(event) => setText(event.target.value)} className="field-input" />}</Field>
          {visits.length > 0 && (
            <Field label="Visit (optional)">
              {(props) => (
                <select {...props} value={appointmentId} onChange={(event) => setAppointmentId(event.target.value)} className="field-input">
                  <option value="">Not linked to a visit</option>
                  {visits.filter((visit) => visit.doctor.id === currentDoctorId).map((visit) => (
                    <option key={visit.id} value={visit.id}>
                      {formatDateOnly(visit.appointmentDate, { short: true })}, {formatTime(visit.startTime)}
                    </option>
                  ))}
                </select>
              )}
            </Field>
          )}
          <FormMessage type="error">{formError}</FormMessage>
          <Button type="submit" disabled={saving || !text.trim()}>
            {saving && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
            Save note
          </Button>
        </form>
      )}

      {data.items.length === 0 && <EmptyState title="No visit notes yet" className="py-8" />}
      <ul className="space-y-3">
        {data.items.map((note) => (
          <li key={note.id} className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
              <span className="font-semibold text-slate-700">
                {note.doctor?.name} · {formatDate(note.createdAt)}
                {note.updatedAt !== note.createdAt && ' (edited)'}
              </span>
              {data.canWrite && note.doctor?.id === currentDoctorId && editing?.id !== note.id && (
                <button type="button" onClick={() => setEditing({ id: note.id, text: note.note })} className="flex items-center gap-1 font-semibold text-brand-700 hover:underline">
                  <Pencil className="h-3.5 w-3.5" aria-hidden="true" /> Edit
                </button>
              )}
            </div>
            {editing?.id === note.id ? (
              <div className="space-y-2">
                <textarea aria-label="Edit note" rows={4} value={editing.text} onChange={(event) => setEditing({ ...editing, text: event.target.value })} className="field-input" />
                <div className="flex gap-2">
                  <Button onClick={saveEdit} disabled={saving || !editing.text.trim()}>Save</Button>
                  <Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
                </div>
              </div>
            ) : (
              <p className="whitespace-pre-wrap text-slate-800">{note.note}</p>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
