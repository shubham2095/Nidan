import { useState } from 'react';
import { ExternalLink, MapPin } from 'lucide-react';

/**
 * Google Map for a location. With `instant` the (lazy-loaded) iframe is rendered right away;
 * otherwise a lightweight placeholder is shown and the map loads on click, which keeps
 * the footer from adding third-party weight to every page.
 */
export default function MapEmbed({ location, instant = false, className = 'h-56' }) {
  const [loaded, setLoaded] = useState(instant);
  if (!location.mapEmbedUrl) return null;

  if (!loaded) {
    return (
      <button
        type="button"
        onClick={() => setLoaded(true)}
        className={`flex w-full flex-col items-center justify-center gap-2 rounded-2xl bg-slate-800 text-sm text-slate-200 transition hover:bg-slate-700 ${className}`}
      >
        <MapPin className="h-6 w-6" aria-hidden="true" />
        <span>Show map: {location.name}</span>
      </button>
    );
  }

  return (
    <div className="space-y-2">
      <iframe
        title={`Map of ${location.name}`}
        src={location.mapEmbedUrl}
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        className={`w-full rounded-2xl border-0 ${className}`}
      />
      {location.mapUrl && (
        <a
          href={location.mapUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-sm font-medium text-brand-700 hover:underline"
        >
          Open in Google Maps <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
        </a>
      )}
    </div>
  );
}
