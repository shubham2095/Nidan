import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Link2, Loader2, Plus, Unlink } from 'lucide-react';
import { useToast } from '../../context/ToastContext.jsx';
import { addRelation, removeRelation } from '../../services/crmService.js';
import Button from '../public/Button.jsx';
import { Field, FormMessage } from '../public/FormField.jsx';
import ConfirmDialog from './ConfirmDialog.jsx';
import Modal from './Modal.jsx';
import PatientPicker from './PatientPicker.jsx';
import StatusBadge from './StatusBadge.jsx';

const KINDS = [
  ['mother_of', 'is the mother of'],
  ['child_of', 'is the child of'],
  ['sibling_of', 'is a sibling of'],
  ['guardian_of', 'is the guardian of'],
  ['ward_of', 'is the ward of'],
  ['other', 'is linked to'],
];

function LinkModal({ patient, onClose, onLinked }) {
  const toast = useToast();
  const [other, setOther] = useState(null);
  const [thisIs, setThisIs] = useState(patient.type === 'child' ? 'child_of' : 'mother_of');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const save = async () => {
    setBusy(true);
    setError(null);
    try {
      const { relations } = await addRelation(patient.id, { otherPatientId: other.id, thisIs });
      toast.success('Family link added.');
      onLinked(relations);
      onClose();
    } catch (failure) {
      setError(failure.message);
      setBusy(false);
    }
  };

  return (
    <Modal
      title="Link a family member"
      size="md"
      onClose={onClose}
      dismissible={!busy}
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={busy}>Cancel</Button>
          <Button onClick={save} disabled={!other || busy}>
            {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
            Add link
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label={`${patient.name}…`}>
          {(props) => (
            <select {...props} value={thisIs} onChange={(event) => setThisIs(event.target.value)} className="field-input">
              {KINDS.map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          )}
        </Field>
        <PatientPicker value={other} onChange={setOther} />
        <FormMessage type="error">{error}</FormMessage>
      </div>
    </Modal>
  );
}

/** Mother ↔ child (and other) links for a patient. Reception and admins can add or remove links. */
export default function FamilyLinks({ patient, relations, canEdit, onChange }) {
  const toast = useToast();
  const [adding, setAdding] = useState(false);
  const [removing, setRemoving] = useState(null);

  return (
    <div>
      {relations.length === 0 && <p className="text-sm text-slate-500">No family members linked yet.</p>}
      <ul className="space-y-2">
        {relations.map((relation) => (
          <li key={relation.id} className="flex items-center justify-between gap-3 rounded-2xl bg-slate-50 px-4 py-3">
            <Link to={`/admin/patients/${relation.patient.id}`} className="min-w-0">
              <span className="block truncate font-semibold text-slate-900 hover:text-brand-700">{relation.patient.name}</span>
              <span className="flex items-center gap-2 text-xs text-slate-500">
                <StatusBadge status={relation.patient.type} label={relation.label} />
                {relation.patient.patientCode}
              </span>
            </Link>
            {canEdit && (
              <button type="button" onClick={() => setRemoving(relation)} aria-label={`Remove link to ${relation.patient.name}`} className="rounded-full p-2 text-slate-400 hover:bg-white hover:text-red-600">
                <Unlink className="h-4 w-4" aria-hidden="true" />
              </button>
            )}
          </li>
        ))}
      </ul>
      {canEdit && (
        <Button variant="outline" onClick={() => setAdding(true)} className="mt-3">
          {relations.length ? <Plus className="h-4 w-4" aria-hidden="true" /> : <Link2 className="h-4 w-4" aria-hidden="true" />}
          Link a family member
        </Button>
      )}

      {adding && <LinkModal patient={patient} onClose={() => setAdding(false)} onLinked={onChange} />}
      {removing && (
        <ConfirmDialog
          title="Remove this link?"
          message={`${patient.name} and ${removing.patient.name} will no longer be shown as family. Neither patient is deleted.`}
          confirmLabel="Remove link"
          danger
          onConfirm={async () => {
            const { relations: updated } = await removeRelation(patient.id, removing.id);
            toast.success('Link removed.');
            onChange(updated);
          }}
          onClose={() => setRemoving(null)}
        />
      )}
    </div>
  );
}
