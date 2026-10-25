import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import Icon from './Icon.jsx';

export default function ServiceCard({ service }) {
  return (
    // on phones the picture sits beside the text, which keeps a list of twelve services short; from sm up it stacks
    <Link
      to={`/services/${service.slug}`}
      className="group flex h-full items-start gap-4 rounded-3xl border border-slate-100 bg-white p-4 shadow-sm transition hover:-translate-y-1 hover:border-brand-200 hover:shadow-lg sm:flex-col sm:items-stretch sm:gap-0 sm:p-6"
    >
      {service.imageUrl ? (
        <img src={service.imageUrl} alt="" loading="lazy" width="64" height="64" className="h-14 w-14 shrink-0 rounded-full object-cover ring-4 ring-brand-50 transition group-hover:ring-brand-200 sm:h-16 sm:w-16" />
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
