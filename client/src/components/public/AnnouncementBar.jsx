import { useState } from 'react';
import { Link } from 'react-router-dom';
import { X } from 'lucide-react';
import { useSite } from '../../context/SiteContext.jsx';

export default function AnnouncementBar() {
  const { settings } = useSite();
  const [dismissed, setDismissed] = useState(false);
  const { enabled, text, link } = settings.announcement || {};

  if (!enabled || !text || dismissed) return null;

  const message = link ? (
    <Link to={link} className="underline underline-offset-2 hover:no-underline">
      {text}
    </Link>
  ) : (
    text
  );

  return (
    <div className="bg-brand-800 text-sm text-white">
      <div className="mx-auto flex max-w-7xl items-center justify-center gap-3 px-4 py-2 text-center">
        <p>{message}</p>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          aria-label="Dismiss announcement"
          className="rounded-full p-1 hover:bg-white/15"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
