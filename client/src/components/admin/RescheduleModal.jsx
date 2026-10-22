import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useToast } from '../../context/ToastContext.jsx';
import useFetch from '../../hooks/useFetch.js';
import { getStaffDates, getStaffSlots, rescheduleAppointment } from '../../services/crmService.js';
import { formatDateOnly, formatTime } from '../../utils/format.js';
import Button from '../public/Button.jsx';
import DatePicker from '../public/DatePicker.jsx';
import { FormMessage } from '../public/FormField.jsx';
import SlotPicker from '../public/SlotPicker.jsx';
import { ErrorState, LoadingState } from '../public/States.jsx';
import Modal from './Modal.jsx';

/** Moves an appointment to another date / time with the same doctor and location. */
export default function RescheduleModal({ appointment, onClose, onDone }) {
  const toast = useToast();
  const [date, setDate] = useState('');
  const [slot, setSlot] = useState(null);
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState(null);
  const ids = { doctorId: appointment.doctor.id, locationId: appointment.location.id };

  const dates = useFetch((signal) => getStaffDates(ids, signal), [appointment.id]);
  const slots = useFetch((signal) => (date ? getStaffSlots({ ...ids, date }, signal) : Promise.resolve(null)), [appointment.id, date]);

  const save = async () => {
    setBusy(true);
    setFormError(null);
    try {
      const { appointment: updated } = await rescheduleAppointment(appointment.id, { date, startTime: slot.startTime.slice(0, 5) });
      toast.success(`Moved to ${formatDateOnly(updated.appointmentDate)}, ${formatTime(updated.startTime)}.`);
      onDone(updated);
      onClose();
    } catch (error) {
      setFormError(error.message);
      if (error.response?.data?.details?.code === 'slot_unavailable') {
        setSlot(null);
        slots.reload();
      }
      setBusy(false);
    }
  };

  return (
    <Modal
      title="Reschedule appointment"
      size="lg"
      onClose={onClose}
      dismissible={!busy}
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button onClick={save} disabled={!slot || busy}>
            {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
            Move appointment
          </Button>
        </>
      }
    >
      <p className="mb-4 rounded-2xl bg-slate-50 p-4 text-sm text-slate-700">
        <strong>{appointment.patient?.name}</strong> with {appointment.doctor.name} at {appointment.location.name}. Currently{' '}
        <strong>
          {formatDateOnly(appointment.appointmentDate)}, {formatTime(appointment.startTime)}
        </strong>
        .
      </p>
      <div className="grid gap-6 lg:grid-cols-2">
        <div>
          <h3 className="mb-3 font-heading text-base font-extrabold">New date</h3>
          {dates.loading && <LoadingState className="py-8" />}
          {dates.error && <ErrorState message={dates.error} onRetry={dates.reload} className="py-8" />}
          {dates.data && !dates.data.dates.length && <p className="text-sm text-slate-600">No free dates found for this doctor and location.</p>}
          {dates.data?.dates.length > 0 && <DatePicker dates={dates.data.dates} value={date} onChange={(value) => { setDate(value); setSlot(null); }} />}
        </div>
        <div>
          <h3 className="mb-3 font-heading text-base font-extrabold">New time</h3>
          {!date && <p className="text-sm text-slate-500">Choose a date first.</p>}
          {date && slots.loading && <LoadingState className="py-8" />}
          {slots.data && !slots.data.slots.length && <p className="text-sm text-slate-600">No free times on this day.</p>}
          {slots.data?.slots.length > 0 && <SlotPicker slots={slots.data.slots} value={slot?.startTime} onChange={setSlot} />}
        </div>
      </div>
      <div className="mt-4">
        <FormMessage type="error">{formError}</FormMessage>
      </div>
    </Modal>
  );
}
