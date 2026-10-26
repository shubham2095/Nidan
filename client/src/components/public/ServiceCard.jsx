import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import Icon from './Icon.jsx';

/** Picture (or icon) for a service; the same pair the home page card and the Services page card use. */
function Picture({ service, className, iconClassName }) {
  if (service.imageUrl) {
    return <img src={service.imageUrl} alt="" loading="lazy" decoding="async" width="96" height="96" className={className} />;
  }
  return (
    <span className={`grid place-items-center bg-brand-50 text-brand-700 transition group-hover:bg-brand-700 group-hover:text-white ${iconClassName}`}>
      <Icon name={service.icon} className="h-1/2 w-1/2" />
    </span>
  );
}

/**
 * One service as a link card. The default is the compact card used on the home page; `number` (1, 2, 3...) switches to the
 * larger Services page card, with a tinted header, the picture and a numbered corner.
 */
export default function ServiceCard({ service, number }) {
  if (number === undefined) {
    return (
      // on phones the picture sits beside the text, which keeps a list of twelve services short; from sm up it stacks
      <Link
        to={`/services/${service.slug}`}
        className="group flex h-full items-start gap-4 rounded-3xl border border-slate-100 bg-white p-4 shadow-sm transition hover:-translate-y-1 hover:border-brand-200 hover:shadow-lg sm:flex-col sm:items-stretch sm:gap-0 sm:p-6"
      >
        {service.imageUrl ? (
          <img src={service.imageUrl} alt="" loading="lazy" decoding="async" width="64" height="64" className="h-14 w-14 shrink-0 rounded-full object-cover ring-4 ring-brand-50 transition group-hover:ring-brand-200 sm:h-16 sm:w-16" />
        ) : (
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-brand-50 text-brand-700 transition group-hover:bg-brand-700 group-hover:text-white">
            <Icon name={service.icon} className="h-6 w-6" />
          </span>
        )}
        <div className="flex min-w-0 flex-1 flex-col">
          <h3 className="text-lg font-bold sm:mt-4 sm:text-xl">{service.name}</h3>
          <p className="mt-1 line-clamp-3 flex-1 text-sm leading-relaxed text-slate-600 sm:mt-2 sm:line-clamp-none">{service.shortDescription}</p>
          <span className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-brand-700 sm:mt-4">
            Learn more
            <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" aria-hidden="true" />
          </span>
        </div>
      </Link>
    );
  }

  return (
    // phones: picture beside the text (short list); from sm up: a tinted header with the picture, then the text
    <Link
      to={`/services/${service.slug}`}
      className="group relative flex h-full items-start gap-4 overflow-hidden rounded-3xl border border-slate-100 bg-white p-4 shadow-sm transition duration-300 hover:-translate-y-1.5 hover:border-brand-200 hover:shadow-xl hover:shadow-brand-900/10 sm:flex-col sm:items-stretch sm:gap-0 sm:p-0"
    >
      <div className="shrink-0 sm:flex sm:items-center sm:justify-between sm:bg-gradient-to-br sm:from-brand-50 sm:via-white sm:to-blush-50 sm:px-6 sm:pt-6 sm:pb-5">
        <Picture
          service={service}
          className="h-16 w-16 rounded-full object-cover shadow-md ring-4 ring-white transition duration-300 group-hover:scale-105 sm:h-24 sm:w-24"
          iconClassName="h-16 w-16 rounded-full shadow-md ring-4 ring-white sm:h-24 sm:w-24"
        />
        <span aria-hidden="true" className="hidden font-heading text-5xl font-extrabold text-brand-100 transition-colors duration-300 group-hover:text-brand-200 sm:block">
          {String(number).padStart(2, '0')}
        </span>
      </div>

      <div className="flex min-w-0 flex-1 flex-col sm:px-6 sm:pt-5 sm:pb-6">
        <h3 className="text-lg font-extrabold sm:text-xl">{service.name}</h3>
        <p className="mt-1.5 line-clamp-3 flex-1 text-sm leading-relaxed text-slate-600 sm:line-clamp-none">{service.shortDescription}</p>
        <span className="mt-3 flex items-center justify-between text-sm font-semibold text-brand-700 sm:mt-5 sm:border-t sm:border-slate-100 sm:pt-4">
          Learn more
          <span className="grid h-8 w-8 place-items-center rounded-full bg-brand-50 text-brand-700 transition duration-300 group-hover:translate-x-0.5 group-hover:bg-brand-700 group-hover:text-white">
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </span>
        </span>
      </div>
    </Link>
  );
}
