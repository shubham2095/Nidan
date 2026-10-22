import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';
import { useToast } from '../../context/ToastContext.jsx';
import { changePassword } from '../../services/authService.js';
import { applyServerErrors } from '../../utils/forms.js';
import Button from '../public/Button.jsx';
import { Field, FormMessage } from '../public/FormField.jsx';
import Modal from './Modal.jsx';

export const newPasswordRules = z
  .string()
  .min(8, 'Use at least 8 characters')
  .max(72, 'Use at most 72 characters')
  .refine((value) => /[A-Za-z]/.test(value) && /\d/.test(value), 'Include at least one letter and one number');

const schema = z
  .object({ currentPassword: z.string().min(1, 'Enter your current password'), newPassword: newPasswordRules, confirm: z.string() })
  .refine((value) => value.newPassword === value.confirm, { path: ['confirm'], message: 'The passwords do not match' });

export default function ChangePasswordModal({ onClose }) {
  const toast = useToast();
  const [formError, setFormError] = useState(null);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(schema), defaultValues: { currentPassword: '', newPassword: '', confirm: '' } });

  const onSubmit = async ({ currentPassword, newPassword }) => {
    setFormError(null);
    try {
      await changePassword({ currentPassword, newPassword });
      toast.success('Your password has been changed.');
      onClose();
    } catch (error) {
      if (!applyServerErrors(error, setError)) setFormError(error.message);
    }
  };

  return (
    <Modal
      title="Change password"
      size="sm"
      onClose={onClose}
      dismissible={!isSubmitting}
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" form="change-password-form" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
            Save password
          </Button>
        </>
      }
    >
      <form id="change-password-form" onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        <Field label="Current password" required error={errors.currentPassword?.message}>
          {(props) => <input {...props} {...register('currentPassword')} type="password" autoComplete="current-password" data-autofocus className="field-input" />}
        </Field>
        <Field label="New password" required hint="At least 8 characters, with a letter and a number." error={errors.newPassword?.message}>
          {(props) => <input {...props} {...register('newPassword')} type="password" autoComplete="new-password" className="field-input" />}
        </Field>
        <Field label="Confirm new password" required error={errors.confirm?.message}>
          {(props) => <input {...props} {...register('confirm')} type="password" autoComplete="new-password" className="field-input" />}
        </Field>
        <FormMessage type="error">{formError}</FormMessage>
      </form>
    </Modal>
  );
}
