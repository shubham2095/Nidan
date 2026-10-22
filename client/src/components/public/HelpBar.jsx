import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, MessageCircle, PhoneCall, PhoneIncoming } from 'lucide-react';
import { useSite } from '../../context/SiteContext.jsx';
import { submitContact } from '../../services/publicService.js';
import { telHref, whatsappHref } from '../../utils/format.js';
import { applyServerErrors, callbackSchema } from '../../utils/forms.js';
import Button from './Button.jsx';
import { ConsentCheckbox, Field, FormMessage } from './FormField.jsx';

function CallbackForm({ interest }) {
  const [result, setResult] = useState(null);
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(callbackSchema), defaultValues: { name: '', phone: '', consent: false } });

  const onSubmit = async (values) => {
    setResult(null);
    try {
      const response = await submitContact({
        ...values,
        source: 'booking_dropoff',
        message: `Call-back requested from the booking page.${interest ? ` Interested in: ${interest}.` : ''}`,
      });
      setResult({ type: 'success', message: response.message });
      reset();
    } catch (error) {
      if (!applyServerErrors(error, setError)) setResult({ type: 'error', message: error.message });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-4 space-y-4 rounded-2xl bg-white p-4 ring-1 ring-slate-200">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Your name" required error={errors.name?.message}>
          {(props) => <input {...props} {...register('name')} autoComplete="name" className="field-input" />}
        </Field>
        <Field label="Phone number" required error={errors.phone?.message}>
          {(props) => <input {...props} {...register('phone')} type="tel" inputMode="tel" autoComplete="tel" className="field-input" />}
        </Field>
      </div>
      <ConsentCheckbox {...register('consent')} error={errors.consent?.message}>
        I agree that the clinic may call me back on this number.
      </ConsentCheckbox>
      <FormMessage type={result?.type}>{result?.message}</FormMessage>
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
        Request a call back
      </Button>
    </form>
  );
}

/** Shown on every booking step: phone, WhatsApp, or leave a number and the clinic calls back. */
export default function HelpBar({ interest }) {
  const { clinic } = useSite();
  const [callbackOpen, setCallbackOpen] = useState(false);

  return (
    <aside aria-label="Need help booking?" className="mt-8 rounded-3xl bg-blush-50 p-5 sm:p-6">
      <p className="font-heading text-lg font-extrabold">Need a hand? We are happy to book it for you.</p>
      <div className="mt-4 flex flex-wrap gap-3">
        <Button href={telHref(clinic.phonePrimary)} variant="outline">
          <PhoneCall className="h-4 w-4" aria-hidden="true" />
          {clinic.phonePrimary}
        </Button>
        <Button
          href={whatsappHref(clinic.whatsappNumber, `Hello ${clinic.name}, I would like to book an appointment.`)}
          target="_blank"
          rel="noopener noreferrer"
          variant="whatsapp"
        >
          <MessageCircle className="h-4 w-4" aria-hidden="true" />
          WhatsApp
        </Button>
        <Button variant="secondary" onClick={() => setCallbackOpen((open) => !open)} aria-expanded={callbackOpen}>
          <PhoneIncoming className="h-4 w-4" aria-hidden="true" />
          Request a call back
        </Button>
      </div>
      {callbackOpen && <CallbackForm interest={interest} />}
    </aside>
  );
}
