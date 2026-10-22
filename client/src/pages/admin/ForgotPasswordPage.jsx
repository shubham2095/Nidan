import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Mail } from 'lucide-react';
import AuthCard from '../../components/admin/AuthCard.jsx';
import Button from '../../components/public/Button.jsx';
import { Field, FormMessage } from '../../components/public/FormField.jsx';
import { forgotPassword } from '../../services/authService.js';

const schema = z.object({ email: z.string().trim().min(1, 'Enter your email').pipe(z.email('Enter a valid email address')) });

export default function ForgotPasswordPage() {
  const [result, setResult] = useState(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(schema), defaultValues: { email: '' } });

  const onSubmit = async ({ email }) => {
    setResult(null);
    try {
      const response = await forgotPassword(email);
      setResult({ type: 'success', message: response.message });
    } catch (error) {
      setResult({ type: 'error', message: error.message });
    }
  };

  return (
    <AuthCard
      title="Reset your password"
      description="Enter your staff email and we will send you a link to choose a new password."
      footer={
        <Link to="/admin/login" className="font-semibold text-brand-700 hover:underline">
          Back to sign in
        </Link>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
        <Field label="Email" required error={errors.email?.message}>
          {(props) => <input {...props} {...register('email')} type="email" autoComplete="email" data-autofocus className="field-input" />}
        </Field>
        <FormMessage type={result?.type}>{result?.message}</FormMessage>
        <Button type="submit" size="lg" disabled={isSubmitting} className="w-full">
          {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" /> : <Mail className="h-5 w-5" aria-hidden="true" />}
          Send reset link
        </Button>
      </form>
    </AuthCard>
  );
}
