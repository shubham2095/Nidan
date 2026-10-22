import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';
import AuthCard from '../../components/admin/AuthCard.jsx';
import { newPasswordRules } from '../../components/admin/ChangePasswordModal.jsx';
import Button from '../../components/public/Button.jsx';
import { Field, FormMessage } from '../../components/public/FormField.jsx';
import { resetPassword } from '../../services/authService.js';
import { applyServerErrors } from '../../utils/forms.js';

const schema = z
  .object({ password: newPasswordRules, confirm: z.string() })
  .refine((value) => value.password === value.confirm, { path: ['confirm'], message: 'The passwords do not match' });

export default function ResetPasswordPage() {
  const [params] = useSearchParams();
  const token = params.get('token') || '';
  const [done, setDone] = useState(false);
  const [formError, setFormError] = useState(null);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(schema), defaultValues: { password: '', confirm: '' } });

  const onSubmit = async ({ password }) => {
    setFormError(null);
    try {
      await resetPassword({ token, password });
      setDone(true);
    } catch (error) {
      if (!applyServerErrors(error, (field, options) => setError(field === 'token' ? 'password' : field, options))) setFormError(error.message);
    }
  };

  if (done) {
    return (
      <AuthCard title="Password updated" description="You can now sign in with your new password.">
        <Button to="/admin/login" size="lg" className="w-full">
          Go to sign in
        </Button>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title="Choose a new password"
      description="Use at least 8 characters, with a letter and a number."
      footer={
        <Link to="/admin/forgot-password" className="font-semibold text-brand-700 hover:underline">
          Need a new link?
        </Link>
      }
    >
      {!token ? (
        <FormMessage type="error">This reset link is incomplete. Please use the link from your email, or request a new one.</FormMessage>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
          <Field label="New password" required error={errors.password?.message}>
            {(props) => <input {...props} {...register('password')} type="password" autoComplete="new-password" data-autofocus className="field-input" />}
          </Field>
          <Field label="Confirm new password" required error={errors.confirm?.message}>
            {(props) => <input {...props} {...register('confirm')} type="password" autoComplete="new-password" className="field-input" />}
          </Field>
          <FormMessage type="error">{formError}</FormMessage>
          <Button type="submit" size="lg" disabled={isSubmitting} className="w-full">
            {isSubmitting && <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />}
            Save new password
          </Button>
        </form>
      )}
    </AuthCard>
  );
}
