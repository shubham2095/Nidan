import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';
import { useToast } from '../../context/ToastContext.jsx';
import useFetch from '../../hooks/useFetch.js';
import { createLead, getUserOptions } from '../../services/crmService.js';
import { LEAD_SOURCES } from '../../utils/crm.js';
import { applyServerErrors } from '../../utils/forms.js';
import Button from '../public/Button.jsx';
import { ConsentCheckbox, Field, FormMessage } from '../public/FormField.jsx';
import Modal from './Modal.jsx';

const schema = z.object({
  name: z.string().trim().min(2, 'Enter the name').max(100),
  phone: z
    .string()
    .trim()
    .min(1, 'Enter a phone number')
    .refine((value) => {
      const digits = value.replace(/\D/g, '');
      return digits.length >= 10 && digits.length <= 13;
    }, 'Enter a valid phone number'),
  email: z.union([z.literal(''), z.email('Enter a valid email address')]),
  source: z.string().min(1),
  message: z.string().trim().max(2000),
  assignedTo: z.string(),
  nextFollowUpDate: z.string(),
  consent: z.boolean(),
});

/** Manual lead entry: someone who phoned, walked in, or messaged on Instagram. */
export default function LeadFormModal({ onClose, onSaved }) {
  const toast = useToast();
  const [formError, setFormError] = useState(null);
  const users = useFetch((signal) => getUserOptions(signal), []);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { name: '', phone: '', email: '', source: 'phone', message: '', assignedTo: '', nextFollowUpDate: '', consent: false },
  });

  const onSubmit = async (values) => {
    setFormError(null);
    try {
      const { lead } = await createLead({
        ...values,
        email: values.email || undefined,
        message: values.message || undefined,
        assignedTo: values.assignedTo || undefined,
        nextFollowUpDate: values.nextFollowUpDate || undefined,
      });
      toast.success(`Lead added: ${lead.name}.`);
      onSaved(lead);
      onClose();
    } catch (error) {
      if (!applyServerErrors(error, setError)) setFormError(error.message);
    }
  };

  return (
    <Modal
      title="New lead"
      size="lg"
      onClose={onClose}
      dismissible={!isSubmitting}
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>Cancel</Button>
          <Button type="submit" form="lead-form" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
            Add lead
          </Button>
        </>
      }
    >
      <form id="lead-form" onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Name" required error={errors.name?.message}>
            {(props) => <input {...props} {...register('name')} data-autofocus autoComplete="off" className="field-input" />}
          </Field>
          <Field label="Phone number" required error={errors.phone?.message}>
            {(props) => <input {...props} {...register('phone')} type="tel" inputMode="tel" autoComplete="off" className="field-input" />}
          </Field>
          <Field label="Email (optional)" error={errors.email?.message}>
            {(props) => <input {...props} {...register('email')} type="email" autoComplete="off" className="field-input" />}
          </Field>
          <Field label="Where did they come from?" required error={errors.source?.message}>
            {(props) => (
              <select {...props} {...register('source')} className="field-input">
                {LEAD_SOURCES.filter(([key]) => key !== 'booking_dropoff').map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            )}
          </Field>
          <Field label="Assigned to" error={errors.assignedTo?.message}>
            {(props) => (
              <select {...props} {...register('assignedTo')} className="field-input">
                <option value="">Nobody yet</option>
                {users.data?.items.map((person) => (
                  <option key={person.id} value={person.id}>{person.name}</option>
                ))}
              </select>
            )}
          </Field>
          <Field label="Next follow-up (optional)" error={errors.nextFollowUpDate?.message}>
            {(props) => <input {...props} {...register('nextFollowUpDate')} type="date" className="field-input" />}
          </Field>
        </div>
        <Field label="What do they need? (optional)" error={errors.message?.message}>
          {(props) => <textarea {...props} {...register('message')} rows={3} className="field-input" />}
        </Field>
        <ConsentCheckbox {...register('consent')} error={errors.consent?.message}>
          They agreed to be contacted and for their details to be stored.
        </ConsentCheckbox>
        <FormMessage type="error">{formError}</FormMessage>
      </form>
    </Modal>
  );
}
