import { useState } from 'react';
import { CalendarCheck, ClipboardCheck, Phone, Search, UserCheck, X } from 'lucide-react';
import Button from '../../components/public/Button.jsx';
import ContactStrip from '../../components/public/ContactStrip.jsx';
import PageHeader from '../../components/public/PageHeader.jsx';
import Section, { SectionHeading } from '../../components/public/Section.jsx';
import Seo from '../../components/public/Seo.jsx';
import ServiceCard from '../../components/public/ServiceCard.jsx';
import { RevealGrid } from '../../components/public/Reveal.jsx';
import { ErrorState, LoadingState } from '../../components/public/States.jsx';
import { useSite } from '../../context/SiteContext.jsx';
import useFetch from '../../hooks/useFetch.js';
import { getServices } from '../../services/publicService.js';
import { telHref } from '../../utils/format.js';

const STEPS = [
  { Icon: UserCheck, title: 'Pick a doctor', text: 'Choose the doctor you would like to see.' },
  { Icon: CalendarCheck, title: 'Choose a clinic and time', text: 'Select the clinic, the day and a time that suits you.' },
  { Icon: ClipboardCheck, title: 'We confirm your visit', text: 'Our team confirms your appointment with you.' },
];

export default function ServicesPage() {
  const { clinic } = useSite();
  const { data, loading, error, reload } = useFetch((signal) => getServices(signal), [], { preload: '/public/services' });
  const [query, setQuery] = useState('');

  const items = data?.items || [];
  const term = query.trim().toLowerCase();
  const shown = term ? items.filter((service) => `${service.name} ${service.shortDescription}`.toLowerCase().includes(term)) : items;

  return (
    <>
      <Seo
        title="Our Services"
        description="Maternity, gynaecology, fertility, neonatology, paediatrics, fetal medicine, surgery, lactation support and more, all at NIDAN Mother & Child Clinic in Noida."
      />
      <PageHeader
        title="Our Services"
        crumbs={[{ label: 'Services' }]}
        description="Complete healthcare for mothers and children, under one roof."
      >
        <div className="mt-7 flex flex-wrap items-center gap-3">
          <Button to="/book-appointment" variant="gradient" size="lg">
            <CalendarCheck className="h-5 w-5" aria-hidden="true" />
            Book Appointment
          </Button>
          <Button href={telHref(clinic.phonePrimary)} variant="outline" size="lg">
            <Phone className="h-5 w-5" aria-hidden="true" />
            {clinic.phonePrimary}
          </Button>
        </div>
      </PageHeader>

      <Section>
        {loading && <LoadingState />}
        {error && <ErrorState message={error} onRetry={reload} />}
        {data && (
          <>
            <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <p role="status" className="text-sm font-semibold text-slate-500">
                {term ? `${shown.length} of ${items.length} services` : `${items.length} services`}
              </p>
              <div className="relative w-full sm:max-w-sm">
                <label htmlFor="service-search" className="sr-only">
                  Search services
                </label>
                <Search className="pointer-events-none absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
                <input
                  id="service-search"
                  type="text"
                  inputMode="search"
                  enterKeyHint="search"
                  autoComplete="off"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search services, e.g. newborn"
                  className="w-full rounded-full border border-slate-200 bg-white py-3 pr-11 pl-11 text-base shadow-sm transition outline-none placeholder:text-slate-400 focus:border-brand-500 focus:ring-4 focus:ring-brand-100 sm:text-sm"
                />
                {query && (
                  <button
                    type="button"
                    onClick={() => setQuery('')}
                    aria-label="Clear search"
                    className="absolute top-1/2 right-2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                  >
                    <X className="h-4 w-4" aria-hidden="true" />
                  </button>
                )}
              </div>
            </div>

            {shown.length > 0 ? (
              <RevealGrid className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6" columns={3}>
                {shown.map((service) => (
                  <ServiceCard key={service.id} service={service} number={items.indexOf(service) + 1} />
                ))}
              </RevealGrid>
            ) : (
              <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 px-6 py-14 text-center">
                <p className="text-lg font-bold">No service matches your search</p>
                <p className="mx-auto mt-1 max-w-md text-slate-600">Try another word, or call us and we will point you to the right doctor.</p>
                <div className="mt-6 flex flex-wrap justify-center gap-3">
                  <Button variant="outline" onClick={() => setQuery('')}>
                    Show all services
                  </Button>
                  <Button href={telHref(clinic.phonePrimary)}>
                    <Phone className="h-4 w-4" aria-hidden="true" />
                    Call {clinic.phonePrimary}
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </Section>

      <Section tone="soft">
        <SectionHeading eyebrow="How it works" title="Booking is simple" description="Three quick steps, online or over the phone." />
        <RevealGrid className="grid gap-5 md:grid-cols-3 md:gap-6" columns={3}>
          {STEPS.map(({ Icon, title, text }, index) => (
            <article key={title} className="relative h-full rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-brand-700 to-brand-500 text-white shadow-md shadow-brand-700/25">
                <Icon className="h-6 w-6" aria-hidden="true" />
              </span>
              <span aria-hidden="true" className="absolute top-5 right-6 font-heading text-5xl font-extrabold text-blush-100">
                {index + 1}
              </span>
              <h3 className="mt-5 text-lg font-extrabold">{title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{text}</p>
            </article>
          ))}
        </RevealGrid>
      </Section>
      <ContactStrip />
    </>
  );
}
