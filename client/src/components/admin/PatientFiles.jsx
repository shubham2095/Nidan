import { useRef, useState } from 'react';
import { Download, FileText, Image, Loader2, Trash2, Upload } from 'lucide-react';
import { EmptyState, ErrorState, LoadingState } from '../public/States.jsx';
import Button from '../public/Button.jsx';
import { Field, FormMessage } from '../public/FormField.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import useFetch from '../../hooks/useFetch.js';
import { deleteAttachment, downloadAttachment, listAttachments, uploadAttachment } from '../../services/crmService.js';
import { formatDate } from '../../utils/format.js';
import ConfirmDialog from './ConfirmDialog.jsx';

const MAX_BYTES = 10 * 1024 * 1024;
const readableSize = (bytes) => (bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`);

/** Reports and scans for a patient. Files are private: they only download through the signed-in CRM. */
export default function PatientFiles({ patientId }) {
  const { user } = useAuth();
  const toast = useToast();
  const { data, loading, error, reload } = useFetch((signal) => listAttachments(patientId, signal), [patientId]);
  const [title, setTitle] = useState('');
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [formError, setFormError] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [downloadingId, setDownloadingId] = useState(null);
  const input = useRef(null);

  const pick = (event) => {
    const chosen = event.target.files?.[0] || null;
    setFormError(null);
    if (chosen && chosen.size > MAX_BYTES) {
      setFormError('That file is larger than 10 MB.');
      event.target.value = '';
      setFile(null);
      return;
    }
    setFile(chosen);
    if (chosen && !title) setTitle(chosen.name.replace(/\.[^.]+$/, ''));
  };

  const upload = async (event) => {
    event.preventDefault();
    if (!file || !title.trim()) return;
    setUploading(true);
    setFormError(null);
    try {
      await uploadAttachment(patientId, { title: title.trim(), file });
      setTitle('');
      setFile(null);
      if (input.current) input.current.value = '';
      toast.success('File uploaded.');
      reload();
    } catch (failure) {
      setFormError(failure.message);
    } finally {
      setUploading(false);
    }
  };

  const download = async (attachment) => {
    setDownloadingId(attachment.id);
    try {
      await downloadAttachment(attachment);
    } catch (failure) {
      toast.error(failure.message);
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div className="space-y-5">
      <form onSubmit={upload} className="space-y-3 rounded-2xl border border-slate-200 p-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Title" hint="e.g. Blood test, 12 weeks scan">
            {(props) => <input {...props} value={title} onChange={(event) => setTitle(event.target.value)} maxLength={200} className="field-input" />}
          </Field>
          <Field label="File (PDF, JPG, PNG or WebP, up to 10 MB)">
            {(props) => <input {...props} ref={input} type="file" accept=".pdf,.jpg,.jpeg,.png,.webp,application/pdf,image/jpeg,image/png,image/webp" onChange={pick} className="field-input file:mr-3 file:rounded-full file:border-0 file:bg-brand-50 file:px-3 file:py-1 file:font-semibold file:text-brand-800" />}
          </Field>
        </div>
        <FormMessage type="error">{formError}</FormMessage>
        <Button type="submit" disabled={uploading || !file || !title.trim()}>
          {uploading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Upload className="h-4 w-4" aria-hidden="true" />}
          Upload
        </Button>
      </form>

      {loading && !data && <LoadingState className="py-8" />}
      {error && <ErrorState message={error} onRetry={reload} className="py-8" />}
      {data && data.items.length === 0 && <EmptyState title="No files yet" message="Reports and scans you upload appear here." className="py-8" />}
      {data && data.items.length > 0 && (
        <ul className="divide-y divide-slate-100 rounded-2xl border border-slate-200 bg-white">
          {data.items.map((attachment) => (
            <li key={attachment.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
              {attachment.mimeType === 'application/pdf' ? <FileText className="h-6 w-6 shrink-0 text-red-500" aria-hidden="true" /> : <Image className="h-6 w-6 shrink-0 text-brand-600" aria-hidden="true" />}
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-slate-900">{attachment.title}</p>
                <p className="truncate text-xs text-slate-500">
                  {attachment.originalName} · {readableSize(attachment.sizeBytes)} · {formatDate(attachment.createdAt)}
                  {attachment.uploadedBy && ` · ${attachment.uploadedBy}`}
                </p>
              </div>
              <Button variant="outline" onClick={() => download(attachment)} disabled={downloadingId === attachment.id} aria-label={`Download ${attachment.title}`}>
                {downloadingId === attachment.id ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Download className="h-4 w-4" aria-hidden="true" />}
                Download
              </Button>
              {(user.role === 'super_admin' || attachment.uploadedBy === user.name) && (
                <button type="button" onClick={() => setDeleting(attachment)} aria-label={`Delete ${attachment.title}`} className="rounded-full p-2 text-slate-400 hover:bg-red-50 hover:text-red-600">
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      {deleting && (
        <ConfirmDialog
          title="Delete this file?"
          message={`“${deleting.title}” will be permanently removed.`}
          confirmLabel="Delete file"
          danger
          onConfirm={async () => {
            await deleteAttachment(deleting.id);
            toast.success('File deleted.');
            reload();
          }}
          onClose={() => setDeleting(null)}
        />
      )}
    </div>
  );
}
