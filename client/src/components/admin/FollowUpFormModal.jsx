import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import useFetch from '../../hooks/useFetch.js';
import { createFollowUp, getUserOptions, updateFollowUp } from '../../services/crmService.js';
import { todayIso } from '../../utils/crm.js';
import { applyServerErrors } from '../../utils/forms.js';
import Button from '../public/Button.jsx';
import { Field, FormMessage } from '../public/FormField.jsx';
import Modal from './Modal.jsx';

const schema = z.object({
  title: z.string().trim().min(2, 'Give the task a title').max(200, 'Please use 200 characters or fewer'),
  description: z.string().trim().max(2000, 'Please use 2000 characters or fewer'),
  dueDate: z.string().min(1, 'Choose a due date'),
  assignedTo: z.string(),
});

/**
 * Add or edit a follow-up task. `defaults` pre-links it ({ patientId, leadId, appointmentId, title });
 * `existing` switches to edit mode; `context` is shown so staff know what it is attached to.
 */
export default function FollowUpFormModal({ defaults = {}, existing = null, context, onClose, onSaved }) {
  const { user } = useAuth();
  const isDoctor = user.role === 'doctor';
  const [formError, setFormError] = useState(null);
  const users = useFetch((signal) => (isDoctor ? Promise.resolve(null) : getUserOptions(signal)), [isDoctor]);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      title: existing?.title || defaults.title || '',
      description: existing?.description || '',
      dueDate: existing?.dueDate || todayIso(),
      assignedTo: existing ? (existing.assignee ? String(existing.assignee.id) : '') : String(user.id),
    },
  });

  const onSubmit = async (values) => {
    setFormError(null);
    try {
      const body = { title: values.title, description: values.description, dueDate: values.dueDate, ...(!isDoctor && { assignedTo: values.assignedTo ? Number(values.assignedTo) : null }) };
      const { followUp } = existing
        ? await updateFollowUp(existing.id, body)
        : await createFollowUp({ ...body, patientId: defaults.patientId, leadId: defaults.leadId, appointmentId: defaults.appointmentId });
      onSaved(followUp);
      onClose();
    } catch (error) {
      if (!applyServerErrors(error, setError)) setFormError(error.message);
    }
  };

  return (
    <Modal
      title={existing ? 'Edit follow-up' : 'New follow-up'}
      size="md"
      onClose={onClose}
      dismissible={!isSubmitting}
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" form="followup-form" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
            {existing ? 'Save changes' : 'Add follow-up'}
          </Button>
        </>
      }
    >
      {context && <p className="mb-4 rounded-xl bg-brand-50 px-4 py-2.5 text-sm font-semibold text-brand-900">Linked to: {context}</p>}
      <form id="followup-form" onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        <Field label="Task" required error={errors.title?.message}>
          {(props) => <input {...props} {...register('title')} data-autofocus className="field-input" />}
        </Field>
        <Field label="Details (optional)" error={errors.description?.message}>
          {(props) => <textarea {...props} {...register('description')} rows={3} className="field-input" />}
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Due date" required error={errors.dueDate?.message}>
            {(props) => <input {...props} {...register('dueDate')} type="date" className="field-input" />}
          </Field>
          {!isDoctor && (
            <Field label="Assigned to" error={errors.assignedTo?.message}>
              {(props) => (
                <select {...props} {...register('assignedTo')} className="field-input">
                  <option value="">Nobody yet</option>
                  {users.data?.items.map((person) => (
                    <option key={person.id} value={person.id}>
                      {person.name}
                    </option>
                  ))}
                </select>
              )}
            </Field>
          )}
        </div>
        <FormMessage type="error">{formError}</FormMessage>
      </form>
    </Modal>
  );
}
