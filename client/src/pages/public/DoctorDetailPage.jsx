import { useParams } from 'react-router-dom';
import { Award, CalendarCheck, Check, Clock, MapPin, Phone } from 'lucide-react';
import Button from '../../components/public/Button.jsx';
import ContactStrip from '../../components/public/ContactStrip.jsx';
import DoctorAvatar from '../../components/public/DoctorAvatar.jsx';
import PageHeader from '../../components/public/PageHeader.jsx';
import Section from '../../components/public/Section.jsx';
import Seo from '../../components/public/Seo.jsx';
import { ErrorState, LoadingState } from '../../components/public/States.jsx';
import { useSite } from '../../context/SiteContext.jsx';
import useFetch from '../../hooks/useFetch.js';
import { getDoctor } from '../../services/publicService.js';
import { telHref } from '../../utils/format.js';
import { physicianJsonLd } from '../../utils/jsonLd.js';
import { groupSchedule } from '../../utils/schedule.js';
import NotFoundPage from './NotFoundPage.jsx';

export default function DoctorDetailPage() {
  const { slug } = useParams();
  const site = useSite();
  const { data: doctor, loading, error, status, reload } = useFetch((signal) => getDoctor(slug, signal), [slug]);

  if (status === 404) return <NotFoundPage />;
  if (loading) return <LoadingState className="min-h-[50vh]" />;
  if (error) return <ErrorState message={error} onRetry={reload} />;

  return (
    <>
      <Seo
        title={doctor.metaTitle || `${doctor.name} – ${doctor.designation}`}
        description={doctor.metaDescription || `${doctor.name} (${doctor.qualifications}) is a ${doctor.designation} at ${site.clinic.name}, Noida. Book an appointment online.`}
        image={doctor.photoUrl}
        type="profile"
        jsonLd={physicianJsonLd(doctor, site, window.location.origin)}
      />
      <PageHeader
        title={doctor.name}
        crumbs={[{ label: 'Doctors', to: '/doctors' }, { label: doctor.name }]}
        description={doctor.designation}
      />

      <Section>
        <div className="grid gap-10 lg:grid-cols-3">
          <aside className="lg:col-span-1">
            <div className="rounded-3xl border border-slate-100 bg-white p-8 text-center shadow-sm lg:sticky lg:top-28">
              <DoctorAvatar doctor={doctor} size="xl" className="mx-auto" />
              <h2 className="mt-5 text-2xl font-extrabold">{doctor.name}</h2>
              <p className="font-semibold text-brand-700">{doctor.designation}</p>
              <p className="mt-1 text-sm text-slate-600">{doctor.qualifications}</p>
              {doctor.highlights.map((highlight) => (
                <span key={highlight} className="mt-3 inline-flex items-center gap-1 rounded-full bg-blush-100 px-3 py-1 text-xs font-semibold text-blush-700">
                  <Award className="h-3.5 w-3.5" aria-hidden="true" />
                  {highlight}
                </span>
              ))}
              <div className="mt-6 grid gap-3">
                <Button to={`/book-appointment?doctor=${doctor.slug}`} size="lg">
                  <CalendarCheck className="h-5 w-5" aria-hidden="true" />
                  Book with this doctor
                </Button>
                <Button href={telHref(site.clinic.phonePrimary)} variant="outline">
                  <Phone className="h-4 w-4" aria-hidden="true" />
                  {site.clinic.phonePrimary}
                </Button>
              </div>
            </div>
          </aside>

          <div className="space-y-10 lg:col-span-2">
            {doctor.quote && (
              <blockquote className="rounded-3xl bg-blush-50 p-6 font-heading text-xl leading-relaxed font-semibold text-slate-800 italic">
                “{doctor.quote}”
              </blockquote>
            )}

            {doctor.bio && (
              <div>
                <h2 className="mb-4 text-2xl font-extrabold">About {doctor.name}</h2>
                <div className="rich-text" dangerouslySetInnerHTML={{ __html: doctor.bio }} />
              </div>
            )}

            {doctor.specialities.length > 0 && (
              <div>
                <h2 className="mb-4 text-2xl font-extrabold">Areas of focus</h2>
                <ul className="grid gap-3 sm:grid-cols-2">
                  {doctor.specialities.map((item) => (
                    <li key={item} className="flex items-start gap-3 rounded-2xl bg-brand-50 p-4">
                      <Check className="mt-0.5 h-5 w-5 shrink-0 text-brand-700" aria-hidden="true" />
                      <span className="font-medium text-slate-800">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div>
              <h2 className="mb-4 text-2xl font-extrabold">Locations &amp; timings</h2>
              {doctor.schedules.length === 0 && (
                <p className="text-slate-600">Timings will be updated soon. Please call us to confirm.</p>
              )}
              <div className="grid gap-5 md:grid-cols-2">
                {doctor.schedules.map(({ location, slots }) => (
                  <section key={location.id} className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
                    <h3 className="text-lg font-bold">{location.name}</h3>
                    <p className="mt-1 flex items-start gap-2 text-sm text-slate-600">
                      <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-blush-500" aria-hidden="true" />
                      <span>
                        {location.address}
                        {location.mapUrl && (
                          <>
                            {' · '}
                            <a href={location.mapUrl} target="_blank" rel="noopener noreferrer" className="font-medium text-brand-700 hover:underline">
                              Map
                            </a>
                          </>
                        )}
                      </span>
                    </p>
                    <ul className="mt-4 space-y-2">
                      {groupSchedule(slots).map((line) => (
                        <li key={`${line.days}-${line.time}`} className="flex items-start gap-2 text-sm">
                          <Clock className="mt-0.5 h-4 w-4 shrink-0 text-brand-700" aria-hidden="true" />
                          <span>
                            <strong className="font-semibold text-slate-900">{line.days}</strong>
                            <span className="text-slate-600"> · {line.time}</span>
                          </span>
                        </li>
                      ))}
                    </ul>
                    <Button
                      to={`/book-appointment?doctor=${doctor.slug}&location=${location.slug}`}
                      variant="secondary"
                      className="mt-5"
                    >
                      Book here
                    </Button>
                  </section>
                ))}
              </div>
            </div>
          </div>
        </div>
      </Section>
      <ContactStrip />
    </>
  );
}
