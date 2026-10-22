import { Link } from 'react-router-dom';
import { ArrowRight, Baby, CalendarCheck, CheckCircle2, Heart, Phone, Stethoscope, Syringe } from 'lucide-react';
import Button from '../../components/public/Button.jsx';
import Container from '../../components/public/Container.jsx';
import ContactStrip from '../../components/public/ContactStrip.jsx';
import DoctorCard from '../../components/public/DoctorCard.jsx';
import Icon from '../../components/public/Icon.jsx';
import PostCard from '../../components/public/PostCard.jsx';
import Section, { SectionHeading } from '../../components/public/Section.jsx';
import Seo from '../../components/public/Seo.jsx';
import ServiceCard from '../../components/public/ServiceCard.jsx';
import SpecialtyCard from '../../components/public/SpecialtyCard.jsx';
import { ErrorState, LoadingState } from '../../components/public/States.jsx';
import TestimonialSlider from '../../components/public/TestimonialSlider.jsx';
import { useSite } from '../../context/SiteContext.jsx';
import useFetch from '../../hooks/useFetch.js';
import { getHome } from '../../services/publicService.js';
import { telHref } from '../../utils/format.js';
import { clinicJsonLd } from '../../utils/jsonLd.js';

function Hero({ doctorCount }) {
  const { clinic, settings, ownClinics } = useSite();
  const hero = settings.hero || {};

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-blush-50 via-white to-white">
      <div aria-hidden="true" className="absolute -top-32 -left-24 h-96 w-96 rounded-full bg-blush-100 blur-3xl" />
      <div aria-hidden="true" className="absolute top-20 -right-24 h-96 w-96 rounded-full bg-brand-100/70 blur-3xl" />

      <Container className="relative grid items-center gap-12 py-14 sm:py-20 lg:grid-cols-2 lg:py-24">
        <div>
          <p className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-1.5 text-sm font-semibold text-brand-800 shadow-sm ring-1 ring-brand-100">
            <Heart className="h-4 w-4 fill-blush-400 text-blush-400" aria-hidden="true" />
            Mother &amp; Child Care · Noida
          </p>
          <h1 className="mt-6 text-4xl leading-tight font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
            {hero.heading || clinic.tagline}
          </h1>
          {hero.subheading && <p className="mt-5 max-w-xl text-lg leading-relaxed text-slate-600">{hero.subheading}</p>}

          <div className="mt-8 flex flex-wrap gap-3">
            <Button to="/book-appointment" size="lg">
              <CalendarCheck className="h-5 w-5" aria-hidden="true" />
              {hero.primaryCta || 'Book Appointment'}
            </Button>
            <Button to="/doctors" variant="outline" size="lg">
              {hero.secondaryCta || 'Meet Our Doctors'}
            </Button>
          </div>

          <p className="mt-6 flex items-center gap-2 text-slate-600">
            <Phone className="h-4 w-4 text-brand-700" aria-hidden="true" />
            Prefer to talk?
            <a href={telHref(clinic.phonePrimary)} className="font-semibold text-brand-800 hover:underline">
              {clinic.phonePrimary}
            </a>
          </p>
        </div>

        <div className="relative mx-auto aspect-square w-full max-w-md" aria-hidden="true">
          <div className="absolute inset-0 rounded-[3rem] bg-gradient-to-br from-blush-200 via-blush-100 to-brand-100" />
          <div className="absolute inset-6 grid place-items-center rounded-[2.5rem] bg-white/70 backdrop-blur">
            <Heart className="h-32 w-32 fill-blush-300 text-blush-400" />
          </div>
          <span className="absolute top-8 left-2 grid h-16 w-16 place-items-center rounded-full bg-white text-blush-500 shadow-lg">
            <Baby className="h-8 w-8" />
          </span>
          <span className="absolute top-14 -right-2 grid h-14 w-14 place-items-center rounded-full bg-white text-brand-700 shadow-lg">
            <Syringe className="h-7 w-7" />
          </span>
          <span className="absolute right-10 bottom-10 grid h-16 w-16 place-items-center rounded-full bg-white text-brand-700 shadow-lg">
            <Stethoscope className="h-8 w-8" />
          </span>
          {doctorCount > 0 && (
            <span className="absolute bottom-6 left-0 flex items-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-slate-800 shadow-lg">
              <CheckCircle2 className="h-5 w-5 text-brand-600" />
              {doctorCount} specialist doctors
            </span>
          )}
          {ownClinics.length > 0 && (
            <span className="absolute top-1/2 -left-3 hidden items-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-slate-800 shadow-lg sm:flex">
              <CheckCircle2 className="h-5 w-5 text-brand-600" />
              {ownClinics.length} clinics in Noida
            </span>
          )}
        </div>
      </Container>
    </section>
  );
}

export default function HomePage() {
  const site = useSite();
  const { data, loading, error, reload } = useFetch((signal) => getHome(signal), []);
  const whyChooseUs = site.settings.whyChooseUs || [];

  return (
    <>
      <Seo jsonLd={clinicJsonLd(site, window.location.origin)} />
      <Hero doctorCount={data?.doctors.length || 0} />

      {loading && <LoadingState className="py-24" />}
      {error && <ErrorState message={error} onRetry={reload} />}

      {data && (
        <>
          <Section id="services">
            <SectionHeading
              eyebrow="Our services"
              title="Complete care for mother and child"
              description="From pregnancy and delivery to newborn care and childhood health, find what your family needs in one place."
            />
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {data.services.map((service) => (
                <ServiceCard key={service.id} service={service} />
              ))}
            </div>
          </Section>

          <Section tone="mint" id="doctors">
            <SectionHeading
              eyebrow="Our doctors"
              title="Meet the doctors who care for your family"
              description="Choose a location to see when each doctor is available."
            />
            <div className="grid gap-6 lg:grid-cols-2">
              {data.doctors.map((doctor) => (
                <DoctorCard key={doctor.id} doctor={doctor} />
              ))}
            </div>
          </Section>

          {data.specialties.length > 0 && (
            <Section tone="soft">
              <SectionHeading eyebrow="Our specialties" title="What we are known for" />
              <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                {data.specialties.map((specialty) => (
                  <SpecialtyCard key={specialty.id} specialty={specialty} />
                ))}
              </div>
            </Section>
          )}

          {whyChooseUs.length > 0 && (
            <Section>
              <SectionHeading eyebrow="Why choose us" title="Care that puts you first" />
              <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
                {whyChooseUs.map((item) => (
                  <div key={item.title} className="text-center">
                    <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-brand-50 text-brand-700">
                      <Icon name={item.icon} className="h-8 w-8" />
                    </span>
                    <h3 className="mt-5 text-lg font-bold">{item.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-slate-600">{item.description}</p>
                  </div>
                ))}
              </div>
            </Section>
          )}

          {data.testimonials.length > 0 && (
            <Section tone="mint">
              <SectionHeading eyebrow="Testimonials" title="Words from our patients" />
              <TestimonialSlider testimonials={data.testimonials} />
              <p className="mt-8 text-center">
                <Link to="/testimonials" className="inline-flex items-center gap-1 font-semibold text-brand-700 hover:underline">
                  Read more and share your experience <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </p>
            </Section>
          )}

          {data.gallery.images.length > 0 && (
            <Section>
              <SectionHeading eyebrow="Gallery" title="A look inside Nidan" />
              <ul className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
                {data.gallery.images.map((image) => (
                  <li key={image.id} className="aspect-square overflow-hidden rounded-3xl bg-slate-100">
                    <Link to="/gallery" className="block h-full w-full">
                      <img
                        src={image.imageUrl}
                        alt={image.altText}
                        loading="lazy"
                        width="400"
                        height="400"
                        className="h-full w-full object-cover transition duration-500 hover:scale-105"
                      />
                    </Link>
                  </li>
                ))}
              </ul>
              <p className="mt-8 text-center">
                <Button to="/gallery" variant="outline">
                  See full gallery
                </Button>
              </p>
            </Section>
          )}

          {data.posts.length > 0 && (
            <Section tone="soft">
              <SectionHeading eyebrow="From our blog" title="Helpful reading for parents" />
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {data.posts.map((post) => (
                  <PostCard key={post.id} post={post} />
                ))}
              </div>
              <p className="mt-8 text-center">
                <Button to="/blog" variant="outline">
                  Read all articles
                </Button>
              </p>
            </Section>
          )}
        </>
      )}

      <ContactStrip />
    </>
  );
}
