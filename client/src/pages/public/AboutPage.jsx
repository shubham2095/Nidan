import { Link } from 'react-router-dom';
import { ArrowRight, Award, Baby, CalendarCheck, Heart, HeartPulse, MapPin, Navigation, Phone, Quote, Smile, Users } from 'lucide-react';
import Button from '../../components/public/Button.jsx';
import Container from '../../components/public/Container.jsx';
import ContactStrip from '../../components/public/ContactStrip.jsx';
import DoctorAvatar from '../../components/public/DoctorAvatar.jsx';
import Icon from '../../components/public/Icon.jsx';
import Reveal, { RevealGrid } from '../../components/public/Reveal.jsx';
import PageHeader from '../../components/public/PageHeader.jsx';
import Section, { SectionHeading } from '../../components/public/Section.jsx';
import Seo from '../../components/public/Seo.jsx';
import { useSite } from '../../context/SiteContext.jsx';
import useFetch from '../../hooks/useFetch.js';
import { getDoctors } from '../../services/publicService.js';
import { cityList, telHref } from '../../utils/format.js';

// The stages of a family's care, each pointing at the service page that covers it (the list page if that service is gone).
const JOURNEY = [
  { Icon: Heart, title: 'Pregnancy', slug: 'maternity', text: 'Regular antenatal check-ups, fetal medicine and antenatal classes to prepare you for the day.' },
  { Icon: Baby, title: 'Birth', slug: 'maternity', text: 'A safe delivery, with a focus on vaginal deliveries wherever it is medically appropriate.' },
  { Icon: HeartPulse, title: 'Newborn', slug: 'neonatology', text: 'Specialised care for newborns, including babies who need extra attention in their first days.' },
  { Icon: Smile, title: 'Childhood', slug: 'paediatrics', text: 'Routine check-ups, vaccinations and care for common childhood illnesses.' },
];

/** One doctor: photo, qualifications, what they focus on and a quote, with links to book or read more. */
function DoctorProfile({ doctor }) {
  const firstName = doctor.name.replace(/^dr\.?\s+/i, '').split(' ')[0];

  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-brand-900/10">
      <div className="flex items-center gap-5 bg-gradient-to-br from-brand-50 via-white to-blush-50 p-6 sm:p-8">
        {/* achievements sit on the photo, so both doctors' headings line up whether or not they have one */}
        <div className="relative shrink-0">
          <DoctorAvatar doctor={doctor} size="lg" className="shadow-md transition duration-300 group-hover:scale-105" />
          {doctor.highlights.length > 0 && (
            <span className="absolute -bottom-2 left-1/2 inline-flex -translate-x-1/2 items-center gap-1 rounded-full bg-blush-100 px-2.5 py-1 text-xs font-semibold whitespace-nowrap text-blush-700 ring-2 ring-white">
              <Award className="h-3.5 w-3.5" aria-hidden="true" />
              {doctor.highlights[0]}
            </span>
          )}
        </div>
        <div className="min-w-0">
          <h3 className="font-heading text-2xl font-extrabold text-slate-900">
            <Link to={`/doctors/${doctor.slug}`} className="hover:text-brand-700">
              {doctor.name}
            </Link>
          </h3>
          <p className="mt-1 font-semibold text-brand-700">{doctor.designation}</p>
          <p className="mt-0.5 text-sm text-slate-600">{doctor.qualifications}</p>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-6 pt-5 sm:p-8 sm:pt-6">
        {doctor.quote && (
          <blockquote className="relative rounded-2xl bg-blush-50 py-4 pr-4 pl-12 text-sm leading-relaxed text-slate-700 italic">
            <Quote className="absolute top-4 left-4 h-5 w-5 text-blush-400" aria-hidden="true" />
            {doctor.quote}
          </blockquote>
        )}

        {doctor.specialities.length > 0 && (
          <div className="mt-5">
            <p className="mb-2 text-xs font-bold tracking-wider text-slate-500 uppercase">Focus areas</p>
            <ul className="flex flex-wrap gap-2">
              {doctor.specialities.map((item) => (
                <li key={item} className="rounded-full bg-brand-50 px-3 py-1.5 text-sm font-medium text-brand-800">
                  {item}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-auto flex flex-wrap gap-3 pt-6">
          <Button to={`/book-appointment?doctor=${doctor.slug}`}>
            <CalendarCheck className="h-4 w-4" aria-hidden="true" />
            Book with Dr. {firstName}
          </Button>
          <Button to={`/doctors/${doctor.slug}`} variant="outline">
            View profile
          </Button>
        </div>
      </div>
    </article>
  );
}

export default function AboutPage() {
  const { clinic, settings, ownClinics, serviceLinks } = useSite();
  const { data } = useFetch((signal) => getDoctors(signal), [], { preload: '/public/doctors' });
  const about = settings.about || {};
  const whyChooseUs = settings.whyChooseUs || [];
  const doctors = data?.items || [];

  const stats = [
    { value: doctors.length, label: doctors.length === 1 ? 'Doctor' : 'Doctors' },
    { value: ownClinics.length, label: ownClinics.length === 1 ? 'Clinic' : 'Clinics' },
    { value: serviceLinks.length, label: serviceLinks.length === 1 ? 'Service' : 'Services' },
  ].filter((item) => item.value > 0);

  const serviceHref = (slug) => (serviceLinks.some((service) => service.slug === slug) ? `/services/${slug}` : '/services');

  return (
    <>
      <Seo
        title="About Us"
        description={`Learn about ${clinic.name}: ${clinic.tagline}. Meet our doctors and find our clinic in Noida.`}
      />
      <PageHeader title={about.heading || `About ${clinic.name}`} crumbs={[{ label: 'About Us' }]} description={clinic.tagline}>
        <div className="mt-7 flex flex-wrap items-center gap-3">
          <Button to="/book-appointment" variant="gradient" size="lg">
            <CalendarCheck className="h-5 w-5" aria-hidden="true" />
            Book Appointment
          </Button>
          {doctors.length > 0 && (
            <Button href="#doctors" variant="outline" size="lg">
              <Users className="h-5 w-5" aria-hidden="true" />
              Meet our doctors
            </Button>
          )}
        </div>
      </PageHeader>

      <Section>
        {/* with a picture the text and the picture sit side by side (picture below the text on phones); without one, the text is centred */}
        <div className={about.imageUrl ? 'grid items-center gap-14 lg:grid-cols-2 lg:gap-16' : 'mx-auto max-w-3xl'}>
          <Reveal variant="left">
            <p className="mb-3 inline-block rounded-full bg-blush-100 px-3 py-1 text-xs font-semibold tracking-wide text-blush-700 uppercase">Who we are</p>
            <h2 className="mb-6 text-3xl font-extrabold tracking-tight sm:text-4xl">From pregnancy to childhood, in one place</h2>
            <div
              className="rich-text text-lg [&>p:first-child]:text-xl [&>p:first-child]:leading-relaxed [&>p:first-child]:font-medium [&>p:first-child]:text-slate-800"
              dangerouslySetInnerHTML={{ __html: about.body || '' }}
            />
          </Reveal>
          {about.imageUrl && (
            <Reveal variant="right" delay={120}>
              <div className="relative mx-auto mb-6 w-full max-w-lg lg:mb-0 lg:max-w-none">
                <div aria-hidden="true" className="absolute -inset-3 rounded-[2.5rem] bg-gradient-to-br from-blush-200 via-blush-100 to-brand-100" />
                <img
                  src={about.imageUrl}
                  alt={about.imageAlt || ''}
                  width="1000"
                  height="800"
                  decoding="async"
                  className="relative aspect-[5/4] w-full rounded-[2rem] object-cover object-[50%_62%] shadow-xl"
                />
                {ownClinics.length > 0 && (
                  <div className="absolute -bottom-6 left-4 flex items-center gap-3 rounded-2xl bg-white px-4 py-3 shadow-xl ring-1 ring-slate-100 sm:left-8">
                    <span className="grid h-10 w-10 place-items-center rounded-xl bg-blush-100 text-blush-600">
                      <MapPin className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <span>
                      <span className="block text-sm font-extrabold text-slate-900">
                        {ownClinics.length} {ownClinics.length === 1 ? 'clinic' : 'clinics'}
                      </span>
                      <span className="block text-xs text-slate-500">{cityList(ownClinics)}</span>
                    </span>
                  </div>
                )}
              </div>
            </Reveal>
          )}
        </div>
      </Section>

      {stats.length > 0 && (
        <section className="pb-6 sm:pb-10">
          <Container>
            <Reveal variant="zoom">
              <div className="relative overflow-hidden rounded-[2rem] bg-brand-800 px-4 py-10 text-white sm:px-12 sm:py-12">
                <div aria-hidden="true" className="absolute -top-20 -right-20 h-72 w-72 rounded-full bg-brand-600/50 blur-2xl" />
                <div aria-hidden="true" className="absolute -bottom-24 -left-10 h-64 w-64 rounded-full bg-blush-400/20 blur-2xl" />
                <dl className="relative grid gap-4 text-center" style={{ gridTemplateColumns: `repeat(${stats.length}, minmax(0, 1fr))` }}>
                  {stats.map(({ value, label }, index) => (
                    <div key={label} className={`flex flex-col-reverse gap-1 ${index > 0 ? 'border-l border-white/15' : ''}`}>
                      <dt className="text-xs font-semibold tracking-wider text-brand-100 uppercase sm:text-sm">{label}</dt>
                      <dd className="font-heading text-4xl font-extrabold text-blush-200 sm:text-6xl">{value}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            </Reveal>
          </Container>
        </section>
      )}

      <Section tone="mint">
        <SectionHeading
          eyebrow="Our care"
          title="Care that grows with your family"
          description="One clinic for pregnancy, birth, newborn and child care."
        />
        <RevealGrid className="relative grid gap-6 sm:grid-cols-2 lg:grid-cols-4" columns={4}>
          {JOURNEY.map(({ Icon: StageIcon, title, text, slug }, index) => (
            <Link
              key={title}
              to={serviceHref(slug)}
              className="group relative flex h-full flex-col rounded-3xl bg-white p-6 shadow-sm ring-1 ring-brand-100 transition duration-300 hover:-translate-y-1.5 hover:shadow-xl hover:shadow-brand-900/10"
            >
              <span className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-brand-700 to-brand-500 text-white shadow-md shadow-brand-700/25 transition duration-300 group-hover:scale-105">
                <StageIcon className="h-7 w-7" aria-hidden="true" />
              </span>
              <span aria-hidden="true" className="absolute top-5 right-6 font-heading text-5xl font-extrabold text-brand-100">
                {index + 1}
              </span>
              <h3 className="mt-5 text-xl font-extrabold">{title}</h3>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-600">{text}</p>
              <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-brand-700">
                Learn more
                <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" aria-hidden="true" />
              </span>
            </Link>
          ))}
        </RevealGrid>
      </Section>

      {doctors.length > 0 && (
        <Section id="doctors" className="scroll-mt-20">
          <SectionHeading eyebrow="Our doctors" title="The people behind NIDAN Mother & Child Clinic" />
          <RevealGrid className="mx-auto grid max-w-5xl gap-6 md:grid-cols-2 lg:gap-8" columns={2} step={140}>
            {doctors.map((doctor) => (
              <DoctorProfile key={doctor.id} doctor={doctor} />
            ))}
          </RevealGrid>
        </Section>
      )}

      {whyChooseUs.length > 0 && (
        <Section tone="soft">
          <div className="grid gap-10 lg:grid-cols-12 lg:items-center lg:gap-14">
            <div className="lg:col-span-4">
              <p className="mb-3 inline-block rounded-full bg-blush-100 px-3 py-1 text-xs font-semibold tracking-wide text-blush-700 uppercase">Why choose us</p>
              <h2 className="mb-4 text-3xl font-extrabold tracking-tight sm:text-4xl">What you can expect</h2>
              <p className="text-lg text-slate-600">Every visit is built around you and your child: your comfort, your questions and your time.</p>
              <div className="mt-6">
                <Button to="/book-appointment" variant="gradient">
                  <CalendarCheck className="h-4 w-4" aria-hidden="true" />
                  Book Appointment
                </Button>
              </div>
            </div>
            <RevealGrid className="grid gap-5 sm:grid-cols-2 lg:col-span-8" columns={2}>
              {whyChooseUs.map((item) => (
                <div
                  key={item.title}
                  className="group flex h-full gap-4 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-blush-100 transition duration-300 hover:-translate-y-1 hover:shadow-lg"
                >
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-blush-500 to-blush-300 text-white shadow-md shadow-blush-500/25 transition duration-300 group-hover:scale-105">
                    <Icon name={item.icon} className="h-6 w-6" />
                  </span>
                  <div>
                    <h3 className="text-lg font-bold">{item.title}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-slate-600">{item.description}</p>
                  </div>
                </div>
              ))}
            </RevealGrid>
          </div>
        </Section>
      )}

      {ownClinics.length > 0 && (
        <Section>
          <SectionHeading eyebrow="Visit us" title={ownClinics.length === 1 ? 'Our clinic' : 'Our clinics'} />
          <RevealGrid className={`mx-auto grid gap-6 md:grid-cols-2 ${ownClinics.length >= 3 ? 'max-w-6xl lg:grid-cols-3' : 'max-w-4xl'}`} columns={ownClinics.length >= 3 ? 3 : 2}>
            {ownClinics.map((location) => (
              <div key={location.id} className="flex h-full flex-col rounded-3xl border border-slate-100 bg-white p-6 shadow-sm transition duration-300 hover:shadow-lg sm:p-7">
                <div className="flex items-start gap-4">
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-blush-500 to-blush-300 text-white shadow-md shadow-blush-500/25">
                    <MapPin className="h-6 w-6" aria-hidden="true" />
                  </span>
                  <div className="min-w-0">
                    <h3 className="text-lg leading-snug font-extrabold">{location.name}</h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-slate-600">
                      {location.address}, {location.city}, {location.state}
                      {location.postalCode && ` ${location.postalCode}`}
                    </p>
                  </div>
                </div>
                {location.doctors?.length > 0 && (
                  <p className="mt-4 flex flex-1 items-start gap-2 text-sm text-slate-600">
                    <Users className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" aria-hidden="true" />
                    <span>
                      <span className="font-semibold text-slate-800">Doctors: </span>
                      {location.doctors.map((doctor) => doctor.name).join(' & ')}
                    </span>
                  </p>
                )}
                <div className="mt-5 flex flex-wrap gap-3">
                  {location.mapUrl && (
                    <Button href={location.mapUrl} target="_blank" rel="noopener noreferrer" variant="gradient">
                      <Navigation className="h-4 w-4" aria-hidden="true" />
                      Get directions
                    </Button>
                  )}
                  <Button href={telHref(clinic.phonePrimary)} variant="outline">
                    <Phone className="h-4 w-4" aria-hidden="true" />
                    Call
                  </Button>
                </div>
              </div>
            ))}
          </RevealGrid>
        </Section>
      )}

      <ContactStrip />
    </>
  );
}
