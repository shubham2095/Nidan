import { Mail, MapPin, Phone } from 'lucide-react';
import { useSite } from '../../context/SiteContext.jsx';
import { clinicsLabel, telHref } from '../../utils/format.js';
import Container from './Container.jsx';
import { SOCIAL_LINKS as SOCIAL } from './SocialIcons.jsx';

/** Slim strip above the header on larger screens: where we are and how to reach us. */
export default function TopBar() {
  const { clinic, social, ownClinics } = useSite();
  const [place] = ownClinics;
  // with several clinics the strip says how many; with one it names the area ("Basement B, 170, Block B, Sector 51" -> "Sector 51")
  const area = place && (ownClinics.length > 1 ? clinicsLabel(ownClinics) : `${place.address.split(',').pop().trim()}, ${place.city}`);
  const item = 'flex items-center gap-2 whitespace-nowrap';

  return (
    <div className="hidden bg-brand-900 text-[13px] text-brand-50 lg:block">
      <Container className="flex h-10 items-center justify-between gap-6">
        <ul className="flex min-w-0 items-center gap-6">
          {area && (
            <li className={item}>
              <MapPin className="h-4 w-4 text-blush-300" aria-hidden="true" />
              {area}
            </li>
          )}
        </ul>

        <ul className="flex items-center gap-5">
          <li className={item}>
            <Phone className="h-4 w-4 text-blush-300" aria-hidden="true" />
            <a href={telHref(clinic.phonePrimary)} className="font-semibold hover:text-white hover:underline">
              {clinic.phonePrimary}
            </a>
          </li>
          {clinic.email && (
            <li className={`${item} hidden xl:flex`}>
              <Mail className="h-4 w-4 text-blush-300" aria-hidden="true" />
              <a href={`mailto:${clinic.email}`} className="hover:text-white hover:underline">
                {clinic.email}
              </a>
            </li>
          )}
          {SOCIAL.some(({ key }) => social[key]) && (
            <li className="flex items-center gap-1.5 border-l border-white/20 pl-5">
              {SOCIAL.filter(({ key }) => social[key]).map(({ key, label, Icon }) => (
                <a
                  key={key}
                  href={social[key]}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`${clinic.name} on ${label}`}
                  title={label}
                  className="grid h-7 w-7 place-items-center rounded-full bg-white/10 transition hover:bg-blush-500 hover:text-white"
                >
                  <Icon />
                </a>
              ))}
            </li>
          )}
        </ul>
      </Container>
    </div>
  );
}
