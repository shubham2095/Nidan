import { Link } from 'react-router-dom';
import { ArrowRight, Baby, CalendarCheck, CheckCircle2, Heart, MapPin, MessageCircle, Phone, Stethoscope, Syringe } from 'lucide-react';
import Button from '../../components/public/Button.jsx';
import ClinicLocator from '../../components/public/ClinicLocator.jsx';
import Container from '../../components/public/Container.jsx';
import ContactStrip from '../../components/public/ContactStrip.jsx';
import DoctorCard from '../../components/public/DoctorCard.jsx';
import FaqSection from '../../components/public/FaqSection.jsx';
import Icon from '../../components/public/Icon.jsx';
import PostCard from '../../components/public/PostCard.jsx';
import Reveal, { RevealGrid } from '../../components/public/Reveal.jsx';
import Section, { SectionHeading } from '../../components/public/Section.jsx';
import Seo from '../../components/public/Seo.jsx';
import ServiceCard from '../../components/public/ServiceCard.jsx';
import SpecialtyCard from '../../components/public/SpecialtyCard.jsx';
import { ErrorState, LoadingState } from '../../components/public/States.jsx';
import TestimonialSlider from '../../components/public/TestimonialSlider.jsx';
import { useSite } from '../../context/SiteContext.jsx';
import useFetch from '../../hooks/useFetch.js';
import { getHome } from '../../services/publicService.js';
import { cityList, clinicsLabel, telHref, whatsappHref } from '../../utils/format.js';
import { clinicJsonLd } from '../../utils/jsonLd.js';

/** The two facts floating on the hero picture; real counts from the database, never invented numbers. */
function HeroBadges({ doctorCount }) {
  const { ownClinics } = useSite();
  return (
    <>
      {doctorCount > 0 && (
        <span className="anim-float absolute bottom-6 left-0 flex items-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-slate-800 shadow-lg" style={{ '--d': '600ms' }}>
          <CheckCircle2 className="h-5 w-5 text-brand-600" aria-hidden="true" />
          {doctorCount} specialist doctors
        </span>
      )}
      {ownClinics.length > 0 && (
        <span className="anim-float absolute top-1/2 -left-3 hidden items-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-slate-800 shadow-lg sm:flex" style={{ '--d': '1800ms' }}>
          <CheckCircle2 className="h-5 w-5 text-brand-600" aria-hidden="true" />
          {clinicsLabel(ownClinics)}
        </span>
      )}
    </>
  );
}

/** Banner picture chosen in Site settings, or the illustration until one is uploaded. */
function HeroVisual({ doctorCount }) {
  const { settings } = useSite();
  const { imageUrl, imageAlt } = settings.hero || {};

  if (imageUrl) {
    return (
      <div className="hero-in-right relative mx-auto w-full max-w-xs sm:max-w-sm" style={{ '--d': '250ms' }}>
        <div aria-hidden="true" className="absolute -inset-3 rounded-[3rem] bg-gradient-to-br from-blush-200 via-blush-100 to-brand-100" />
        <img
          src={imageUrl}
          alt={imageAlt || ''}
          width="640"
          height="800"
          fetchpriority="high"
          className="relative aspect-[4/3] w-full rounded-[2rem] object-cover shadow-xl sm:aspect-[4/5] sm:rounded-[2.5rem]"
        />
        <HeroBadges doctorCount={doctorCount} />
      </div>
    );
  }

  return (
    <div className="hero-in-right relative mx-auto aspect-square w-full max-w-md" aria-hidden="true" style={{ '--d': '250ms' }}>
      <div className="absolute inset-0 rounded-[3rem] bg-gradient-to-br from-blush-200 via-blush-100 to-brand-100" />
      <div className="absolute inset-6 grid place-items-center rounded-[2.5rem] bg-white/70 backdrop-blur">
        <Heart className="anim-heartbeat h-32 w-32 fill-blush-300 text-blush-400" />
      </div>
      <span className="anim-float absolute top-8 left-2 grid h-16 w-16 place-items-center rounded-full bg-white text-blush-500 shadow-lg">
        <Baby className="h-8 w-8" />
      </span>
      <span className="anim-float absolute top-14 -right-2 grid h-14 w-14 place-items-center rounded-full bg-white text-brand-700 shadow-lg">
        <Syringe className="h-7 w-7" />
      </span>
      <span className="anim-float absolute right-10 bottom-10 grid h-16 w-16 place-items-center rounded-full bg-white text-brand-700 shadow-lg">
        <Stethoscope className="h-8 w-8" />
      </span>
      <HeroBadges doctorCount={doctorCount} />
    </div>
  );
}

function Hero({ doctorCount }) {
  const { clinic, settings } = useSite();
  const hero = settings.hero || {};

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-blush-50 via-white to-white">
      <div aria-hidden="true" className="anim-drift absolute -top-32 -left-24 h-96 w-96 rounded-full bg-blush-100 blur-3xl" />
      <div aria-hidden="true" className="anim-drift-reverse absolute top-20 -right-24 h-96 w-96 rounded-full bg-brand-100/70 blur-3xl" />

      <Container className="relative grid items-center gap-12 pt-14 pb-20 sm:pt-20 sm:pb-24 lg:grid-cols-2 lg:pt-24 lg:pb-28">
        <div>
          <p className="hero-in inline-flex items-center gap-2 rounded-full bg-white px-4 py-1.5 text-sm font-semibold text-brand-800 shadow-sm ring-1 ring-brand-100">
            <Heart className="h-4 w-4 fill-blush-400 text-blush-400" aria-hidden="true" />
            Mother &amp; Child Care · Noida
          </p>
          <h1 className="hero-in mt-6 text-4xl leading-tight font-extrabold tracking-tight sm:text-5xl lg:text-6xl" style={{ '--d': '120ms' }}>
            {hero.heading || clinic.tagline}
          </h1>
          {hero.subheading && (
            <p className="hero-in mt-5 max-w-xl text-lg leading-relaxed text-slate-600" style={{ '--d': '260ms' }}>
              {hero.subheading}
            </p>
          )}

          <div className="hero-in mt-8 flex flex-wrap gap-3" style={{ '--d': '400ms' }}>
            <Button to="/book-appointment" size="lg">
              <CalendarCheck className="h-5 w-5" aria-hidden="true" />
              {hero.primaryCta || 'Book Appointment'}
            </Button>
            <Button to="/doctors" variant="outline" size="lg">
              {hero.secondaryCta || 'Meet Our Doctors'}
            </Button>
          </div>
        </div>

        <HeroVisual doctorCount={doctorCount} />
      </Container>
    </section>
  );
}

/** Our clinics: pick one to see its address, directions, opening hours and map. */
function VisitSection({ doctors }) {
  const { ownClinics } = useSite();
  if (ownClinics.length === 0) return null;

  return (
    <Section id="visit">
      <SectionHeading
        eyebrow="Visit us"
        title={ownClinics.length === 1 ? 'Visit our clinic' : 'Find the clinic nearest to you'}
        description={ownClinics.length === 1 ? undefined : `${ownClinics.length} clinics in ${cityList(ownClinics)}. Choose one to see its address, directions and map.`}
      />
      <ClinicLocator doctors={doctors} />
    </Section>
  );
}

/** Four ways to reach the clinic, floating over the bottom edge of the hero so they are always in sight. */
function QuickActions() {
  const { clinic, ownClinics } = useSite();
  const actions = [
    { key: 'book', to: '/book-appointment', Icon: CalendarCheck, title: 'Book online', text: 'Pick a doctor and a time', accent: 'bg-brand-700 text-white' },
    { key: 'call', href: telHref(clinic.phonePrimary), Icon: Phone, title: 'Call us', text: clinic.phonePrimary, accent: 'bg-brand-50 text-brand-700' },
    {
      key: 'whatsapp',
      href: whatsappHref(clinic.whatsappNumber, `Hello ${clinic.name}, I would like to book an appointment.`),
      external: true,
      Icon: MessageCircle,
      title: 'WhatsApp',
      text: 'Chat with our team',
      accent: 'bg-emerald-50 text-emerald-700',
    },
    {
      key: 'clinics',
      to: '/contact-us',
      Icon: MapPin,
      title: ownClinics.length === 1 ? 'Find our clinic' : 'Find a clinic',
      text: ownClinics.length > 1 ? `${ownClinics.length} locations` : 'Address and hours',
      accent: 'bg-blush-100 text-blush-700',
    },
  ];

  return (
    <div className="relative z-10 -mt-10 sm:-mt-14">
      <Container>
        <ul className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {actions.map(({ key, to, href, external, Icon, title, text, accent }, index) => {
            const classes = 'group flex h-full flex-col items-start gap-3 rounded-3xl border border-slate-100 bg-white p-4 shadow-lg shadow-slate-900/5 transition hover:-translate-y-0.5 hover:shadow-xl sm:flex-row sm:items-center sm:gap-4 sm:p-5';
            const body = (
              <>
                <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl ${accent}`}>
                  <Icon className="h-6 w-6" aria-hidden="true" />
                </span>
                <span className="min-w-0">
                  <span className="block font-heading text-base font-extrabold text-slate-900">{title}</span>
                  <span className="block text-sm leading-snug text-slate-600">{text}</span>
                </span>
              </>
            );
            return (
              <Reveal as="li" key={key} delay={300 + index * 100}>
                {to ? (
                  <Link to={to} className={classes}>{body}</Link>
                ) : (
                  <a href={href} className={classes} {...(external && { target: '_blank', rel: 'noopener noreferrer' })}>{body}</a>
                )}
              </Reveal>
            );
          })}
        </ul>
      </Container>
    </div>
  );
}

export default function HomePage() {
  const site = useSite();
  const { data, loading, error, reload } = useFetch((signal) => getHome(signal), []);
  const whyChooseUs = site.settings.whyChooseUs || [];
  const faq = site.settings.faq || [];

  return (
    <>
      <Seo image={site.settings.hero?.imageUrl} jsonLd={clinicJsonLd(site, window.location.origin)} />
      <Hero doctorCount={data?.doctors.length || 0} />
      <QuickActions />

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
            <RevealGrid className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" columns={4}>
              {data.services.map((service) => (
                <ServiceCard key={service.id} service={service} />
              ))}
            </RevealGrid>
          </Section>

          <Section tone="mint" id="doctors">
            <SectionHeading
              eyebrow="Our doctors"
              title="Meet the doctors who care for your family"
              description="Choose your doctor, the clinic that is nearest to you, and a day and time that suits you."
            />
            <RevealGrid className="grid gap-6 lg:grid-cols-2" columns={2} step={140}>
              {data.doctors.map((doctor) => (
                <DoctorCard key={doctor.id} doctor={doctor} />
              ))}
            </RevealGrid>
          </Section>

          <VisitSection doctors={data.doctors} />

          {data.specialties.length > 0 && (
            <Section tone="soft">
              <SectionHeading eyebrow="Our specialties" title="What we are known for" />
              <RevealGrid className="grid gap-5 md:grid-cols-2 lg:grid-cols-3" columns={3} variant="zoom">
                {data.specialties.map((specialty) => (
                  <SpecialtyCard key={specialty.id} specialty={specialty} />
                ))}
              </RevealGrid>
            </Section>
          )}

          {whyChooseUs.length > 0 && (
            <Section>
              <SectionHeading eyebrow="Why choose us" title="Care that puts you first" />
              <RevealGrid className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4" columns={4} itemClassName="">
                {whyChooseUs.map((item) => (
                  <div key={item.title} className="text-center">
                    <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-brand-50 text-brand-700">
                      <Icon name={item.icon} className="h-8 w-8" />
                    </span>
                    <h3 className="mt-5 text-lg font-bold">{item.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-slate-600">{item.description}</p>
                  </div>
                ))}
              </RevealGrid>
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
                {data.gallery.images.map((image, index) => (
                  <Reveal as="li" key={image.id} variant="zoom" delay={(index % 4) * 90} className="aspect-square overflow-hidden rounded-3xl bg-slate-100">
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
                  </Reveal>
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
              <RevealGrid className="grid gap-6 md:grid-cols-2 lg:grid-cols-3" columns={3}>
                {data.posts.map((post) => (
                  <PostCard key={post.id} post={post} />
                ))}
              </RevealGrid>
              <p className="mt-8 text-center">
                <Button to="/blog" variant="outline">
                  Read all articles
                </Button>
              </p>
            </Section>
          )}

          {faq.length > 0 && <FaqSection items={faq} />}
        </>
      )}

      <ContactStrip />
    </>
  );
}
