import { useEffect, useId, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Headset, MessageCircle, Phone, X } from 'lucide-react';
import { useSite } from '../../context/SiteContext.jsx';
import { telHref, whatsappHref } from '../../utils/format.js';

const PILL_MOTION = 'origin-bottom-right transition-[opacity,translate,scale,visibility,box-shadow] duration-300 ease-out';

/** One pill in the open menu: a coloured icon, a title and a small line of detail. */
function Pill({ href, icon: Icon, tone, title, detail, open, delay, onClick, external = false }) {
  return (
    <a
      href={href}
      {...(external && { target: '_blank', rel: 'noopener noreferrer' })}
      onClick={onClick}
      style={{ transitionDelay: open ? `${delay}ms` : '0ms' }}
      className={`${PILL_MOTION} flex items-center gap-3 rounded-full bg-white py-2 pr-6 pl-2 shadow-xl ring-1 shadow-slate-900/15 ring-slate-900/5 hover:shadow-2xl hover:shadow-slate-900/20 ${
        open ? 'visible translate-y-0 scale-100 opacity-100' : 'invisible translate-y-4 scale-90 opacity-0'
      }`}
    >
      <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-full text-white shadow-md ${tone}`}>
        <Icon className="h-5 w-5" aria-hidden="true" />
      </span>
      <span className="text-left leading-tight">
        <span className="block text-[15px] font-bold text-slate-900">{title}</span>
        <span className="block text-xs text-slate-500">{detail}</span>
      </span>
    </a>
  );
}

/**
 * One round button that stays in reach while scrolling. Tapping it opens two pills:
 * "Call now" and "WhatsApp message". Esc, tapping outside, or picking a pill closes them again.
 */
export default function FloatingActions() {
  const { clinic } = useSite();
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const button = useRef(null);
  const menuId = useId();

  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (event) => {
      if (event.key !== 'Escape') return;
      setOpen(false);
      button.current?.focus();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  const close = () => setOpen(false);

  return (
    <div className="fixed right-4 bottom-4 z-40 flex flex-col-reverse items-end gap-3 sm:right-6 sm:bottom-6">
      {/* soft shade behind the menu; tapping it closes the menu */}
      <div
        aria-hidden="true"
        onClick={close}
        className={`fixed inset-0 -z-10 bg-slate-900/30 backdrop-blur-[2px] transition-opacity duration-300 ${open ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
      />

      <button
        ref={button}
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-controls={menuId}
        aria-label={open ? 'Close contact options' : 'Contact us: call or WhatsApp'}
        className="group relative grid h-14 w-14 place-items-center sm:h-[3.75rem] sm:w-[3.75rem] rounded-full bg-gradient-to-br from-brand-700 to-brand-500 text-white shadow-xl ring-4 shadow-brand-700/40 ring-white/90 transition duration-300 hover:scale-105 hover:shadow-2xl active:scale-95 focus-visible:outline-offset-4"
      >
        {/* a slow ring draws the eye while the menu is closed, without being noisy */}
        {!open && <span aria-hidden="true" className="anim-ping absolute inset-0 rounded-full bg-brand-500/50" />}
        <span className="relative block h-7 w-7">
          <Headset className={`absolute inset-0 h-7 w-7 transition duration-300 ${open ? 'scale-50 rotate-90 opacity-0' : ''}`} aria-hidden="true" />
          <X className={`absolute inset-0 h-7 w-7 transition duration-300 ${open ? '' : 'scale-50 -rotate-90 opacity-0'}`} aria-hidden="true" />
        </span>
      </button>

      <div id={menuId} role="group" aria-label="Contact options" className="flex flex-col items-end gap-3">
        <Pill
          href={telHref(clinic.phonePrimary)}
          icon={Phone}
          tone="bg-gradient-to-br from-brand-700 to-brand-500"
          title="Call now"
          detail={clinic.phonePrimary}
          open={open}
          delay={70}
          onClick={close}
        />
        <Pill
          href={whatsappHref(clinic.whatsappNumber, `Hello ${clinic.name}, I would like some information.`)}
          icon={MessageCircle}
          tone="bg-gradient-to-br from-emerald-700 to-emerald-500"
          title="WhatsApp message"
          detail="Chat with us"
          external
          open={open}
          delay={0}
          onClick={close}
        />
      </div>
    </div>
  );
}
