import { useEffect, useRef } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { CalendarCheck, ChevronRight, MapPin, MessageCircle, Phone, X } from 'lucide-react';
import { useSite } from '../../context/SiteContext.jsx';
import { telHref, whatsappHref } from '../../utils/format.js';
import Button from './Button.jsx';
import Logo from './Logo.jsx';
import { SOCIAL_LINKS as SOCIAL } from './SocialIcons.jsx';
import { NAV_LINKS } from './navLinks.js';

const FOCUSABLE = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Slide-in menu for phones and tablets. Escape or a tap outside closes it, the page behind does not scroll,
 * and keyboard focus stays inside while it is open and returns to the menu button afterwards.
 */
export default function MobileMenu({ open, onClose }) {
  const { clinic, social, ownClinics } = useSite();
  const panel = useRef(null);
  const closeButton = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const previous = document.activeElement;
    document.body.style.overflow = 'hidden';
    closeButton.current?.focus();

    const onKey = (event) => {
      if (event.key === 'Escape') {
        onClose();
        return;
      }
      if (event.key !== 'Tab' || !panel.current) return;
      const items = [...panel.current.querySelectorAll(FOCUSABLE)];
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', onKey);
      previous?.focus?.();
    };
  }, [open, onClose]);

  return (
    <div
      className={`fixed inset-0 z-50 transition-[visibility] xl:hidden ${open ? 'visible delay-0' : 'invisible delay-300'}`}
      aria-hidden={!open}
    >
      <div onClick={onClose} className={`absolute inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity duration-300 ${open ? 'opacity-100' : 'opacity-0'}`} />

      <div
        ref={panel}
        id="mobile-menu"
        role="dialog"
        aria-modal="true"
        aria-label="Menu"
        className={`absolute inset-y-0 right-0 flex w-[88%] max-w-sm flex-col overflow-y-auto bg-white shadow-2xl transition-transform duration-300 ease-out ${open ? 'translate-x-0' : 'translate-x-full'}`}
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
          <Link to="/" onClick={onClose} aria-label={`${clinic.name} home`}>
            <Logo className="h-12" />
          </Link>
          <button ref={closeButton} type="button" onClick={onClose} aria-label="Close menu" className="grid h-11 w-11 place-items-center rounded-full border border-slate-200 text-slate-700 transition hover:bg-slate-100">
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <nav aria-label="Mobile" className="px-3 py-4">
          <ul className="space-y-1">
            {NAV_LINKS.map((link) => (
              <li key={link.to}>
                <NavLink
                  to={link.to}
                  end={link.end}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `flex items-center justify-between rounded-2xl px-4 py-3.5 text-base font-semibold transition-colors ${
                      isActive ? 'bg-brand-50 text-brand-800 ring-1 ring-brand-100' : 'text-slate-700 hover:bg-slate-50'
                    }`
                  }
                >
                  {link.label}
                  <ChevronRight className="h-4 w-4 text-slate-400" aria-hidden="true" />
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="mt-auto space-y-3 border-t border-slate-100 bg-brand-50/50 px-5 py-5">
          <Button to="/book-appointment" variant="gradient" size="lg" className="w-full" onClick={onClose}>
            <CalendarCheck className="h-5 w-5" aria-hidden="true" />
            Book Appointment
          </Button>
          <div className="grid grid-cols-2 gap-3">
            <Button href={telHref(clinic.phonePrimary)} variant="outline">
              <Phone className="h-4 w-4" aria-hidden="true" />
              Call
            </Button>
            <Button href={whatsappHref(clinic.whatsappNumber, `Hello ${clinic.name}, I would like some information.`)} target="_blank" rel="noopener noreferrer" variant="whatsapp">
              <MessageCircle className="h-4 w-4" aria-hidden="true" />
              WhatsApp
            </Button>
          </div>

          <ul className="space-y-2 pt-1 text-sm text-slate-600">
            {ownClinics.map((location) => (
              <li key={location.id} className="flex items-start gap-2">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-blush-500" aria-hidden="true" />
                <span>
                  {ownClinics.length > 1 && <strong className="block font-semibold text-slate-800">{location.name}</strong>}
                  {location.address}, {location.city} {location.postalCode}
                </span>
              </li>
            ))}
          </ul>

          {SOCIAL.some(({ key }) => social[key]) && (
            <div className="flex gap-2 pt-1">
              {SOCIAL.filter(({ key }) => social[key]).map(({ key, label, Icon }) => (
                <a
                  key={key}
                  href={social[key]}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`${clinic.name} on ${label}`}
                  title={label}
                  className="grid h-10 w-10 place-items-center rounded-full bg-white text-brand-700 shadow-sm ring-1 ring-slate-200 transition hover:bg-brand-700 hover:text-white"
                >
                  <Icon />
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
