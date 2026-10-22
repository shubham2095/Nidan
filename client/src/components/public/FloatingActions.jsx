import { MessageCircle, Phone } from 'lucide-react';
import { useSite } from '../../context/SiteContext.jsx';
import { telHref, whatsappHref } from '../../utils/format.js';

/** Call (mobile only) and WhatsApp buttons that stay in reach while scrolling. */
export default function FloatingActions() {
  const { clinic } = useSite();
  const buttonBase =
    'grid h-14 w-14 place-items-center rounded-full text-white shadow-lg ring-4 ring-white/80 transition hover:scale-105';

  return (
    <div className="fixed right-4 bottom-4 z-30 flex flex-col gap-3 sm:right-6 sm:bottom-6">
      <a
        href={telHref(clinic.phonePrimary)}
        aria-label={`Call ${clinic.name}`}
        className={`${buttonBase} bg-brand-700 md:hidden`}
      >
        <Phone className="h-6 w-6" aria-hidden="true" />
      </a>
      <span className="relative block">
        {/* a slow ring around the WhatsApp button draws the eye without being noisy */}
        <span aria-hidden="true" className="anim-ping absolute inset-0 rounded-full bg-emerald-600/50" />
        <a
          href={whatsappHref(clinic.whatsappNumber, `Hello ${clinic.name}, I would like some information.`)}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Chat with us on WhatsApp"
          className={`${buttonBase} relative bg-emerald-700`}
        >
          <MessageCircle className="h-6 w-6" aria-hidden="true" />
        </a>
      </span>
    </div>
  );
}
