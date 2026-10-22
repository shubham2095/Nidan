import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Mail, MapPin, MessageCircle, Phone, Send } from 'lucide-react';
import Button from '../../components/public/Button.jsx';
import { ConsentCheckbox, Field, FormMessage, Honeypot } from '../../components/public/FormField.jsx';
import MapEmbed from '../../components/public/MapEmbed.jsx';
import OpeningHours from '../../components/public/OpeningHours.jsx';
import Reveal, { RevealGrid } from '../../components/public/Reveal.jsx';
import PageHeader from '../../components/public/PageHeader.jsx';
import ScheduleTabs from '../../components/public/ScheduleTabs.jsx';
import Section, { SectionHeading } from '../../components/public/Section.jsx';
import Seo from '../../components/public/Seo.jsx';
import { useSite } from '../../context/SiteContext.jsx';
import useFetch from '../../hooks/useFetch.js';
import { getDoctors, submitContact } from '../../services/publicService.js';
import { telHref, whatsappHref } from '../../utils/format.js';
import { applyServerErrors, contactSchema } from '../../utils/forms.js';
import { clinicJsonLd } from '../../utils/jsonLd.js';

function ContactForm({ doctors }) {
  const [result, setResult] = useState(null);
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(contactSchema),
    defaultValues: { name: '', phone: '', email: '', preferredDoctorId: '', message: '', consent: false, website: '' },
  });

  const onSubmit = async (values) => {
    setResult(null);
    try {
      const response = await submitContact({ ...values, preferredDoctorId: values.preferredDoctorId || undefined });
      setResult({ type: 'success', message: response.message });
      reset();
    } catch (error) {
      if (!applyServerErrors(error, setError)) setResult({ type: 'error', message: error.message });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="relative space-y-5 rounded-3xl border border-slate-100 bg-white p-6 shadow-sm sm:p-8">
      <Honeypot {...register('website')} />
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Your name" required error={errors.name?.message}>
          {(props) => <input {...props} {...register('name')} autoComplete="name" className="field-input" />}
        </Field>
        <Field label="Phone number" required error={errors.phone?.message}>
          {(props) => <input {...props} {...register('phone')} type="tel" inputMode="tel" autoComplete="tel" className="field-input" />}
        </Field>
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Email (optional)" error={errors.email?.message}>
          {(props) => <input {...props} {...register('email')} type="email" autoComplete="email" className="field-input" />}
        </Field>
        <Field label="Preferred doctor (optional)" error={errors.preferredDoctorId?.message}>
          {(props) => (
            <select {...props} {...register('preferredDoctorId')} className="field-input">
              <option value="">No preference</option>
              {doctors.map((doctor) => (
                <option key={doctor.id} value={doctor.id}>
                  {doctor.name}
                </option>
              ))}
            </select>
          )}
        </Field>
      </div>
      <Field label="How can we help?" required error={errors.message?.message}>
        {(props) => <textarea {...props} {...register('message')} rows={5} className="field-input" />}
      </Field>
      <ConsentCheckbox {...register('consent')} error={errors.consent?.message}>
        I agree that Nidan Mother &amp; Child Care may contact me about this enquiry and store my details for that purpose. See the{' '}
        <Link to="/privacy-policy" className="font-medium text-brand-700 underline">
          Privacy Policy
        </Link>
        .
      </ConsentCheckbox>
      <FormMessage type={result?.type}>{result?.message}</FormMessage>
      <Button type="submit" size="lg" disabled={isSubmitting}>
        {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" /> : <Send className="h-5 w-5" aria-hidden="true" />}
        {isSubmitting ? 'Sending…' : 'Send message'}
      </Button>
    </form>
  );
}

export default function ContactPage() {
  const site = useSite();
  const { clinic, ownClinics } = site;
  const { data } = useFetch((signal) => getDoctors(signal), []);
  const doctors = data?.items || [];

  return (
    <>
      <Seo
        title="Contact Us"
        description={`Call, WhatsApp or write to ${clinic.name}. Find our clinic in Sector 51, Noida, with the map, opening hours and doctor timings.`}
        jsonLd={clinicJsonLd(site, window.location.origin)}
      />
      <PageHeader title="Contact Us" crumbs={[{ label: 'Contact Us' }]} description="We would love to hear from you. Send a message and we will call you back, or reach us directly." />

      <Section>
        <div className="grid gap-10 lg:grid-cols-5">
          <Reveal variant="left" className="lg:col-span-3">
            <h2 className="mb-5 text-2xl font-extrabold">Send us a message</h2>
            <ContactForm doctors={doctors} />
          </Reveal>

          <Reveal as="aside" variant="right" delay={120} className="space-y-5 lg:col-span-2">
            <h2 className="text-2xl font-extrabold">Reach us directly</h2>
            <ul className="space-y-4">
              <li className="flex items-start gap-4 rounded-3xl bg-brand-50 p-5">
                <Phone className="mt-1 h-5 w-5 shrink-0 text-brand-700" aria-hidden="true" />
                <span>
                  <span className="block text-sm font-semibold text-slate-500">Call</span>
                  <a href={telHref(clinic.phonePrimary)} className="font-semibold text-slate-900 hover:underline">
                    {clinic.phonePrimary}
                  </a>
                  {clinic.phoneSecondary && (
                    <>
                      <br />
                      <a href={telHref(clinic.phoneSecondary)} className="font-semibold text-slate-900 hover:underline">
                        {clinic.phoneSecondary}
                      </a>
                    </>
                  )}
                </span>
              </li>
              <li className="flex items-start gap-4 rounded-3xl bg-brand-50 p-5">
                <MessageCircle className="mt-1 h-5 w-5 shrink-0 text-brand-700" aria-hidden="true" />
                <span>
                  <span className="block text-sm font-semibold text-slate-500">WhatsApp</span>
                  <a
                    href={whatsappHref(clinic.whatsappNumber, `Hello ${clinic.name}, I would like some information.`)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold text-slate-900 hover:underline"
                  >
                    Chat with us
                  </a>
                </span>
              </li>
              <li className="flex items-start gap-4 rounded-3xl bg-brand-50 p-5">
                <Mail className="mt-1 h-5 w-5 shrink-0 text-brand-700" aria-hidden="true" />
                <span>
                  <span className="block text-sm font-semibold text-slate-500">Email</span>
                  <a href={`mailto:${clinic.email}`} className="font-semibold break-all text-slate-900 hover:underline">
                    {clinic.email}
                  </a>
                </span>
              </li>
            </ul>
            <Button to="/book-appointment" size="lg" className="w-full">
              Book an appointment online
            </Button>
          </Reveal>
        </div>
      </Section>

      {ownClinics.length > 0 && (
        <Section tone="soft">
          <SectionHeading eyebrow="Find us" title={ownClinics.length === 1 ? 'Our clinic' : 'Our clinics'} />
          <div className="grid gap-8 lg:grid-cols-2">
            <Reveal variant="left" className="space-y-6">
              {ownClinics.map((location) => (
                <div key={location.id} className="space-y-3 rounded-3xl bg-white p-6 shadow-sm">
                  <h3 className="text-xl font-bold">{location.name}</h3>
                  <p className="flex items-start gap-2 text-slate-600">
                    <MapPin className="mt-1 h-4 w-4 shrink-0 text-blush-500" aria-hidden="true" />
                    {location.address}, {location.city}, {location.state}
                    {location.postalCode && ` ${location.postalCode}`}
                  </p>
                </div>
              ))}
              <div className="rounded-3xl bg-white p-6 shadow-sm sm:p-8">
                <OpeningHours />
              </div>
            </Reveal>
            <Reveal variant="right" delay={120} className="space-y-6">
              {ownClinics.map((location) => (
                <MapEmbed key={location.id} location={location} instant className="h-96" />
              ))}
            </Reveal>
          </div>
        </Section>
      )}

      {doctors.length > 0 && (
        <Section>
          <SectionHeading eyebrow="Timings" title="When our doctors are available" />
          <RevealGrid className="grid gap-8 lg:grid-cols-2" columns={2} step={140}>
            {doctors.map((doctor) => (
              <div key={doctor.id} className="rounded-3xl border border-slate-100 p-6">
                <h3 className="mb-4 text-xl font-bold">{doctor.name}</h3>
                <ScheduleTabs schedules={doctor.schedules} />
              </div>
            ))}
          </RevealGrid>
        </Section>
      )}
    </>
  );
}
