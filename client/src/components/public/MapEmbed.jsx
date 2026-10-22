import { useState } from 'react';
import { MapPin } from 'lucide-react';

const FRAME = 'relative overflow-hidden rounded-3xl bg-brand-50 shadow-lg shadow-brand-900/10 ring-1 ring-slate-200';

/**
 * Google Map for a location. With `instant` the (lazy-loaded) iframe is rendered right away;
 * otherwise a lightweight placeholder is shown and the map loads on click, which keeps
 * the footer from adding third-party weight to every page.
 * The frame fills whatever height `className` gives it.
 */
export default function MapEmbed({ location, instant = false, className = 'h-56' }) {
  const [loaded, setLoaded] = useState(instant);
  if (!location.mapEmbedUrl) return null;

  if (!loaded) {
    return (
      <button
        type="button"
        onClick={() => setLoaded(true)}
        className={`flex w-full flex-col items-center justify-center gap-2 rounded-3xl bg-slate-800 text-sm text-slate-200 transition hover:bg-slate-700 ${className}`}
      >
        <MapPin className="h-6 w-6" aria-hidden="true" />
        <span>Show map: {location.name}</span>
      </button>
    );
  }

  return (
    <div className={`${FRAME} ${className}`}>
      {/* sits behind the map so the frame never looks empty while it loads */}
      <div aria-hidden="true" className="absolute inset-0 grid place-items-center">
        <MapPin className="h-10 w-10 text-brand-300 motion-safe:animate-pulse" />
      </div>
      <iframe
        title={`Map of ${location.name}`}
        src={location.mapEmbedUrl}
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        className="relative h-full w-full border-0"
      />
    </div>
  );
}
