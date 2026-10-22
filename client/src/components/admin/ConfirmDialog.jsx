import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import Button from '../public/Button.jsx';
import Modal from './Modal.jsx';

/**
 * Asks before something destructive. With `reasonLabel` it also collects a short reason,
 * passed to `onConfirm(reason)`. `onConfirm` may be async; the dialog closes when it resolves.
 */
export default function ConfirmDialog({ title, message, confirmLabel = 'Confirm', danger = false, reasonLabel, reasonRequired = false, onConfirm, onClose }) {
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const submit = async () => {
    if (reasonRequired && !reason.trim()) {
      setError('Please add a short reason.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await onConfirm(reason.trim() || undefined);
      onClose();
    } catch (failure) {
      setError(failure.message || 'Something went wrong.');
      setBusy(false);
    }
  };

  return (
    <Modal
      title={title}
      size="sm"
      onClose={onClose}
      dismissible={!busy}
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={busy} className={danger ? '!bg-red-600 hover:!bg-red-700' : ''}>
            {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
            {confirmLabel}
          </Button>
        </>
      }
    >
      <p className="text-slate-700">{message}</p>
      {reasonLabel && (
        <div className="mt-4">
          <label htmlFor="confirm-reason" className="mb-1.5 block text-sm font-semibold text-slate-800">
            {reasonLabel}
          </label>
          <textarea id="confirm-reason" data-autofocus rows={3} value={reason} onChange={(event) => setReason(event.target.value)} maxLength={500} className="field-input" />
        </div>
      )}
      {error && (
        <p role="alert" className="mt-3 text-sm text-red-600">
          {error}
        </p>
      )}
    </Modal>
  );
}
