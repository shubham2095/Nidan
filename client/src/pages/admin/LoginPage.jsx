import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, LogIn } from 'lucide-react';
import AuthCard from '../../components/admin/AuthCard.jsx';
import Button from '../../components/public/Button.jsx';
import { Field, FormMessage } from '../../components/public/FormField.jsx';
import { useAuth } from '../../context/AuthContext.jsx';

const schema = z.object({
  email: z.string().trim().min(1, 'Enter your email').pipe(z.email('Enter a valid email address')),
  password: z.string().min(1, 'Enter your password'),
});

export default function LoginPage() {
  const { user, signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [formError, setFormError] = useState(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(schema), defaultValues: { email: '', password: '' } });

  const destination = location.state?.from || '/admin';
  if (user) return <Navigate to={destination} replace />;

  const onSubmit = async (values) => {
    setFormError(null);
    try {
      await signIn(values);
      navigate(destination, { replace: true });
    } catch (error) {
      setFormError(error.message);
    }
  };

  return (
    <AuthCard title="Staff sign in" description="Sign in to manage appointments, patients and enquiries.">
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
        <Field label="Email" required error={errors.email?.message}>
          {(props) => <input {...props} {...register('email')} type="email" autoComplete="username" data-autofocus className="field-input" />}
        </Field>
        <Field label="Password" required error={errors.password?.message}>
          {(props) => <input {...props} {...register('password')} type="password" autoComplete="current-password" className="field-input" />}
        </Field>
        <FormMessage type="error">{formError}</FormMessage>
        <Button type="submit" size="lg" disabled={isSubmitting} className="w-full">
          {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" /> : <LogIn className="h-5 w-5" aria-hidden="true" />}
          {isSubmitting ? 'Signing in…' : 'Sign in'}
        </Button>
        <p className="text-center text-sm">
          <Link to="/admin/forgot-password" className="font-semibold text-brand-700 hover:underline">
            Forgot your password?
          </Link>
        </p>
      </form>
    </AuthCard>
  );
}
