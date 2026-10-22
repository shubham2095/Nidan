import { useCallback, useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { CalendarCheck, Menu } from 'lucide-react';
import { useSite } from '../../context/SiteContext.jsx';
import Button from './Button.jsx';
import Container from './Container.jsx';
import Logo from './Logo.jsx';
import MobileMenu from './MobileMenu.jsx';
import TopBar from './TopBar.jsx';
import { NAV_LINKS } from './navLinks.js';

export default function Header() {
  const { clinic } = useSite();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { pathname } = useLocation();
  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    close();
  }, [pathname, close]);

  // Once the page has moved, the header gets a soft shadow and becomes a little slimmer.
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <>
      <TopBar />
      <header className={`sticky top-0 z-40 border-b backdrop-blur transition-all duration-300 ${scrolled ? 'border-slate-200/70 bg-white/95 shadow-lg shadow-slate-900/5' : 'border-slate-100 bg-white/90'}`}>
        <Container className={`flex items-center justify-between gap-4 transition-all duration-300 ${scrolled ? 'h-16 lg:h-[4.5rem]' : 'h-16 lg:h-20'}`}>
          <Link to="/" aria-label={`${clinic.name} home`} className="shrink-0">
            <Logo className={`transition-all duration-300 ${scrolled ? 'h-11 lg:h-14' : 'h-12 lg:h-16'}`} />
          </Link>

          <nav aria-label="Main" className="hidden items-center gap-0.5 xl:flex">
            {NAV_LINKS.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                className={({ isActive }) => `group relative rounded-full px-3.5 py-2 text-sm font-bold transition-colors ${isActive ? 'text-brand-800' : 'text-slate-600 hover:text-brand-700'}`}
              >
                {({ isActive }) => (
                  <>
                    {link.label}
                    <span
                      aria-hidden="true"
                      className={`absolute inset-x-3.5 bottom-0 h-0.5 origin-left rounded-full bg-gradient-to-r from-brand-600 to-blush-400 transition-transform duration-300 ${isActive ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'}`}
                    />
                  </>
                )}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <div className="hidden sm:block">
              <Button to="/book-appointment" variant="gradient" className="!px-6">
                <CalendarCheck className="h-4 w-4" aria-hidden="true" />
                Book Appointment
              </Button>
            </div>
            <button
              type="button"
              onClick={() => setOpen(true)}
              aria-expanded={open}
              aria-controls="mobile-menu"
              aria-label="Open menu"
              className="grid h-11 w-11 place-items-center rounded-full border border-slate-200 text-slate-700 transition hover:border-brand-200 hover:bg-brand-50 hover:text-brand-800 xl:hidden"
            >
              <Menu className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
        </Container>
      </header>

      <MobileMenu open={open} onClose={close} />
    </>
  );
}
