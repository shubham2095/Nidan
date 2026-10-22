import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Check, Pencil, Plus, Trash2, X } from 'lucide-react';
import AdminHeader from '../../components/admin/AdminHeader.jsx';
import ConfirmDialog from '../../components/admin/ConfirmDialog.jsx';
import FieldInput from '../../components/admin/FieldInput.jsx';
import Modal from '../../components/admin/Modal.jsx';
import StatusBadge from '../../components/admin/StatusBadge.jsx';
import Button from '../../components/public/Button.jsx';
import { FormMessage } from '../../components/public/FormField.jsx';
import Pagination from '../../components/public/Pagination.jsx';
import StarRating from '../../components/public/StarRating.jsx';
import { EmptyState, ErrorState, LoadingState } from '../../components/public/States.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import useFetch from '../../hooks/useFetch.js';
import { createTestimonial, deleteTestimonial, listTestimonials, updateTestimonial } from '../../services/adminService.js';
import { fromRow, serverFieldErrors } from '../../utils/crm.js';
import { formatDate } from '../../utils/format.js';

const TABS = [['pending', 'To review'], ['approved', 'Published'], ['rejected', 'Rejected'], ['', 'All']];
const initial = { name: '', label: '', rating: '', content: '' };
const fields = [
  { name: 'name', label: 'Name', required: true },
  { name: 'label', label: 'About them (optional)', hint: 'e.g. Mother of a newborn' },
  { name: 'rating', label: 'Rating (optional)', type: 'select', options: [['', 'No rating'], ['5', '5 stars'], ['4', '4 stars'], ['3', '3 stars'], ['2', '2 stars'], ['1', '1 star']] },
  { name: 'content', label: 'Testimonial', type: 'textarea', rows: 5, required: true },
];

function TestimonialModal({ existing, onClose, onSaved }) {
  const toast = useToast();
  const [values, setValues] = useState(existing ? fromRow({ ...existing, rating: existing.rating ? String(existing.rating) : '' }, initial) : initial);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState(null);
  const [busy, setBusy] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    if (!values.name.trim() || !values.content.trim()) {
      setErrors({ name: values.name.trim() ? undefined : 'This is required', content: values.content.trim() ? undefined : 'This is required' });
      return;
    }
    setBusy(true);
    setFormError(null);
    try {
      const body = { ...values, rating: values.rating || (existing ? '' : undefined) };
      if (existing) await updateTestimonial(existing.id, body);
      else await createTestimonial(body);
      toast.success('Testimonial saved.');
      onSaved();
      onClose();
    } catch (error) {
      const { fields: fieldErrors, message } = serverFieldErrors(error, []);
      setErrors(fieldErrors);
      setFormError(message);
      setBusy(false);
    }
  };

  return (
    <Modal
      title={existing ? 'Edit testimonial' : 'Add testimonial'}
      onClose={onClose}
      dismissible={!busy}
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={busy}>Cancel</Button>
          <Button type="submit" form="testimonial-form" disabled={busy}>Save</Button>
        </>
      }
    >
      <form id="testimonial-form" onSubmit={submit} noValidate className="grid gap-4">
        {fields.map((field) => <FieldInput key={field.name} field={field} value={values[field.name]} error={errors[field.name]} onChange={(name, value) => setValues((current) => ({ ...current, [name]: value }))} />)}
        {!existing && <p className="text-sm text-slate-500">Testimonials you add are published straight away. Get the person&apos;s permission first.</p>}
        <FormMessage type="error">{formError}</FormMessage>
      </form>
    </Modal>
  );
}

export default function TestimonialsAdminPage() {
  const toast = useToast();
  const [params, setParams] = useSearchParams();
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const status = TABS.some(([key]) => key === (params.get('status') ?? 'pending')) ? params.get('status') ?? 'pending' : 'pending';
  const page = Math.max(1, Number(params.get('page')) || 1);

  const { data, loading, error, reload } = useFetch((signal) => listTestimonials({ status: status || undefined, page, pageSize: 20 }, signal), [status, page]);

  const set = (changes) => {
    const next = new URLSearchParams(params);
    Object.entries(changes).forEach(([key, value]) => (value === undefined ? next.delete(key) : next.set(key, value)));
    setParams(next, { replace: true });
  };

  const decide = async (item, nextStatus) => {
    try {
      await updateTestimonial(item.id, { status: nextStatus });
      toast.success(nextStatus === 'approved' ? 'Published on the website.' : 'Rejected. It will not be shown.');
      reload();
    } catch (failure) {
      toast.error(failure.message);
    }
  };

  return (
    <>
      <AdminHeader
        title="Testimonials"
        description="Reviews from visitors wait here until someone approves them. Only approved testimonials appear on the website."
        actions={<Button onClick={() => setEditing('new')}><Plus className="h-4 w-4" aria-hidden="true" />Add testimonial</Button>}
      />
      <div role="tablist" aria-label="Testimonial status" className="mb-5 flex flex-wrap gap-1.5">
        {TABS.map(([key, label]) => (
          <button key={key || 'all'} type="button" role="tab" aria-selected={status === key} onClick={() => set({ status: key === 'pending' ? undefined : key, page: undefined })} className={`rounded-full px-4 py-2 text-sm font-semibold ${status === key ? 'bg-brand-700 text-white' : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50'}`}>
            {label}{key === 'pending' && data?.pendingCount > 0 && ` (${data.pendingCount})`}
          </button>
        ))}
      </div>

      {loading && !data && <LoadingState />}
      {error && <ErrorState message={error} onRetry={reload} />}
      {data && data.items.length === 0 && <EmptyState title={status === 'pending' ? 'Nothing waiting for review' : 'No testimonials here'} message="Visitors can share their experience from the Testimonials page on the website." />}
      <ul className="space-y-3">
        {data?.items.map((item) => (
          <li key={item.id} className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-bold text-slate-900">{item.name}{item.label && <span className="font-normal text-slate-500"> · {item.label}</span>}</p>
                <p className="mt-0.5 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                  <StatusBadge status={item.status === 'approved' ? 'completed' : item.status === 'rejected' ? 'cancelled' : 'pending'} label={item.status === 'approved' ? 'Published' : item.status === 'rejected' ? 'Rejected' : 'To review'} />
                  <span>{formatDate(item.createdAt)} · {item.source === 'website' ? 'from the website' : 'added by staff'}</span>
                  <StarRating value={item.rating} />
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                {item.status !== 'approved' && <Button onClick={() => decide(item, 'approved')}><Check className="h-4 w-4" aria-hidden="true" />Approve</Button>}
                {item.status !== 'rejected' && <Button variant="outline" onClick={() => decide(item, 'rejected')}><X className="h-4 w-4" aria-hidden="true" />Reject</Button>}
                <button type="button" onClick={() => setEditing(item)} aria-label={`Edit testimonial from ${item.name}`} className="rounded-full p-2 text-slate-500 hover:bg-slate-100"><Pencil className="h-4 w-4" aria-hidden="true" /></button>
                <button type="button" onClick={() => setDeleting(item)} aria-label={`Delete testimonial from ${item.name}`} className="rounded-full p-2 text-slate-500 hover:bg-red-50 hover:text-red-600"><Trash2 className="h-4 w-4" aria-hidden="true" /></button>
              </div>
            </div>
            <p className="mt-3 whitespace-pre-wrap text-slate-700">{item.content}</p>
          </li>
        ))}
      </ul>
      {data && <Pagination page={data.page} totalPages={data.totalPages} onChange={(next) => set({ page: next > 1 ? String(next) : undefined })} />}

      {editing && <TestimonialModal existing={editing === 'new' ? null : editing} onClose={() => setEditing(null)} onSaved={reload} />}
      {deleting && (
        <ConfirmDialog
          title="Delete this testimonial?"
          message={`The testimonial from ${deleting.name} will be permanently removed.`}
          confirmLabel="Delete"
          danger
          onConfirm={async () => { await deleteTestimonial(deleting.id); toast.success('Testimonial deleted.'); reload(); }}
          onClose={() => setDeleting(null)}
        />
      )}
    </>
  );
}
