import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useToast } from '../../context/ToastContext.jsx';
import { markVaccination } from '../../services/adminService.js';
import { todayIso } from '../../utils/crm.js';
import { formatDateOnly } from '../../utils/format.js';
import Button from '../public/Button.jsx';
import { Field, FormMessage } from '../public/FormField.jsx';
import Modal from './Modal.jsx';

/** Records that a vaccine dose was given (defaults to today). `record` needs { id, vaccine: { name }, dueDate }. */
export default function MarkGivenModal({ patientId, childName, record, onClose, onSaved }) {
  const toast = useToast();
  const [givenDate, setGivenDate] = useState(todayIso());
  const [notes, setNotes] = useState(record.notes || '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const save = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await markVaccination(patientId, record.id, { givenDate, notes });
      toast.success(`${record.vaccine.name} recorded${childName ? ` for ${childName}` : ''}.`);
      onSaved();
      onClose();
    } catch (failure) {
      setError(failure.response?.data?.details?.[0]?.message ? `${failure.message} (${failure.response.data.details[0].message})` : failure.message);
      setBusy(false);
    }
  };

  return (
    <Modal
      title="Record vaccination"
      size="sm"
      onClose={onClose}
      dismissible={!busy}
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={busy}>Cancel</Button>
          <Button type="submit" form="given-form" disabled={busy || !givenDate}>
            {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
            Save
          </Button>
        </>
      }
    >
      <p className="mb-4 text-sm text-slate-700">
        <strong>{record.vaccine.name}</strong>
        {childName && <> for <strong>{childName}</strong></>}. Due {formatDateOnly(record.dueDate)}.
      </p>
      <form id="given-form" onSubmit={save} className="space-y-4">
        <Field label="Date given" required>
          {(props) => <input {...props} type="date" value={givenDate} max={todayIso()} onChange={(event) => setGivenDate(event.target.value)} data-autofocus className="field-input" />}
        </Field>
        <Field label="Note (optional)" hint="e.g. batch number, which arm, any reaction">
          {(props) => <textarea {...props} rows={2} value={notes} onChange={(event) => setNotes(event.target.value)} maxLength={500} className="field-input" />}
        </Field>
        <FormMessage type="error">{error}</FormMessage>
      </form>
    </Modal>
  );
}
