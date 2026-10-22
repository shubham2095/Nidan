import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useToast } from '../../context/ToastContext.jsx';
import { convertLead } from '../../services/crmService.js';
import { emptyPatient, serverFieldErrors, toPatientPayload, validatePatient } from '../../utils/crm.js';
import Button from '../public/Button.jsx';
import { FormMessage } from '../public/FormField.jsx';
import Modal from './Modal.jsx';
import PatientFields from './PatientFields.jsx';

/** Turns an enquiry into a patient record. The lead's phone number carries over. */
export default function ConvertLeadModal({ lead, onClose, onConverted }) {
  const toast = useToast();
  const [value, setValue] = useState({ ...emptyPatient(), name: lead.name, phone: lead.phone, email: lead.email || '' });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState(null);
  const [busy, setBusy] = useState(false);
  const patch = (changes) => setValue((current) => ({ ...current, ...changes }));

  const submit = async (event) => {
    event.preventDefault();
    const found = validatePatient(value, { identity: false });
    if (value.name.trim().length < 2) found.name = 'Enter the name';
    setErrors(found);
    if (Object.keys(found).length) return;

    setBusy(true);
    setFormError(null);
    try {
      const { patientId } = await convertLead(lead.id, toPatientPayload(value));
      toast.success('Converted to a patient.');
      onConverted(patientId);
      onClose();
    } catch (error) {
      const { fields, message } = serverFieldErrors(error, []);
      setErrors(fields);
      setFormError(message);
      setBusy(false);
    }
  };

  return (
    <Modal
      title="Convert to patient"
      size="lg"
      onClose={onClose}
      dismissible={!busy}
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={busy}>Cancel</Button>
          <Button type="submit" form="convert-form" disabled={busy}>
            {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
            Create patient
          </Button>
        </>
      }
    >
      <p className="mb-4 text-sm text-slate-600">
        A patient record is created for <strong>{lead.phone}</strong> (or an existing patient with the same name and number is used) and this lead is marked as converted.
      </p>
      <form id="convert-form" onSubmit={submit} noValidate className="space-y-4">
        <PatientFields value={value} onChange={patch} errors={errors} phoneReadOnly hideContact />
        <FormMessage type="error">{formError}</FormMessage>
      </form>
    </Modal>
  );
}
