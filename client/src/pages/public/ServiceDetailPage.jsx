import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, CalendarCheck, ChevronRight, MapPin, MessageCircle, Navigation, Phone } from 'lucide-react';
import Button from '../../components/public/Button.jsx';
import ContactStrip from '../../components/public/ContactStrip.jsx';
import Icon from '../../components/public/Icon.jsx';
import PageHeader from '../../components/public/PageHeader.jsx';
import Section from '../../components/public/Section.jsx';
import Seo from '../../components/public/Seo.jsx';
import { ErrorState, LoadingState } from '../../components/public/States.jsx';
import { useSite } from '../../context/SiteContext.jsx';
import useFetch from '../../hooks/useFetch.js';
import { getService, getServices } from '../../services/publicService.js';
import { telHref, whatsappHref } from '../../utils/format.js';
import NotFoundPage from './NotFoundPage.jsx';

/** The big picture beside the page title (tablet and up): the service photo, or its icon, in a soft frame. */
function HeroPicture({ service }) {
  const frame = 'h-64 w-64 rounded-[1.75rem] lg:h-72 lg:w-72';
  return (
    <div className="relative">
      <div aria-hidden="true" className="absolute -inset-5 rounded-[3rem] bg-linear-to-br from-brand-200/70 via-white/0 to-blush-200/80 blur-2xl" />
      <div className="relative rounded-[2.25rem] bg-white p-3 shadow-xl shadow-brand-900/10 ring-1 ring-brand-100">
        {service.imageUrl ? (
          <img src={service.imageUrl} alt={service.name} width="320" height="320" className={`${frame} bg-brand-50 object-cover`} />
        ) : (
          <span className={`${frame} grid place-items-center bg-brand-50 text-brand-700`}>
            <Icon name={service.icon} className="h-24 w-24" />
          </span>
        )}
      </div>
      <span
        aria-hidden="true"
        className="anim-float absolute -right-3 -bottom-3 grid h-14 w-14 place-items-center rounded-2xl bg-linear-to-br from-blush-500 to-blush-300 text-white shadow-lg shadow-blush-500/30"
      >
        <Icon name={service.icon} className="h-7 w-7" />
      </span>
    </div>
  );
}

/** Small round picture (or icon tile) for lists and the phone layout. */
function Thumb({ service, size = 'h-9 w-9', className = '' }) {
  return service.imageUrl ? (
    <img src={service.imageUrl} alt="" loading="lazy" decoding="async" width="64" height="64" className={`${size} shrink-0 rounded-full object-cover ${className}`} />
  ) : (
    <span className={`${size} grid shrink-0 place-items-center rounded-full bg-brand-50 text-brand-700 ${className}`}>
      <Icon name={service.icon} className="h-1/2 w-1/2" />
    </span>
  );
}

/** Previous / next service, wrapping around, so a visitor can keep browsing without going back to the list. */
function Neighbours({ items, current }) {
  const index = items.findIndex((item) => item.slug === current);
  if (index < 0 || items.length < 2) return null;

  const previous = items[(index - 1 + items.length) % items.length];
  const next = items[(index + 1) % items.length];
  const card =
    'group flex items-center gap-4 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-md';
  const arrow =
    'grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brand-50 text-brand-700 transition group-hover:bg-brand-700 group-hover:text-white';
  const caption = 'block text-xs font-semibold tracking-wide text-slate-500 uppercase';

  return (
    <nav aria-label="More services" className={`grid gap-4 ${items.length > 2 ? 'sm:grid-cols-2' : ''}`}>
      {items.length > 2 && (
        <Link to={`/services/${previous.slug}`} className={card}>
          <span className={arrow}>
            <ArrowLeft className="h-5 w-5" aria-hidden="true" />
          </span>
          <span className="min-w-0">
            <span className={caption}>Previous service</span>
            <span className="block truncate font-bold">{previous.name}</span>
          </span>
        </Link>
      )}
      <Link to={`/services/${next.slug}`} className={`${card} justify-between text-right`}>
        <span className="min-w-0">
          <span className={caption}>Next service</span>
          <span className="block truncate font-bold">{next.name}</span>
        </span>
        <span className={arrow}>
          <ArrowRight className="h-5 w-5" aria-hidden="true" />
        </span>
      </Link>
    </nav>
  );
}

export default function ServiceDetailPage() {
  const { slug } = useParams();
  const { clinic, ownClinics } = useSite();
  const { data: service, loading, error, status, reload } = useFetch((signal) => getService(slug, signal), [slug]);
  const { data: all } = useFetch((signal) => getServices(signal), []);

  if (status === 404) return <NotFoundPage />;
  if (loading) return <LoadingState className="min-h-[50vh]" />;
  if (error) return <ErrorState message={error} onRetry={reload} />;

  const items = all?.items || [];

  return (
    <>
      <Seo
        title={service.metaTitle || `${service.name} in Noida`}
        description={service.metaDescription || service.shortDescription}
        image={service.imageUrl}
      />
      <PageHeader
        title={service.name}
        crumbs={[{ label: 'Services', to: '/services' }, { label: service.name }]}
        description={service.shortDescription}
        aside={<HeroPicture service={service} />}
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
        <div className="grid gap-8 lg:grid-cols-3 lg:gap-10">
          <div className="space-y-8 lg:col-span-2">
            <article className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm sm:p-10">
              <div className="mb-6 flex items-center gap-4">
                <Thumb service={service} size="h-14 w-14" className="ring-4 ring-brand-50 md:hidden" />
                <div>
                  <span aria-hidden="true" className="mb-2 block h-1 w-10 rounded-full bg-linear-to-r from-brand-600 to-blush-400" />
                  <h2 className="text-2xl font-extrabold sm:text-3xl">About {service.name}</h2>
                </div>
              </div>
              <div className="rich-text sm:text-[17px]" dangerouslySetInnerHTML={{ __html: service.description }} />
            </article>

            {ownClinics.length > 0 && (
              <section aria-labelledby="visit-us" className="rounded-3xl bg-linear-to-br from-brand-50 to-blush-50 p-6 sm:p-8">
                <h2 id="visit-us" className="text-xl font-extrabold sm:text-2xl">
                  Visit us
                </h2>
                <p className="mt-1 text-slate-600">
                  Doctor timings are on the{' '}
                  <Link to="/contact-us" className="font-semibold text-brand-700 underline underline-offset-2 hover:text-brand-800">
                    Contact page
                  </Link>
                  . Please call to confirm before you come.
                </p>
                <div className={`mt-5 grid gap-4 ${ownClinics.length > 1 ? 'md:grid-cols-2' : ''}`}>
                  {ownClinics.map((location) => (
                    <div key={location.id} className="flex flex-col rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
                      <div className="flex items-start gap-3">
                        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-700">
                          <MapPin className="h-5 w-5" aria-hidden="true" />
                        </span>
                        <div className="min-w-0">
                          <h3 className="leading-snug font-bold">{location.name}</h3>
                          <p className="mt-1 text-sm leading-relaxed text-slate-600">
                            {location.address}, {location.city} {location.postalCode}
                          </p>
                        </div>
                      </div>
                      <div className="mt-4 flex flex-wrap gap-2.5">
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
                </div>
              </section>
            )}

            <Neighbours items={items} current={service.slug} />
          </div>

          <aside className="space-y-6">
            <div className="relative overflow-hidden rounded-3xl bg-brand-800 p-6 text-white shadow-lg shadow-brand-900/20">
              <div aria-hidden="true" className="absolute -top-16 -right-16 h-48 w-48 rounded-full bg-brand-600/50 blur-2xl" />
              <div aria-hidden="true" className="absolute -bottom-20 -left-10 h-44 w-44 rounded-full bg-blush-400/20 blur-2xl" />
              <div className="relative">
                <span className="grid h-11 w-11 place-items-center rounded-2xl bg-white/10 text-blush-200">
                  <CalendarCheck className="h-5 w-5" aria-hidden="true" />
                </span>
                <h2 className="mt-4 text-xl font-extrabold text-white">Ready to book?</h2>
                <p className="mt-1.5 text-sm text-brand-100">Choose your doctor, clinic and a time that suits you.</p>
                <div className="mt-5 grid gap-3">
                  <Button to="/book-appointment" variant="light">
                    <CalendarCheck className="h-4 w-4" aria-hidden="true" />
                    Book Appointment
                  </Button>
                  <a
                    href={telHref(clinic.phonePrimary)}
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-white/10 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/20"
                  >
                    <Phone className="h-4 w-4" aria-hidden="true" />
                    {clinic.phonePrimary}
                  </a>
                  <Button
                    href={whatsappHref(clinic.whatsappNumber, `Hello ${clinic.name}, I would like to know more about ${service.name}.`)}
                    target="_blank"
                    rel="noopener noreferrer"
                    variant="whatsapp"
                  >
                    <MessageCircle className="h-4 w-4" aria-hidden="true" />
                    WhatsApp us
                  </Button>
                </div>
              </div>
            </div>

            {items.length > 0 && (
              <nav aria-label="All services" className="rounded-3xl border border-slate-100 bg-white p-4 shadow-sm sm:p-5">
                <h2 className="px-2 pb-2 text-lg font-extrabold">All services</h2>
                <ul className="space-y-0.5">
                  {items.map((item) => {
                    const current = item.slug === service.slug;
                    return (
                      <li key={item.id}>
                        <Link
                          to={`/services/${item.slug}`}
                          aria-current={current ? 'page' : undefined}
                          className={`flex items-center gap-3 rounded-2xl px-2 py-2 text-sm font-semibold transition ${
                            current ? 'bg-brand-50 text-brand-800 ring-1 ring-brand-100' : 'text-slate-700 hover:bg-slate-50 hover:text-brand-800'
                          }`}
                        >
                          <Thumb service={item} />
                          <span className="min-w-0 flex-1">{item.name}</span>
                          {current ? (
                            <span aria-hidden="true" className="mr-1 h-2 w-2 rounded-full bg-brand-500" />
                          ) : (
                            <ChevronRight className="h-4 w-4 shrink-0 text-slate-300" aria-hidden="true" />
                          )}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </nav>
            )}
          </aside>
        </div>
      </Section>
      <ContactStrip />
    </>
  );
}
