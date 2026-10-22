import { useState } from 'react';
import { AlertTriangle, CalendarOff, Loader2, Trash2 } from 'lucide-react';
import { useToast } from '../../context/ToastContext.jsx';
import { addLeave, removeLeave } from '../../services/adminService.js';
import { todayIso } from '../../utils/crm.js';
import { formatDateOnly, formatTime } from '../../utils/format.js';
import Button from '../public/Button.jsx';
import { Field, FormMessage } from '../public/FormField.jsx';

const empty = () => ({ startDate: todayIso(), endDate: todayIso(), partDay: false, startTime: '09:00', endTime: '13:00', locationId: '', reason: '' });

/** Days (or hours) a doctor is away. These disappear from the booking page immediately. */
export default function LeavesPanel({ doctor, locations, canManage, onChanged }) {
  const toast = useToast();
  const [form, setForm] = useState(empty());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [warning, setWarning] = useState(null);

  const set = (changes) => setForm((current) => ({ ...current, ...changes }));
  const placeName = (id) => (id ? locations.find((location) => location.id === id)?.name : 'All locations');

  const add = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setWarning(null);
    try {
      const { affectedAppointments } = await addLeave(doctor.id, {
        startDate: form.startDate,
        endDate: form.endDate,
        locationId: form.locationId || undefined,
        reason: form.reason || undefined,
        ...(form.partDay && { startTime: form.startTime, endTime: form.endTime }),
      });
      toast.success('Leave added. Those times are no longer bookable.');
      if (affectedAppointments) {
        setWarning(`${affectedAppointments} existing appointment${affectedAppointments === 1 ? ' falls' : 's fall'} inside this time. Please reschedule or cancel ${affectedAppointments === 1 ? 'it' : 'them'} from the Appointments screen.`);
      }
      setForm(empty());
      onChanged();
    } catch (failure) {
      setError(failure.response?.data?.details?.[0]?.message ? `${failure.message}: ${failure.response.data.details[0].message}` : failure.message);
    } finally {
      setBusy(false);
    }
  };

  const remove = async (leave) => {
    try {
      await removeLeave(doctor.id, leave.id);
      toast.success('Leave removed.');
      onChanged();
    } catch (failure) {
      toast.error(failure.message);
    }
  };

  return (
    <div>
      {warning && (
        <p role="alert" className="mb-4 flex items-start gap-2 rounded-2xl bg-amber-50 p-4 text-sm text-amber-900">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          {warning}
        </p>
      )}

      {doctor.leaves.length === 0 ? (
        <p className="mb-4 text-sm text-slate-600">No upcoming leave.</p>
      ) : (
        <ul className="mb-5 space-y-2">
          {doctor.leaves.map((leave) => (
            <li key={leave.id} className="flex items-center gap-3 rounded-2xl bg-slate-50 px-4 py-3">
              <CalendarOff className="h-5 w-5 shrink-0 text-slate-500" aria-hidden="true" />
              <span className="min-w-0 flex-1 text-sm">
                <strong className="text-slate-900">
                  {formatDateOnly(leave.startDate, { short: true })}
                  {leave.endDate !== leave.startDate && ` – ${formatDateOnly(leave.endDate, { short: true })}`}
                </strong>
                {leave.startTime && <span className="text-slate-700"> · {formatTime(leave.startTime)} – {formatTime(leave.endTime)}</span>}
                <span className="block text-slate-500">{placeName(leave.locationId)}{leave.reason && ` · ${leave.reason}`}</span>
              </span>
              {canManage && (
                <button type="button" onClick={() => remove(leave)} aria-label="Remove this leave" className="rounded-full p-2 text-slate-400 hover:bg-white hover:text-red-600">
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      {canManage && (
        <form onSubmit={add} className="space-y-4 rounded-2xl border border-slate-200 p-4">
          <h3 className="font-heading text-base font-extrabold">Block dates</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="From" required>{(props) => <input {...props} type="date" value={form.startDate} onChange={(event) => set({ startDate: event.target.value, endDate: event.target.value > form.endDate ? event.target.value : form.endDate })} className="field-input" />}</Field>
            <Field label="Until (including)" required>{(props) => <input {...props} type="date" value={form.endDate} min={form.startDate} onChange={(event) => set({ endDate: event.target.value })} className="field-input" />}</Field>
          </div>
          <label className="flex items-center gap-3 text-sm font-medium text-slate-800">
            <input type="checkbox" checked={form.partDay} onChange={(event) => set({ partDay: event.target.checked })} className="h-5 w-5 rounded border-slate-300 text-brand-700" />
            Only part of the day
          </label>
          {form.partDay && (
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="From time">{(props) => <input {...props} type="time" value={form.startTime} onChange={(event) => set({ startTime: event.target.value })} className="field-input" />}</Field>
              <Field label="To time">{(props) => <input {...props} type="time" value={form.endTime} onChange={(event) => set({ endTime: event.target.value })} className="field-input" />}</Field>
            </div>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Where">
              {(props) => (
                <select {...props} value={form.locationId} onChange={(event) => set({ locationId: event.target.value })} className="field-input">
                  <option value="">All locations</option>
                  {locations.map((location) => (
                    <option key={location.id} value={location.id}>{location.name}</option>
                  ))}
                </select>
              )}
            </Field>
            <Field label="Reason (optional)">{(props) => <input {...props} value={form.reason} maxLength={255} onChange={(event) => set({ reason: event.target.value })} className="field-input" />}</Field>
          </div>
          <FormMessage type="error">{error}</FormMessage>
          <Button type="submit" disabled={busy}>
            {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
            Add leave
          </Button>
        </form>
      )}
    </div>
  );
}
