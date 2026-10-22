import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarClock, CheckCircle2, ClipboardCheck, Loader2, MessageCircle, Phone, UserX, XCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { changeAppointmentStatus, updateAppointment } from '../../services/crmService.js';
import { appointmentWhatsappLink } from '../../utils/crm.js';
import { formatDateOnly, formatTime, telHref } from '../../utils/format.js';
import Button from '../public/Button.jsx';
import { Field, FormMessage } from '../public/FormField.jsx';
import ConfirmDialog from './ConfirmDialog.jsx';
import FollowUpFormModal from './FollowUpFormModal.jsx';
import Modal from './Modal.jsx';
import RescheduleModal from './RescheduleModal.jsx';
import StatusBadge from './StatusBadge.jsx';

const SOURCE_LABELS = { website: 'Website booking', phone: 'Phone call', walk_in: 'Walk-in' };

function Row({ label, children }) {
  if (!children) return null;
  return (
    <div className="grid gap-1 py-2.5 sm:grid-cols-3">
      <dt className="text-sm font-semibold text-slate-500">{label}</dt>
      <dd className="text-slate-900 sm:col-span-2">{children}</dd>
    </div>
  );
}

/** Everything about one appointment, with the actions allowed for its current status. */
export default function AppointmentDetailModal({ appointment: initial, onClose, onChanged }) {
  const { user } = useAuth();
  const toast = useToast();
  const [appointment, setAppointment] = useState(initial);
  const [dialog, setDialog] = useState(null); // 'cancel' | 'reschedule' | 'followup'
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState(initial.staffNote || '');
  const [savingNote, setSavingNote] = useState(false);
  const [noteError, setNoteError] = useState(null);

  const canReschedule = user.role !== 'doctor';
  const { status } = appointment;
  const apply = (updated) => {
    setAppointment(updated);
    onChanged(updated);
  };

  const setStatus = async (next, successMessage) => {
    setBusy(true);
    try {
      const { appointment: updated } = await changeAppointmentStatus(appointment.id, { status: next });
      apply(updated);
      toast.success(successMessage);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setBusy(false);
    }
  };

  const cancel = async (reason) => {
    const { appointment: updated } = await changeAppointmentStatus(appointment.id, { status: 'cancelled', cancelReason: reason });
    apply(updated);
    toast.success('Appointment cancelled.');
  };

  const saveNote = async () => {
    setSavingNote(true);
    setNoteError(null);
    try {
      const { appointment: updated } = await updateAppointment(appointment.id, { staffNote: note });
      apply(updated);
      toast.success('Note saved.');
    } catch (error) {
      setNoteError(error.message);
    } finally {
      setSavingNote(false);
    }
  };

  const actions = [];
  if (status === 'pending') actions.push(<Button key="confirm" onClick={() => setStatus('confirmed', 'Appointment confirmed. The patient was emailed if an address is on file.')} disabled={busy}><CheckCircle2 className="h-4 w-4" aria-hidden="true" />Confirm</Button>);
  if (status === 'confirmed') {
    actions.push(<Button key="complete" onClick={() => setStatus('completed', 'Marked as completed.')} disabled={busy}><ClipboardCheck className="h-4 w-4" aria-hidden="true" />Mark completed</Button>);
    actions.push(<Button key="noshow" variant="outline" onClick={() => setStatus('no_show', 'Marked as a no-show.')} disabled={busy}><UserX className="h-4 w-4" aria-hidden="true" />No-show</Button>);
  }
  if (status === 'completed' || status === 'no_show') actions.push(<Button key="reopen" variant="outline" onClick={() => setStatus('confirmed', 'Appointment re-opened.')} disabled={busy}>Re-open</Button>);
  if (canReschedule && (status === 'pending' || status === 'confirmed')) actions.push(<Button key="resched" variant="outline" onClick={() => setDialog('reschedule')}><CalendarClock className="h-4 w-4" aria-hidden="true" />Reschedule</Button>);
  if (status === 'pending' || status === 'confirmed') actions.push(<Button key="cancel" variant="outline" className="!border-red-300 !text-red-700 hover:!bg-red-50" onClick={() => setDialog('cancel')}><XCircle className="h-4 w-4" aria-hidden="true" />Cancel</Button>);

  return (
    <>
      <Modal title={`Appointment ${appointment.bookingRef}`} size="lg" onClose={onClose}>
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <StatusBadge status={status} />
          <span className="text-sm text-slate-500">{SOURCE_LABELS[appointment.source]}</span>
        </div>

        <dl className="divide-y divide-slate-100 rounded-2xl border border-slate-200 px-4">
          <Row label="Patient">
            <Link to={`/admin/patients/${appointment.patient.id}`} className="font-bold text-brand-700 hover:underline">
              {appointment.patient.name}
            </Link>{' '}
            <StatusBadge status={appointment.patient.type} />
            <span className="mt-0.5 block text-sm text-slate-600">
              {appointment.patient.patientCode} · {appointment.patient.phone}
              {appointment.patient.email && ` · ${appointment.patient.email}`}
            </span>
            {appointment.patient.guardianName && <span className="block text-sm text-slate-600">Guardian: {appointment.patient.guardianName}</span>}
          </Row>
          <Row label="When">
            {formatDateOnly(appointment.appointmentDate)}, {formatTime(appointment.startTime)} – {formatTime(appointment.endTime)}
          </Row>
          <Row label="Doctor">{appointment.doctor.name}</Row>
          <Row label="Where">
            {appointment.location.name}
            <span className="block text-sm text-slate-600">{appointment.location.address}</span>
          </Row>
          <Row label="Reason">{appointment.reason}</Row>
          {status === 'cancelled' && <Row label="Cancelled because">{appointment.cancelReason || 'No reason given'}</Row>}
        </dl>

        <div className="mt-5 flex flex-wrap gap-2">
          <Button href={appointmentWhatsappLink(appointment)} target="_blank" rel="noopener noreferrer" variant="whatsapp">
            <MessageCircle className="h-4 w-4" aria-hidden="true" />
            WhatsApp patient
          </Button>
          <Button href={telHref(appointment.patient.phone)} variant="outline">
            <Phone className="h-4 w-4" aria-hidden="true" />
            Call
          </Button>
          <Button variant="outline" onClick={() => setDialog('followup')}>
            <ClipboardCheck className="h-4 w-4" aria-hidden="true" />
            Add follow-up
          </Button>
        </div>

        {actions.length > 0 && (
          <div className="mt-5 border-t border-slate-100 pt-5">
            <h3 className="mb-3 font-heading text-base font-extrabold">Actions {busy && <Loader2 className="ml-1 inline h-4 w-4 animate-spin" aria-hidden="true" />}</h3>
            <div className="flex flex-wrap gap-2">{actions}</div>
          </div>
        )}

        {user.role !== 'doctor' && (
          <div className="mt-5 border-t border-slate-100 pt-5">
            <Field label="Internal note" hint="Only staff can see this.">
              {(props) => <textarea {...props} rows={2} value={note} onChange={(event) => setNote(event.target.value)} maxLength={1000} className="field-input" />}
            </Field>
            <FormMessage type="error">{noteError}</FormMessage>
            <Button variant="outline" onClick={saveNote} disabled={savingNote || note === (appointment.staffNote || '')} className="mt-3">
              {savingNote && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
              Save note
            </Button>
          </div>
        )}
      </Modal>

      {dialog === 'cancel' && (
        <ConfirmDialog
          title="Cancel this appointment?"
          message={`${appointment.patient.name} will be told if an email address is on file, and the time slot becomes free again.`}
          confirmLabel="Cancel appointment"
          danger
          reasonLabel="Reason (optional)"
          onConfirm={cancel}
          onClose={() => setDialog(null)}
        />
      )}
      {dialog === 'reschedule' && <RescheduleModal appointment={appointment} onClose={() => setDialog(null)} onDone={apply} />}
      {dialog === 'followup' && (
        <FollowUpFormModal
          defaults={{ title: `Follow up: ${appointment.patient.name}`, patientId: appointment.patient.id, appointmentId: appointment.id }}
          context={`${appointment.patient.name} · ${appointment.bookingRef}`}
          onClose={() => setDialog(null)}
          onSaved={() => toast.success('Follow-up added.')}
        />
      )}
    </>
  );
}
