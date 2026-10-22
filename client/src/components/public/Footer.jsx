import { Link } from 'react-router-dom';
import { ArrowRight, ArrowUp, CalendarCheck, Mail, MapPin, MessageCircle, Phone } from 'lucide-react';
import { useSite } from '../../context/SiteContext.jsx';
import { telHref, whatsappHref } from '../../utils/format.js';
import Button from './Button.jsx';
import Container from './Container.jsx';
import Logo from './Logo.jsx';
import OpeningHours from './OpeningHours.jsx';
import { FacebookIcon, InstagramIcon, YoutubeIcon } from './SocialIcons.jsx';
import { NAV_LINKS } from './navLinks.js';

const SOCIAL = [
  { key: 'instagram', label: 'Instagram', Icon: InstagramIcon },
  { key: 'facebook', label: 'Facebook', Icon: FacebookIcon },
  { key: 'youtube', label: 'YouTube', Icon: YoutubeIcon },
];

const MAX_SERVICE_LINKS = 7;
const link = 'inline-flex items-center gap-1.5 text-brand-100 transition hover:text-white hover:underline hover:underline-offset-4';

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

export default function Footer() {
  const { clinic, social, ownClinics, serviceLinks, settings } = useSite();
  const [place] = ownClinics;
  const shownServices = serviceLinks.slice(0, MAX_SERVICE_LINKS);
  const hasHours = (settings.hours || []).length > 0;

  return (
    <footer className="relative overflow-hidden bg-brand-900 text-sm text-brand-100">
      <div aria-hidden="true" className="h-1.5 bg-gradient-to-r from-blush-300 via-brand-400 to-blush-300" />
      <div aria-hidden="true" className="pointer-events-none absolute -top-28 -right-24 h-96 w-96 rounded-full bg-brand-600/30 blur-3xl" />
      <div aria-hidden="true" className="pointer-events-none absolute -bottom-32 -left-24 h-80 w-80 rounded-full bg-blush-400/10 blur-3xl" />

      <Container className="relative grid gap-12 py-14 sm:grid-cols-2 lg:grid-cols-12 lg:gap-10 lg:py-16">
        <div className="sm:col-span-2 lg:col-span-3">
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
              {SOCIAL.filter(({ key }) => social[key]).map(({ key, label, Icon }) => (
                <a
                  key={key}
                  href={social[key]}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`${clinic.name} on ${label}`}
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
          <ul className="space-y-2.5">
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
            <ul className="space-y-2.5">
              {shownServices.map((service) => (
                <li key={service.slug}>
                  <Link to={`/services/${service.slug}`} className={link}>
                    {service.name}
                  </Link>
                </li>
              ))}
              <li className="pt-1">
                <Link to="/services" className="inline-flex items-center gap-1.5 font-semibold text-blush-200 transition hover:text-white">
                  View all services
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </li>
            </ul>
          </nav>
        )}

        <div className={shownServices.length > 0 ? 'lg:col-span-4' : 'lg:col-span-7'}>
          <ColumnTitle>Visit us</ColumnTitle>
          <ul className="space-y-4">
            {place && (
              <li className="flex gap-3">
                <IconTile>
                  <MapPin className="h-4 w-4" aria-hidden="true" />
                </IconTile>
                <span className="leading-relaxed">
                  <strong className="block font-semibold text-white">{place.name}</strong>
                  {place.address}, {place.city}, {place.state}
                  {place.postalCode && ` ${place.postalCode}`}
                  {place.mapUrl && (
                    <>
                      <br />
                      <a href={place.mapUrl} target="_blank" rel="noopener noreferrer" className="font-semibold text-blush-200 hover:text-white hover:underline">
                        Get directions
                      </a>
                    </>
                  )}
                </span>
              </li>
            )}
            <li className="flex gap-3">
              <IconTile>
                <Phone className="h-4 w-4" aria-hidden="true" />
              </IconTile>
              <span className="leading-relaxed">
                <a href={telHref(clinic.phonePrimary)} className="font-semibold text-white hover:underline">
                  {clinic.phonePrimary}
                </a>
                {clinic.phoneSecondary && (
                  <>
                    <br />
                    <a href={telHref(clinic.phoneSecondary)} className="text-brand-100 hover:text-white hover:underline">
                      {clinic.phoneSecondary}
                    </a>
                  </>
                )}
              </span>
            </li>
            <li className="flex gap-3">
              <IconTile>
                <Mail className="h-4 w-4" aria-hidden="true" />
              </IconTile>
              <a href={`mailto:${clinic.email}`} className="min-w-0 self-center break-words text-brand-100 hover:text-white hover:underline">
                {clinic.email}
              </a>
            </li>
          </ul>
          {hasHours && (
            <div className="mt-6 rounded-2xl bg-white/5 p-4 ring-1 ring-white/10">
              <h3 className="mb-3 font-heading text-sm font-extrabold text-white">Opening hours</h3>
              <OpeningHours variant="dark" />
            </div>
          )}
        </div>
      </Container>

      <div className="relative border-t border-white/10">
        {/* extra room at the bottom and right keeps the floating call / WhatsApp buttons off the links */}
        <Container className="flex flex-col items-center justify-between gap-3 pt-5 pb-24 text-xs text-brand-200 sm:flex-row sm:py-5 sm:pr-24 lg:pr-28">
          <p>
            © {new Date().getFullYear()} {clinic.name}. All rights reserved.
          </p>
          <div className="flex items-center gap-5">
            <Link to="/privacy-policy" className="hover:text-white hover:underline">
              Privacy Policy
            </Link>
            <button
              type="button"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3.5 py-1.5 font-semibold text-white transition hover:bg-white/20"
            >
              <ArrowUp className="h-3.5 w-3.5" aria-hidden="true" />
              Back to top
            </button>
          </div>
        </Container>
      </div>
    </footer>
  );
}
