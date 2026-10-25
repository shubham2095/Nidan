import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Baby, CalendarCheck, Loader2, UserRound } from 'lucide-react';
import { createBooking } from '../../services/publicService.js';
import { applyServerErrors, bookingPatientSchema, mapBookingField } from '../../utils/forms.js';
import Button from './Button.jsx';
import { ConsentCheckbox, Field, FormMessage, Honeypot } from './FormField.jsx';

const TYPE_OPTIONS = [
  { value: 'mother', label: 'Mother / Woman', hint: 'Pregnancy, gynaecology, fertility', Icon: UserRound },
  { value: 'child', label: 'Child', hint: 'Newborn, vaccination, paediatric', Icon: Baby },
];

const radioCard =
  'flex h-full cursor-pointer items-center gap-3 rounded-2xl border border-slate-200 p-4 transition-colors peer-checked:border-brand-600 peer-checked:bg-brand-50 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-brand-600 hover:border-brand-300';

export default function PatientDetailsForm({ selection, onBooked, onSlotLost }) {
  const [formError, setFormError] = useState(null);
  const {
    register,
    handleSubmit,
    setError,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(bookingPatientSchema),
    defaultValues: {
      patientType: 'mother', name: '', guardianName: '', ageMode: 'dob', dob: '', ageYears: '', ageMonths: '',
      phone: '', email: '', reason: '', consent: false, website: '',
    },
  });

  const isChild = watch('patientType') === 'child';
  const ageMode = watch('ageMode');

  const onSubmit = async (values) => {
    setFormError(null);
    const child = values.patientType === 'child';
    try {
      const booking = await createBooking({
        doctorId: selection.doctor.id,
        locationId: selection.location.id,
        date: selection.date,
        startTime: selection.slot.startTime,
        patient: {
          type: values.patientType,
          name: values.name,
          phone: values.phone,
          email: values.email,
          ...(child && {
            guardianName: values.guardianName,
            ...(values.ageMode === 'dob' ? { dob: values.dob } : { ageYears: values.ageYears, ageMonths: values.ageMonths }),
          }),
        },
        reason: values.reason,
        consent: values.consent,
        website: values.website,
      });
      onBooked(booking);
    } catch (error) {
      if (error.response?.data?.details?.code === 'slot_unavailable') {
        onSlotLost(error.message);
        return;
      }
      const mapped = applyServerErrors(error, (field, options) => setError(mapBookingField(field), options));
      if (!mapped) setFormError(error.message);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="relative space-y-6">
      <Honeypot {...register('website')} />

      <fieldset>
        <legend className="mb-2 text-sm font-semibold text-slate-800">Who is the appointment for?</legend>
        <div className="grid gap-3 sm:grid-cols-2">
          {TYPE_OPTIONS.map(({ value, label, hint, Icon }) => (
            <label key={value} className="block">
              <input type="radio" value={value} {...register('patientType')} className="peer sr-only" />
              <span className={radioCard}>
                <Icon className="h-6 w-6 shrink-0 text-brand-700" aria-hidden="true" />
                <span>
                  <span className="block font-semibold text-slate-900">{label}</span>
                  <span className="block text-xs text-slate-500">{hint}</span>
                </span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label={isChild ? "Child's full name" : 'Patient full name'} required error={errors.name?.message}>
          {(props) => <input {...props} {...register('name')} autoComplete="name" className="field-input" />}
        </Field>
        {isChild && (
          <Field label="Parent / guardian name" required error={errors.guardianName?.message}>
            {(props) => <input {...props} {...register('guardianName')} autoComplete="name" className="field-input" />}
          </Field>
        )}
      </div>

      {isChild && (
        <fieldset className="space-y-4">
          <legend className="text-sm font-semibold text-slate-800">Child&apos;s age</legend>
          <div className="flex gap-6 text-sm">
            <label className="flex items-center gap-2">
              <input type="radio" value="dob" {...register('ageMode')} className="h-4 w-4 text-brand-700" />
              I know the date of birth
            </label>
            <label className="flex items-center gap-2">
              <input type="radio" value="age" {...register('ageMode')} className="h-4 w-4 text-brand-700" />
              Enter age instead
            </label>
          </div>
          {ageMode === 'dob' ? (
            <div className="max-w-xs">
              <Field label="Date of birth" required error={errors.dob?.message}>
                {(props) => <input {...props} {...register('dob')} type="date" max={new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' })} className="field-input" />}
              </Field>
            </div>
          ) : (
            <div className="grid max-w-xs grid-cols-2 gap-4">
              <Field label="Years" required error={errors.ageYears?.message}>
                {(props) => <input {...props} {...register('ageYears')} type="number" inputMode="numeric" min="0" max="18" className="field-input" />}
              </Field>
              <Field label="Months" error={errors.ageMonths?.message}>
                {(props) => <input {...props} {...register('ageMonths')} type="number" inputMode="numeric" min="0" max="11" className="field-input" />}
              </Field>
            </div>
          )}
        </fieldset>
      )}

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Mobile number" required hint="We will use this to confirm your appointment." error={errors.phone?.message}>
          {(props) => <input {...props} {...register('phone')} type="tel" inputMode="tel" autoComplete="tel" className="field-input" />}
        </Field>
        <Field label="Email (optional)" hint="For a copy of your booking details." error={errors.email?.message}>
          {(props) => <input {...props} {...register('email')} type="email" autoComplete="email" className="field-input" />}
        </Field>
      </div>

      <Field label="Reason for visit (optional)" error={errors.reason?.message}>
        {(props) => <textarea {...props} {...register('reason')} rows={3} className="field-input" />}
      </Field>

      <ConsentCheckbox {...register('consent')} error={errors.consent?.message}>
        I agree that NIDAN Mother &amp; Child Clinic may store these details to manage my appointment and contact me about it. See the{' '}
        <Link to="/privacy-policy" target="_blank" className="font-medium text-brand-700 underline">
          Privacy Policy
        </Link>
        .
      </ConsentCheckbox>

      <FormMessage type="error">{formError}</FormMessage>

      <Button type="submit" size="lg" disabled={isSubmitting} className="w-full sm:w-auto">
        {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" /> : <CalendarCheck className="h-5 w-5" aria-hidden="true" />}
        {isSubmitting ? 'Booking…' : 'Confirm booking'}
      </Button>
    </form>
  );
}
