import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { CalendarCheck, Menu, Phone, X } from 'lucide-react';
import { useSite } from '../../context/SiteContext.jsx';
import { telHref } from '../../utils/format.js';
import Button from './Button.jsx';
import Container from './Container.jsx';
import Logo from './Logo.jsx';
import { NAV_LINKS } from './navLinks.js';

const linkClasses = ({ isActive }) =>
  `rounded-full px-3 py-2 text-sm font-semibold transition-colors ${
    isActive ? 'bg-brand-50 text-brand-800' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
  }`;

export default function Header() {
  const { clinic } = useSite();
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <header className="sticky top-0 z-40 border-b border-slate-100 bg-white/90 backdrop-blur">
      <Container className="flex h-16 items-center justify-between gap-4 lg:h-20">
        <Link to="/" aria-label={`${clinic.name} home`}>
          <Logo />
        </Link>

        <nav aria-label="Main" className="hidden items-center gap-1 xl:flex">
          {NAV_LINKS.map((link) => (
            <NavLink key={link.to} to={link.to} end={link.end} className={linkClasses}>
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <a
            href={telHref(clinic.phonePrimary)}
            className="hidden items-center gap-2 rounded-full px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 2xl:flex"
          >
            <Phone className="h-4 w-4 text-brand-700" aria-hidden="true" />
            {clinic.phonePrimary}
          </a>
          <div className="hidden sm:block">
            <Button to="/book-appointment">
              <CalendarCheck className="h-4 w-4" aria-hidden="true" />
              Book Appointment
            </Button>
          </div>
          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? 'Close menu' : 'Open menu'}
            className="grid h-11 w-11 place-items-center rounded-full text-slate-700 hover:bg-slate-100 xl:hidden"
          >
            {open ? <X className="h-6 w-6" aria-hidden="true" /> : <Menu className="h-6 w-6" aria-hidden="true" />}
          </button>
        </div>
      </Container>

      {open && (
        <div id="mobile-menu" className="border-t border-slate-100 bg-white xl:hidden">
          <Container className="space-y-1 py-4">
            <nav aria-label="Mobile" className="grid gap-1">
              {NAV_LINKS.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  end={link.end}
                  className={({ isActive }) =>
                    `rounded-xl px-4 py-3 text-base font-semibold ${
                      isActive ? 'bg-brand-50 text-brand-800' : 'text-slate-700 hover:bg-slate-50'
                    }`
                  }
                >
                  {link.label}
                </NavLink>
              ))}
            </nav>
            <div className="grid gap-2 pt-3">
              <Button to="/book-appointment" size="lg">
                <CalendarCheck className="h-5 w-5" aria-hidden="true" />
                Book Appointment
              </Button>
              <Button href={telHref(clinic.phonePrimary)} variant="outline" size="lg">
                <Phone className="h-5 w-5" aria-hidden="true" />
                Call {clinic.phonePrimary}
              </Button>
            </div>
          </Container>
        </div>
      )}
    </header>
  );
}
