import { Link } from 'react-router-dom';
import { MapPin } from 'lucide-react';
import ContactStrip from '../../components/public/ContactStrip.jsx';
import DoctorAvatar from '../../components/public/DoctorAvatar.jsx';
import Icon from '../../components/public/Icon.jsx';
import { RevealGrid } from '../../components/public/Reveal.jsx';
import PageHeader from '../../components/public/PageHeader.jsx';
import Section, { SectionHeading } from '../../components/public/Section.jsx';
import Seo from '../../components/public/Seo.jsx';
import { useSite } from '../../context/SiteContext.jsx';
import useFetch from '../../hooks/useFetch.js';
import { getDoctors } from '../../services/publicService.js';

export default function AboutPage() {
  const { clinic, settings, ownClinics } = useSite();
  const { data } = useFetch((signal) => getDoctors(signal), []);
  const about = settings.about || {};
  const whyChooseUs = settings.whyChooseUs || [];

  return (
    <>
      <Seo
        title="About Us"
        description={`Learn about ${clinic.name}: ${clinic.tagline}. Meet our doctors and find our clinic in Noida.`}
      />
      <PageHeader title={about.heading || `About ${clinic.name}`} crumbs={[{ label: 'About Us' }]} description={clinic.tagline} />

      <Section>
        <div className="mx-auto max-w-3xl">
          <div className="rich-text text-lg" dangerouslySetInnerHTML={{ __html: about.body || '' }} />
        </div>
      </Section>

      {data && data.items.length > 0 && (
        <Section tone="mint">
          <SectionHeading eyebrow="Our doctors" title="The people behind Nidan" />
          <RevealGrid className="mx-auto grid max-w-4xl gap-6 md:grid-cols-2" columns={2} step={140}>
            {data.items.map((doctor) => (
              <Link
                key={doctor.id}
                to={`/doctors/${doctor.slug}`}
                className="flex items-center gap-5 rounded-3xl bg-white p-6 shadow-sm transition hover:shadow-lg"
              >
                <DoctorAvatar doctor={doctor} size="md" />
                <span>
                  <span className="block font-heading text-xl font-extrabold text-slate-900">{doctor.name}</span>
                  <span className="block font-semibold text-brand-700">{doctor.designation}</span>
                  <span className="block text-sm text-slate-600">{doctor.qualifications}</span>
                </span>
              </Link>
            ))}
          </RevealGrid>
        </Section>
      )}

      {whyChooseUs.length > 0 && (
        <Section>
          <SectionHeading eyebrow="Why choose us" title="What you can expect" />
          <RevealGrid className="grid gap-6 sm:grid-cols-2" columns={2}>
            {whyChooseUs.map((item) => (
              <div key={item.title} className="flex gap-4 rounded-3xl border border-slate-100 p-6">
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-blush-100 text-blush-600">
                  <Icon name={item.icon} className="h-6 w-6" />
                </span>
                <div>
                  <h3 className="text-lg font-bold">{item.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-slate-600">{item.description}</p>
                </div>
              </div>
            ))}
          </RevealGrid>
        </Section>
      )}

      {ownClinics.length > 0 && (
        <Section tone="soft">
          <SectionHeading eyebrow="Visit us" title={ownClinics.length === 1 ? 'Our clinic' : 'Our clinics'} />
          <RevealGrid className="mx-auto grid max-w-6xl gap-6 md:grid-cols-2 lg:grid-cols-3" columns={3}>
            {ownClinics.map((location) => (
              <div key={location.id} className="flex h-full flex-col rounded-3xl bg-white p-6 shadow-sm">
                <h3 className="text-lg font-bold">{location.name}</h3>
                <p className="mt-2 flex flex-1 items-start gap-2 text-sm text-slate-600">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-blush-500" aria-hidden="true" />
                  <span>
                    {location.address}, {location.city}, {location.state}
                    {location.postalCode && ` ${location.postalCode}`}
                  </span>
                </p>
                {location.mapUrl && (
                  <a href={location.mapUrl} target="_blank" rel="noopener noreferrer" className="mt-4 text-sm font-semibold text-brand-700 hover:underline">
                    Get directions
                  </a>
                )}
              </div>
            ))}
          </RevealGrid>
        </Section>
      )}

      <ContactStrip />
    </>
  );
}
