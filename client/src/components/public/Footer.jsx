import { Link } from 'react-router-dom';
import { ArrowRight, CalendarCheck, Clock, Mail, MapPin, MessageCircle, Navigation, Phone, Stethoscope } from 'lucide-react';
import { useSite } from '../../context/SiteContext.jsx';
import { compactHours, telHref, whatsappHref } from '../../utils/format.js';
import { groupSchedule } from '../../utils/schedule.js';
import Button from './Button.jsx';
import Container from './Container.jsx';
import Logo from './Logo.jsx';
import Reveal from './Reveal.jsx';
import { SOCIAL_LINKS as SOCIAL } from './SocialIcons.jsx';
import { NAV_LINKS } from './navLinks.js';

const MAX_SERVICE_LINKS = 7;
// py-2 on phones gives thumbs a taller target without changing how the list looks
const link = 'inline-flex items-center gap-1.5 py-2 text-brand-100 transition hover:text-white hover:underline hover:underline-offset-4 sm:py-1';
const label = 'text-[11px] font-bold tracking-wider text-blush-200 uppercase';

function ColumnTitle({ children }) {
  return (
    <>
      <h2 className="font-heading text-base font-extrabold tracking-wide text-white">{children}</h2>
      <span aria-hidden="true" className="mt-2 mb-5 block h-0.5 w-8 rounded-full bg-blush-300" />
    </>
  );
}

function IconTile({ children }) {
  return <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white/10 text-blush-200">{children}</span>;
}

/** "Mon–Fri · 8:30 am – 1:30 pm" lines for one doctor's slots at one clinic. */
const timingLines = (slots) => groupSchedule(slots).map(({ days, time }) => ({ days, time: compactHours(time) }));

/** Doctors whose timings are identical are listed together: [{ names: ['Dr. A', 'Dr. B'], lines: [...] }]. */
function groupDoctors(doctors = []) {
  const groups = [];
  for (const doctor of doctors) {
    const lines = timingLines(doctor.slots);
    const key = lines.map((line) => `${line.days}|${line.time}`).join(';');
    const group = groups.find((item) => item.key === key);
    if (group) group.names.push(doctor.name);
    else groups.push({ key, names: [doctor.name], lines });
  }
  return groups;
}

/** One clinic: address, how to get there, and which doctors sit there and when. */
function ClinicCard({ location, phone }) {
  const doctorGroups = groupDoctors(location.doctors);

  return (
    <article className="flex h-full flex-col rounded-3xl bg-white/5 p-5 ring-1 ring-white/10 transition duration-300 hover:bg-white/[0.07] sm:p-6">
      <div className="flex items-start gap-3">
        <IconTile>
          <MapPin className="h-4 w-4" aria-hidden="true" />
        </IconTile>
        <div>
          <h3 className="font-heading text-base leading-snug font-extrabold text-white">{location.name}</h3>
          <p className="mt-1 leading-relaxed">
            {location.address}, {location.city}, {location.state}
            {location.postalCode && ` ${location.postalCode}`}
          </p>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-2.5">
        {location.mapUrl && (
          <a
            href={location.mapUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2.5 text-[13px] font-semibold text-brand-800 shadow-sm transition hover:bg-brand-50"
          >
            <Navigation className="h-4 w-4" aria-hidden="true" />
            Get directions
          </a>
        )}
        <a
          href={telHref(phone)}
          className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2.5 text-[13px] font-semibold text-white transition hover:bg-white/20"
        >
          <Phone className="h-4 w-4" aria-hidden="true" />
          Call
        </a>
      </div>

      {doctorGroups.length > 0 && (
        <div className="mt-5">
          <p className={`mb-2 ${label}`}>Doctor timings</p>
          <ul className="space-y-3">
            {doctorGroups.map((group) => (
              <li key={group.key}>
                <p className="flex items-center gap-2 font-semibold text-white">
                  <Stethoscope className="h-4 w-4 shrink-0 text-blush-300" aria-hidden="true" />
                  {group.names.join(' & ')}
                </p>
                <ul className="mt-1 space-y-0.5 pl-6">
                  {group.lines.map((line) => (
                    <li key={`${line.days}-${line.time}`} className="flex items-start gap-2">
                      <Clock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-blush-300" aria-hidden="true" />
                      <span>
                        <span className="font-semibold text-white">{line.days}</span> · {line.time}
                      </span>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        </div>
      )}
    </article>
  );
}

export default function Footer() {
  const { clinic, social, ownClinics, serviceLinks } = useSite();
  const shownServices = serviceLinks.slice(0, MAX_SERVICE_LINKS);

  return (
    <footer className="relative overflow-hidden bg-brand-900 text-sm text-brand-100">
      <div aria-hidden="true" className="h-1.5 bg-gradient-to-r from-blush-300 via-brand-400 to-blush-300" />
      <div aria-hidden="true" className="pointer-events-none absolute -top-28 -right-24 h-96 w-96 rounded-full bg-brand-600/30 blur-3xl" />
      <div aria-hidden="true" className="pointer-events-none absolute -bottom-32 -left-24 h-80 w-80 rounded-full bg-blush-400/10 blur-3xl" />

      <Reveal variant="fade" distance={24}>
        <Container className="relative py-14 lg:py-16">
          <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-12 lg:gap-10">
            <div className="sm:col-span-2 lg:col-span-4">
              <Logo tone="light" className="h-16" />
              <p className="mt-5 max-w-sm text-[15px] leading-relaxed text-brand-100">{clinic.tagline}</p>
              <div className="mt-6 flex flex-wrap items-center gap-3">
                <Button to="/book-appointment" variant="light">
                  <CalendarCheck className="h-4 w-4" aria-hidden="true" />
                  Book Appointment
                </Button>
                <Button href={whatsappHref(clinic.whatsappNumber, `Hello ${clinic.name}, I would like some information.`)} target="_blank" rel="noopener noreferrer" variant="whatsapp">
                  <MessageCircle className="h-4 w-4" aria-hidden="true" />
                  WhatsApp
                </Button>
              </div>
              {SOCIAL.some(({ key }) => social[key]) && (
                <div className="mt-6 flex gap-3">
                  {SOCIAL.filter(({ key }) => social[key]).map(({ key, label: name, Icon }) => (
                    <a
                      key={key}
                      href={social[key]}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`${clinic.name} on ${name}`}
                      title={name}
                      className="grid h-10 w-10 place-items-center rounded-full bg-white/10 text-white transition hover:-translate-y-0.5 hover:bg-blush-500"
                    >
                      <Icon />
                    </a>
                  ))}
                </div>
              )}
            </div>

            <nav aria-label="Footer" className="lg:col-span-2">
              <ColumnTitle>Explore</ColumnTitle>
              <ul className="space-y-1">
                {[...NAV_LINKS.slice(1), { to: '/book-appointment', label: 'Book Appointment' }].map((item) => (
                  <li key={item.to}>
                    <Link to={item.to} className={link}>
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>

            {shownServices.length > 0 && (
              <nav aria-label="Services" className="lg:col-span-3">
                <ColumnTitle>Our services</ColumnTitle>
                <ul className="space-y-1">
                  {shownServices.map((service) => (
                    <li key={service.slug}>
                      <Link to={`/services/${service.slug}`} className={link}>
                        {service.name}
                      </Link>
                    </li>
                  ))}
                  <li className="pt-1">
                    <Link to="/services" className="inline-flex items-center gap-1.5 py-1 font-semibold text-blush-200 transition hover:text-white">
                      View all services
                      <ArrowRight className="h-4 w-4" aria-hidden="true" />
                    </Link>
                  </li>
                </ul>
              </nav>
            )}

            <div className={shownServices.length > 0 ? 'lg:col-span-3' : 'lg:col-span-6'}>
              <ColumnTitle>Get in touch</ColumnTitle>
              <ul className="space-y-4">
                <li className="flex gap-3">
                  <IconTile>
                    <Phone className="h-4 w-4" aria-hidden="true" />
                  </IconTile>
                  <span className="leading-relaxed">
                    <a href={telHref(clinic.phonePrimary)} className="inline-block py-0.5 font-semibold text-white hover:underline">
                      {clinic.phonePrimary}
                    </a>
                    {clinic.phoneSecondary && (
                      <>
                        <br />
                        <a href={telHref(clinic.phoneSecondary)} className="inline-block py-0.5 text-brand-100 hover:text-white hover:underline">
                          {clinic.phoneSecondary}
                        </a>
                      </>
                    )}
                  </span>
                </li>
                {clinic.email && (
                  <li className="flex gap-3">
                    <IconTile>
                      <Mail className="h-4 w-4" aria-hidden="true" />
                    </IconTile>
                    <a href={`mailto:${clinic.email}`} className="min-w-0 self-center py-1 break-words text-brand-100 hover:text-white hover:underline">
                      {clinic.email.includes('@') ? (
                        <>
                          {clinic.email.split('@')[0]}@<wbr />
                          {clinic.email.split('@')[1]}
                        </>
                      ) : (
                        clinic.email
                      )}
                    </a>
                  </li>
                )}
              </ul>
            </div>
          </div>

          {ownClinics.length > 0 && (
            <div className="mt-12 border-t border-white/10 pt-10 lg:mt-14">
              <ColumnTitle>{ownClinics.length === 1 ? 'Our clinic' : 'Our clinics'}</ColumnTitle>
              <div className={`grid gap-5 ${ownClinics.length > 1 ? 'md:grid-cols-2' : 'max-w-xl'}`}>
                {ownClinics.map((location) => (
                  <ClinicCard key={location.id} location={location} phone={clinic.phonePrimary} />
                ))}
              </div>
            </div>
          )}
        </Container>
      </Reveal>

      <div className="relative border-t border-white/10">
        {/* extra room at the bottom and right keeps the floating call / WhatsApp button off the text */}
        <Container className="flex flex-col items-center justify-between gap-1 pt-4 pb-24 text-center text-xs text-brand-200 lg:flex-row lg:py-4 lg:pr-28 lg:text-left">
          <div className="flex flex-col items-center gap-x-5 sm:flex-row">
            <p>
              © {new Date().getFullYear()} {clinic.name}. All rights reserved.
            </p>
            <Link to="/privacy-policy" className="inline-block py-2 hover:text-white hover:underline">
              Privacy Policy
            </Link>
          </div>
          <p>
            Powered by{' '}
            <a
              href="https://heltog.com"
              target="_blank"
              rel="noopener noreferrer"
              className="font-bold text-gold-400 [text-shadow:0_0_14px_rgba(233,185,73,0.4)] underline-offset-4 transition hover:text-gold-300 hover:underline"
            >
              Heltog Technologies Pvt. LTD.
              <span className="sr-only"> (opens in a new tab)</span>
            </a>
          </p>
        </Container>
      </div>
    </footer>
  );
}
