import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useToast } from '../../context/ToastContext.jsx';
import { createPatient, updatePatient } from '../../services/crmService.js';
import { emptyPatient, serverFieldErrors, toPatientBody, validatePatient } from '../../utils/crm.js';
import Button from '../public/Button.jsx';
import { ConsentCheckbox, FormMessage } from '../public/FormField.jsx';
import Modal from './Modal.jsx';
import PatientFields from './PatientFields.jsx';

/** Add a patient, or edit one when `patient` is given. */
export default function PatientFormModal({ patient = null, onClose, onSaved }) {
  const toast = useToast();
  const editing = Boolean(patient);
  const [value, setValue] = useState(() =>
    patient
      ? { ...emptyPatient(), type: patient.type, name: patient.name, phone: patient.phone, email: patient.email || '', gender: patient.gender || '', guardianName: patient.guardianName || '', dob: patient.dob || '', tags: patient.tags.join(', ') }
      : emptyPatient(),
  );
  const [consent, setConsent] = useState(false);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState(null);
  const [duplicateId, setDuplicateId] = useState(null);
  const [busy, setBusy] = useState(false);

  const patch = (changes) => setValue((current) => ({ ...current, ...changes }));

  const submit = async (event) => {
    event.preventDefault();
    const found = validatePatient(value);
    if (!editing && !consent) found.consent = 'Confirm that the patient agrees to their details being stored.';
    setErrors(found);
    setDuplicateId(null);
    if (Object.keys(found).length) {
      setFormError('Please check the highlighted fields.');
      return;
    }

    setBusy(true);
    setFormError(null);
    try {
      const body = toPatientBody(value, { editing });
      const { patient: saved } = editing ? await updatePatient(patient.id, body) : await createPatient({ ...body, consent: true });
      toast.success(editing ? 'Patient updated.' : `Added ${saved.name} (${saved.patientCode}).`);
      onSaved(saved);
      onClose();
    } catch (error) {
      const { fields, message } = serverFieldErrors(error);
      setErrors(fields);
      setFormError(message);
      setDuplicateId(error.response?.data?.details?.code === 'duplicate_patient' ? error.response.data.details.patientId : null);
      setBusy(false);
    }
  };

  return (
    <Modal
      title={editing ? 'Edit patient' : 'New patient'}
      size="lg"
      onClose={onClose}
      dismissible={!busy}
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button type="submit" form="patient-form" disabled={busy}>
            {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
            {editing ? 'Save changes' : 'Add patient'}
          </Button>
        </>
      }
    >
      <form id="patient-form" onSubmit={submit} noValidate className="space-y-5">
        <PatientFields value={value} onChange={patch} errors={errors} showTags />
        {!editing && (
          <ConsentCheckbox checked={consent} onChange={(event) => setConsent(event.target.checked)} error={errors.consent}>
            The patient (or parent) has agreed to their details being stored for their care.
          </ConsentCheckbox>
        )}
        <FormMessage type="error">{formError}</FormMessage>
        {duplicateId && (
          <p className="text-sm">
            <Link to={`/admin/patients/${duplicateId}`} className="font-semibold text-brand-700 hover:underline" onClick={onClose}>
              Open the existing patient
            </Link>
          </p>
        )}
      </form>
    </Modal>
  );
}
