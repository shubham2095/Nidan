import { Link } from 'react-router-dom';
import { Mail, MapPin, Phone } from 'lucide-react';
import { useSite } from '../../context/SiteContext.jsx';
import { telHref } from '../../utils/format.js';
import Container from './Container.jsx';
import Logo from './Logo.jsx';
import MapEmbed from './MapEmbed.jsx';
import { FacebookIcon, InstagramIcon, YoutubeIcon } from './SocialIcons.jsx';
import { NAV_LINKS } from './navLinks.js';

const SOCIAL = [
  { key: 'instagram', label: 'Instagram', Icon: InstagramIcon },
  { key: 'facebook', label: 'Facebook', Icon: FacebookIcon },
  { key: 'youtube', label: 'YouTube', Icon: YoutubeIcon },
];

export default function Footer() {
  const { clinic, social, ownClinics } = useSite();

  return (
    <footer className="bg-slate-900 text-slate-300">
      <Container className="grid gap-10 py-14 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <Logo tone="light" />
          <p className="mt-4 max-w-sm text-sm leading-relaxed">{clinic.tagline}</p>
          <div className="mt-5 flex gap-3">
            {SOCIAL.filter(({ key }) => social[key]).map(({ key, label, Icon }) => (
              <a
                key={key}
                href={social[key]}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${clinic.name} on ${label}`}
                className="grid h-10 w-10 place-items-center rounded-full bg-slate-800 text-slate-200 transition hover:bg-brand-700"
              >
                <Icon />
              </a>
            ))}
          </div>
        </div>

        <nav aria-label="Footer" className="lg:col-span-2">
          <h2 className="mb-4 font-heading text-base font-bold text-white">Explore</h2>
          <ul className="space-y-2 text-sm">
            {[...NAV_LINKS.slice(1), { to: '/book-appointment', label: 'Book Appointment' }].map((link) => (
              <li key={link.to}>
                <Link to={link.to} className="hover:text-white hover:underline">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="space-y-6 lg:col-span-6">
          <h2 className="font-heading text-base font-bold text-white">Visit us</h2>
          <div className="grid gap-6 sm:grid-cols-2">
            {ownClinics.map((location) => (
              <div key={location.id} className="space-y-3">
                <p className="flex gap-2 text-sm">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-blush-300" aria-hidden="true" />
                  <span>
                    <strong className="block text-white">{location.name}</strong>
                    {location.address}, {location.city}, {location.state}
                    {location.postalCode && ` ${location.postalCode}`}
                  </span>
                </p>
                <MapEmbed location={location} className="h-40" />
              </div>
            ))}
          </div>
          <ul className="space-y-2 text-sm">
            <li className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-blush-300" aria-hidden="true" />
              <a href={telHref(clinic.phonePrimary)} className="hover:text-white hover:underline">
                {clinic.phonePrimary}
              </a>
              {clinic.phoneSecondary && (
                <>
                  <span aria-hidden="true">|</span>
                  <a href={telHref(clinic.phoneSecondary)} className="hover:text-white hover:underline">
                    {clinic.phoneSecondary}
                  </a>
                </>
              )}
            </li>
            <li className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-blush-300" aria-hidden="true" />
              <a href={`mailto:${clinic.email}`} className="hover:text-white hover:underline">
                {clinic.email}
              </a>
            </li>
          </ul>
        </div>
      </Container>

      <div className="border-t border-slate-800">
        <Container className="flex flex-col items-center justify-between gap-2 py-5 text-xs text-slate-400 sm:flex-row">
          <p>
            © {new Date().getFullYear()} {clinic.name}. All rights reserved.
          </p>
          <Link to="/privacy-policy" className="hover:text-white hover:underline">
            Privacy Policy
          </Link>
        </Container>
      </div>
    </footer>
  );
}
