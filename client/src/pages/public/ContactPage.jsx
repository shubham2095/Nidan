import { forwardRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  AlertCircle,
  ArrowUpRight,
  CalendarCheck,
  CheckCircle2,
  Loader2,
  Mail,
  MapPin,
  MessageCircle,
  MessageSquare,
  Phone,
  Send,
  ShieldCheck,
  Stethoscope,
  User,
} from 'lucide-react';
import Button from '../../components/public/Button.jsx';
import ClinicLocator from '../../components/public/ClinicLocator.jsx';
import Container from '../../components/public/Container.jsx';
import DoctorAvatar from '../../components/public/DoctorAvatar.jsx';
import { ConsentCheckbox, Field, FormMessage, Honeypot } from '../../components/public/FormField.jsx';
import PageHeader from '../../components/public/PageHeader.jsx';
import Reveal, { RevealGrid } from '../../components/public/Reveal.jsx';
import ScheduleTabs from '../../components/public/ScheduleTabs.jsx';
import Section, { SectionHeading } from '../../components/public/Section.jsx';
import Seo from '../../components/public/Seo.jsx';
import { useSite } from '../../context/SiteContext.jsx';
import useFetch from '../../hooks/useFetch.js';
import { getDoctors, submitContact } from '../../services/publicService.js';
import { cityList, telHref, whatsappHref } from '../../utils/format.js';
import { applyServerErrors, contactSchema } from '../../utils/forms.js';
import { clinicJsonLd } from '../../utils/jsonLd.js';

const STEPS = [
  { title: 'Send your details', text: 'Tell us your name, phone number and what you need help with.' },
  { title: 'We call you back', text: 'Our team gets in touch to answer your questions and suggest the right doctor.' },
  { title: 'Visit the clinic', text: 'Come in at a time that suits you, or book a slot online.' },
];

const CARD_TONES = {
  brand: 'from-brand-600 to-brand-400 shadow-brand-600/30',
  green: 'from-emerald-600 to-emerald-400 shadow-emerald-600/30',
  blush: 'from-blush-500 to-blush-300 shadow-blush-500/30',
};

/** A tappable contact card: the whole card follows the main link, extra links sit above it. */
function QuickCard({ icon: Icon, tone = 'brand', label, href, external = false, children, extra }) {
  return (
    <div className="group relative flex h-full items-center gap-4 rounded-3xl border border-slate-100 bg-white p-4 shadow-lg shadow-brand-900/5 transition duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-brand-900/10 sm:flex-col sm:items-start sm:gap-0 sm:p-6">
      <span
        className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br text-white shadow-md transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-6 ${CARD_TONES[tone]}`}
      >
        <Icon className="h-6 w-6" aria-hidden="true" />
      </span>
      <div className="min-w-0 sm:mt-5">
        <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">{label}</p>
        <a
          href={href}
          {...(external && { target: '_blank', rel: 'noopener noreferrer' })}
          className="mt-1 block text-[15px] font-bold break-words text-slate-900 transition-colors after:absolute after:inset-0 after:rounded-3xl group-hover:text-brand-700"
        >
          {children}
        </a>
        {extra}
      </div>
    </div>
  );
}

function QuickContacts({ clinic, places }) {
  return (
    <section className="relative z-10 -mt-6 sm:-mt-10">
      <Container>
        <RevealGrid className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4" columns={4}>
          <QuickCard icon={Phone} label="Call us" href={telHref(clinic.phonePrimary)}>
            {clinic.phonePrimary}
          </QuickCard>
          <QuickCard
            icon={MessageCircle}
            tone="green"
            label="WhatsApp"
            href={whatsappHref(clinic.whatsappNumber, `Hello ${clinic.name}, I would like some information.`)}
            external
            extra={<span className="mt-1 block text-sm text-slate-500">Opens WhatsApp</span>}
          >
            Chat with us
          </QuickCard>
          <QuickCard icon={Mail} label="Email us" href={`mailto:${clinic.email}`}>
            {/* lets a long address wrap after the @ instead of in the middle of the domain */}
            {clinic.email.includes('@') ? (
              <>
                {clinic.email.split('@')[0]}@<wbr />
                {clinic.email.split('@')[1]}
              </>
            ) : (
              clinic.email
            )}
          </QuickCard>
          {places.length === 1 && (
            <QuickCard
              icon={MapPin}
              tone="blush"
              label="Visit us"
              href={places[0].mapUrl || '#find-us'}
              external={Boolean(places[0].mapUrl)}
              extra={
                <span className="mt-1 inline-flex items-center gap-1 text-sm font-semibold text-brand-700">
                  Get directions <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                </span>
              }
            >
              {places[0].address}, {places[0].city}
            </QuickCard>
          )}
          {places.length > 1 && (
            <QuickCard
              icon={MapPin}
              tone="blush"
              label="Visit us"
              href="#find-us"
              extra={
                <span className="mt-1 inline-flex items-center gap-1 text-sm font-semibold text-brand-700">
                  See all clinics <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                </span>
              }
            >
              {places.length} clinics in {cityList(places)}
            </QuickCard>
          )}
        </RevealGrid>
        {clinic.phoneSecondary && (
          <p className="mt-4 text-center text-sm text-slate-600">
            Landline:{' '}
            <a href={telHref(clinic.phoneSecondary)} className="font-semibold text-brand-700 hover:underline">
              {clinic.phoneSecondary}
            </a>
          </p>
        )}
      </Container>
    </section>
  );
}

/** Input / select with a small icon on the left. Forwards the ref so react-hook-form can read it. */
const IconControl = forwardRef(function IconControl({ icon: Icon, as: Tag = 'input', className = '', children, ...props }, ref) {
  return (
    <div className="relative">
      <Icon className="pointer-events-none absolute top-1/2 left-3.5 h-[18px] w-[18px] -translate-y-1/2 text-slate-400" aria-hidden="true" />
      <Tag ref={ref} {...props} className={`field-input pl-11 ${className}`}>
        {children}
      </Tag>
    </div>
  );
});

function SuccessCard({ message, onAnother }) {
  return (
    <div role="status" className="pop-in flex flex-1 flex-col items-center justify-center py-8 text-center sm:py-12">
      <span className="grid h-20 w-20 place-items-center rounded-full bg-emerald-100 text-emerald-600 ring-8 ring-emerald-50">
        <CheckCircle2 className="h-10 w-10" aria-hidden="true" />
      </span>
      <h3 className="mt-6 text-2xl font-extrabold">Message sent</h3>
      <p className="mt-3 max-w-md text-slate-600">{message}</p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Button to="/book-appointment" variant="gradient">
          <CalendarCheck className="h-4 w-4" aria-hidden="true" />
          Book an appointment
        </Button>
        <Button variant="outline" onClick={onAnother}>
          Send another message
        </Button>
      </div>
    </div>
  );
}

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

  const sent = result?.type === 'success';

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-xl shadow-brand-900/5">
      <div aria-hidden="true" className="h-1.5 bg-gradient-to-r from-brand-600 via-brand-400 to-blush-300" />
      <div className="flex flex-1 flex-col p-6 sm:p-8">
        {sent ? (
          <SuccessCard message={result.message} onAnother={() => setResult(null)} />
        ) : (
          <>
            <div className="mb-7 flex items-center gap-4">
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-blush-100 text-blush-600">
                <MessageSquare className="h-6 w-6" aria-hidden="true" />
              </span>
              <div>
                <h2 className="text-2xl font-extrabold">Send us a message</h2>
                <p className="text-sm text-slate-600">Share a few details and our team will call you back.</p>
              </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} noValidate className="relative flex flex-1 flex-col gap-5">
              <Honeypot {...register('website')} />
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Your name" required error={errors.name?.message}>
                  {(props) => <IconControl icon={User} {...props} {...register('name')} autoComplete="name" placeholder="Your full name" />}
                </Field>
                <Field label="Phone number" required error={errors.phone?.message}>
                  {(props) => (
                    <IconControl icon={Phone} {...props} {...register('phone')} type="tel" inputMode="tel" autoComplete="tel" placeholder="Your mobile number" />
                  )}
                </Field>
              </div>
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Email (optional)" error={errors.email?.message}>
                  {(props) => <IconControl icon={Mail} {...props} {...register('email')} type="email" autoComplete="email" placeholder="you@example.com" />}
                </Field>
                <Field label="Preferred doctor (optional)" error={errors.preferredDoctorId?.message}>
                  {(props) => (
                    <IconControl icon={Stethoscope} as="select" {...props} {...register('preferredDoctorId')}>
                      <option value="">No preference</option>
                      {doctors.map((doctor) => (
                        <option key={doctor.id} value={doctor.id}>
                          {doctor.name}
                        </option>
                      ))}
                    </IconControl>
                  )}
                </Field>
              </div>
              {/* the message box takes up any spare height when the form sits beside the taller side panel */}
              <div className="flex flex-1 flex-col [&>div]:flex [&>div]:flex-1 [&>div]:flex-col">
                <Field label="How can we help?" required error={errors.message?.message}>
                  {(props) => (
                    <textarea
                      {...props}
                      {...register('message')}
                      rows={5}
                      placeholder="For example: a check-up, a vaccination, or a question about a treatment"
                      className="field-input min-h-32 flex-1"
                    />
                  )}
                </Field>
              </div>
              <ConsentCheckbox {...register('consent')} error={errors.consent?.message}>
                I agree that Nidan Mother &amp; Child Care may contact me about this enquiry and store my details for that purpose. See the{' '}
                <Link to="/privacy-policy" className="font-medium text-brand-700 underline">
                  Privacy Policy
                </Link>
                .
              </ConsentCheckbox>
              <FormMessage type={result?.type}>{result?.message}</FormMessage>
              <div className="mt-auto flex flex-col gap-4 pt-1 sm:flex-row sm:items-center sm:justify-between">
                <Button type="submit" variant="gradient" size="lg" disabled={isSubmitting} className="w-full sm:w-auto">
                  {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" /> : <Send className="h-5 w-5" aria-hidden="true" />}
                  {isSubmitting ? 'Sending…' : 'Send message'}
                </Button>
                <p className="flex items-center gap-2 text-xs text-slate-500">
                  <ShieldCheck className="h-4 w-4 shrink-0 text-brand-600" aria-hidden="true" />
                  Your details are used only to reply to this enquiry.
                </p>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

function NextSteps({ clinic }) {
  return (
    <aside className="relative h-full overflow-hidden rounded-3xl bg-brand-800 p-7 text-white sm:p-8">
      <div aria-hidden="true" className="anim-drift pointer-events-none absolute -top-16 -right-16 h-56 w-56 rounded-full bg-brand-600/50 blur-2xl" />
      <div aria-hidden="true" className="anim-drift-reverse pointer-events-none absolute -bottom-20 -left-12 h-56 w-56 rounded-full bg-blush-400/20 blur-2xl" />

      <div className="relative">
        <h2 className="text-2xl font-extrabold text-white">What happens next</h2>
        <p className="mt-2 text-brand-100">Getting in touch is simple, and you never have to repeat yourself.</p>

        <ol className="mt-8 space-y-7">
          {STEPS.map((step, index) => (
            <li
              key={step.title}
              className={`relative flex gap-4 ${index < STEPS.length - 1 ? 'before:absolute before:top-11 before:left-5 before:h-[calc(100%-0.5rem)] before:w-px before:bg-white/20' : ''}`}
            >
              <span className="relative grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white/10 font-heading font-extrabold text-blush-200 ring-1 ring-white/25">
                {index + 1}
              </span>
              <div>
                <h3 className="font-bold text-white">{step.title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-brand-100">{step.text}</p>
              </div>
            </li>
          ))}
        </ol>

        <div className="mt-9 grid gap-3">
          <Button to="/book-appointment" variant="light" size="lg" className="w-full">
            <CalendarCheck className="h-5 w-5" aria-hidden="true" />
            Book an appointment online
          </Button>
          <Button
            href={whatsappHref(clinic.whatsappNumber, `Hello ${clinic.name}, I would like some information.`)}
            target="_blank"
            rel="noopener noreferrer"
            variant="whatsapp"
            size="lg"
            className="w-full"
          >
            <MessageCircle className="h-5 w-5" aria-hidden="true" />
            Chat on WhatsApp
          </Button>
        </div>

        <p className="mt-7 flex gap-3 rounded-2xl bg-white/5 p-4 text-sm leading-relaxed text-brand-100 ring-1 ring-white/10">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-blush-200" aria-hidden="true" />
          <span>In an emergency, please call us straight away or go to the nearest hospital. Do not wait for a reply to this form.</span>
        </p>
      </div>
    </aside>
  );
}

function DoctorTimings({ doctor }) {
  return (
    <div className="h-full rounded-3xl border border-slate-100 bg-white p-6 shadow-sm transition duration-300 hover:-translate-y-0.5 hover:shadow-lg">
      <div className="mb-5 flex items-center gap-4">
        <DoctorAvatar doctor={doctor} size="md" />
        <div>
          <h3 className="text-xl font-bold">{doctor.name}</h3>
          {doctor.designation && <p className="text-sm font-semibold text-brand-700">{doctor.designation}</p>}
        </div>
      </div>
      <ScheduleTabs schedules={doctor.schedules} />
    </div>
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
        description={`Call, WhatsApp or write to ${clinic.name}. Find our clinics in Noida and Greater Noida, with maps, opening hours and doctor timings.`}
        jsonLd={clinicJsonLd(site, window.location.origin)}
      />
      <PageHeader
        title="Contact Us"
        crumbs={[{ label: 'Contact Us' }]}
        description="We would love to hear from you. Send a message and we will call you back, or reach us directly."
        className="pb-16 sm:pb-24"
      />

      <QuickContacts clinic={clinic} places={ownClinics} />

      <Section>
        <div className="grid items-stretch gap-8 lg:grid-cols-5">
          <Reveal variant="left" className="lg:col-span-3">
            <ContactForm doctors={doctors} />
          </Reveal>
          <Reveal variant="right" delay={120} className="lg:col-span-2">
            <NextSteps clinic={clinic} />
          </Reveal>
        </div>
      </Section>

      {ownClinics.length > 0 && (
        <Section tone="soft" id="find-us" className="scroll-mt-20">
          <SectionHeading
            eyebrow="Find us"
            title={ownClinics.length === 1 ? 'Visit our clinic' : 'Visit our clinics'}
            description={
              ownClinics.length > 1
                ? `We have ${ownClinics.length} clinics in ${cityList(ownClinics)}. Choose one to see its address, directions and map.`
                : 'We are easy to reach. Use the map for directions.'
            }
          />
          <ClinicLocator />
        </Section>
      )}

      {doctors.length > 0 && (
        <Section>
          <SectionHeading eyebrow="Timings" title="When our doctors are available" />
          <RevealGrid className="grid gap-8 lg:grid-cols-2" columns={2} step={140}>
            {doctors.map((doctor) => (
              <DoctorTimings key={doctor.id} doctor={doctor} />
            ))}
          </RevealGrid>
        </Section>
      )}
    </>
  );
}
