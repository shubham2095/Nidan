import { Link, useParams } from 'react-router-dom';
import { CalendarCheck, Phone } from 'lucide-react';
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
import { telHref } from '../../utils/format.js';
import NotFoundPage from './NotFoundPage.jsx';

export default function ServiceDetailPage() {
  const { slug } = useParams();
  const { clinic } = useSite();
  const { data: service, loading, error, status, reload } = useFetch((signal) => getService(slug, signal), [slug]);
  const { data: all } = useFetch((signal) => getServices(signal), []);

  if (status === 404) return <NotFoundPage />;
  if (loading) return <LoadingState className="min-h-[50vh]" />;
  if (error) return <ErrorState message={error} onRetry={reload} />;

  const others = (all?.items || []).filter((item) => item.slug !== service.slug);

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
      />

      <Section>
        <div className="grid gap-10 lg:grid-cols-3">
          <article className="lg:col-span-2">
            {service.imageUrl ? (
              <img
                src={service.imageUrl}
                alt={service.name}
                width="320"
                height="320"
                className="mb-8 max-h-72 w-auto max-w-full rounded-3xl object-contain"
              />
            ) : (
              <span className="mb-6 grid h-16 w-16 place-items-center rounded-3xl bg-brand-50 text-brand-700">
                <Icon name={service.icon} className="h-8 w-8" />
              </span>
            )}
            <div className="rich-text" dangerouslySetInnerHTML={{ __html: service.description }} />
          </article>

          <aside className="space-y-6">
            <div className="rounded-3xl bg-brand-50 p-6">
              <h2 className="text-xl font-extrabold">Ready to book?</h2>
              <p className="mt-2 text-sm text-slate-600">Choose your doctor, location and a time that suits you.</p>
              <div className="mt-5 grid gap-3">
                <Button to="/book-appointment">
                  <CalendarCheck className="h-4 w-4" aria-hidden="true" />
                  Book Appointment
                </Button>
                <Button href={telHref(clinic.phonePrimary)} variant="outline">
                  <Phone className="h-4 w-4" aria-hidden="true" />
                  {clinic.phonePrimary}
                </Button>
              </div>
            </div>

            {others.length > 0 && (
              <nav aria-label="Other services" className="rounded-3xl border border-slate-100 p-6">
                <h2 className="mb-3 text-lg font-extrabold">Other services</h2>
                <ul className="space-y-1">
                  {others.map((item) => (
                    <li key={item.id}>
                      <Link
                        to={`/services/${item.slug}`}
                        className="block rounded-xl px-3 py-2 text-sm font-medium text-slate-700 hover:bg-brand-50 hover:text-brand-800"
                      >
                        {item.name}
                      </Link>
                    </li>
                  ))}
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
