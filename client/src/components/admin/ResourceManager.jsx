import { useState } from 'react';
import { ArrowDown, ArrowUp, Loader2, Pencil, Plus, Trash2 } from 'lucide-react';
import { useToast } from '../../context/ToastContext.jsx';
import useFetch from '../../hooks/useFetch.js';
import { fromRow, serverFieldErrors } from '../../utils/crm.js';
import Button from '../public/Button.jsx';
import { FormMessage } from '../public/FormField.jsx';
import AdminHeader from './AdminHeader.jsx';
import ConfirmDialog from './ConfirmDialog.jsx';
import DataTable from './DataTable.jsx';
import FieldInput from './FieldInput.jsx';
import Modal from './Modal.jsx';

function FormDialog({ title, fields, initial, onSave, onClose }) {
  const [values, setValues] = useState(initial);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState(null);
  const [busy, setBusy] = useState(false);

  const change = (name, value) => setValues((current) => ({ ...current, [name]: value }));

  const submit = async (event) => {
    event.preventDefault();
    const missing = {};
    fields.filter((field) => field.required).forEach((field) => {
      if (!String(values[field.name] ?? '').trim()) missing[field.name] = 'This is required';
    });
    setErrors(missing);
    if (Object.keys(missing).length) {
      setFormError('Please fill in the highlighted fields.');
      return;
    }
    setBusy(true);
    setFormError(null);
    try {
      await onSave(values);
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
      title={title}
      size="lg"
      onClose={onClose}
      dismissible={!busy}
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={busy}>Cancel</Button>
          <Button type="submit" form="resource-form" disabled={busy}>
            {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
            Save
          </Button>
        </>
      }
    >
      <form id="resource-form" onSubmit={submit} noValidate className="grid gap-4 sm:grid-cols-2">
        {fields.map((field) => (
          <FieldInput key={field.name} field={field} value={values[field.name]} error={errors[field.name]} onChange={change} />
        ))}
        <div className="sm:col-span-2">
          <FormMessage type="error">{formError}</FormMessage>
        </div>
      </form>
    </Modal>
  );
}

/**
 * List + add / edit / delete / reorder for a simple managed table.
 *  api:      { list, create, update, remove, reorder? } (services/adminService.js `resource()`)
 *  columns:  DataTable columns (rows are the server's items)
 *  fields:   [{ name, label, type, required, hint, options, wide, upload ... }]
 *  initial:  values for a new record (existing rows are mapped onto the same keys)
 */
export default function ResourceManager({
  title, description, singular, api, columns, fields, initial, canReorder = false,
  emptyMessage, deleteMessage, embedded = false, readOnly = false, onChanged = () => {},
}) {
  const toast = useToast();
  const { data, loading, error, reload } = useFetch((signal) => api.list(signal), []);
  const [editing, setEditing] = useState(null); // 'new' | row
  const [deleting, setDeleting] = useState(null);
  const items = data?.items;

  const save = async (values) => {
    if (editing === 'new') await api.create(values);
    else await api.update(editing.id, values);
    toast.success(`${singular} saved.`);
    reload();
    onChanged();
  };

  const move = async (index, delta) => {
    const ids = items.map((item) => item.id);
    const [moved] = ids.splice(index, 1);
    ids.splice(index + delta, 0, moved);
    try {
      await api.reorder(ids);
      reload();
      onChanged();
    } catch (failure) {
      toast.error(failure.message);
    }
  };

  const actionColumn = {
    key: 'actions',
    header: <span className="sr-only">Actions</span>,
    className: 'text-right whitespace-nowrap',
    render: (row) => {
      const index = items.findIndex((item) => item.id === row.id);
      return (
        <span className="inline-flex items-center gap-0.5" onClick={(event) => event.stopPropagation()}>
          {canReorder && (
            <>
              <button type="button" onClick={() => move(index, -1)} disabled={index === 0} aria-label="Move up" className="rounded-full p-2 text-slate-500 hover:bg-slate-100 disabled:opacity-30"><ArrowUp className="h-4 w-4" aria-hidden="true" /></button>
              <button type="button" onClick={() => move(index, 1)} disabled={index === items.length - 1} aria-label="Move down" className="rounded-full p-2 text-slate-500 hover:bg-slate-100 disabled:opacity-30"><ArrowDown className="h-4 w-4" aria-hidden="true" /></button>
            </>
          )}
          <button type="button" onClick={() => setEditing(row)} aria-label={`Edit ${row.name || row.title}`} className="rounded-full p-2 text-slate-500 hover:bg-slate-100"><Pencil className="h-4 w-4" aria-hidden="true" /></button>
          <button type="button" onClick={() => setDeleting(row)} aria-label={`Delete ${row.name || row.title}`} className="rounded-full p-2 text-slate-500 hover:bg-red-50 hover:text-red-600"><Trash2 className="h-4 w-4" aria-hidden="true" /></button>
        </span>
      );
    },
  };

  const addButton = readOnly ? null : (
    <Button onClick={() => setEditing('new')}>
      <Plus className="h-4 w-4" aria-hidden="true" />
      Add {singular.toLowerCase()}
    </Button>
  );

  return (
    <>
      {embedded ? (
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="font-heading text-lg font-extrabold">{title}</h2>
          {addButton}
        </div>
      ) : (
        <AdminHeader title={title} description={description} actions={addButton} />
      )}

      <DataTable
        caption={title}
        columns={readOnly ? columns : [...columns, actionColumn]}
        rows={items}
        loading={loading}
        error={error}
        onRetry={reload}
        onRowClick={readOnly ? undefined : setEditing}
        emptyTitle={`No ${title.toLowerCase()} yet`}
        emptyMessage={emptyMessage}
      />

      {editing && (
        <FormDialog
          title={editing === 'new' ? `Add ${singular.toLowerCase()}` : `Edit ${singular.toLowerCase()}`}
          fields={fields}
          initial={editing === 'new' ? initial : fromRow(editing, initial)}
          onSave={save}
          onClose={() => setEditing(null)}
        />
      )}
      {deleting && (
        <ConfirmDialog
          title={`Delete this ${singular.toLowerCase()}?`}
          message={deleteMessage ? deleteMessage(deleting) : `“${deleting.name || deleting.title}” will be permanently removed.`}
          confirmLabel="Delete"
          danger
          onConfirm={async () => {
            await api.remove(deleting.id);
            toast.success(`${singular} deleted.`);
            reload();
            onChanged();
          }}
          onClose={() => setDeleting(null)}
        />
      )}
    </>
  );
}
