import { Link } from 'react-router-dom';
import { Award } from 'lucide-react';
import Button from './Button.jsx';
import DoctorAvatar from './DoctorAvatar.jsx';
import ScheduleTabs from './ScheduleTabs.jsx';

export default function DoctorCard({ doctor }) {
  const firstName = doctor.name.replace(/^dr\.?\s+/i, '').split(' ')[0];

  return (
    <article className="flex h-full flex-col rounded-3xl border border-slate-100 bg-white p-6 shadow-sm transition hover:shadow-lg sm:p-8">
      <div className="flex items-start gap-5">
        <DoctorAvatar doctor={doctor} size="md" />
        <div className="min-w-0">
          <h3 className="text-2xl font-extrabold">
            <Link to={`/doctors/${doctor.slug}`} className="hover:text-brand-700">
              {doctor.name}
            </Link>
          </h3>
          <p className="font-semibold text-brand-700">{doctor.designation}</p>
          <p className="mt-1 text-sm text-slate-600">{doctor.qualifications}</p>
          {doctor.highlights.map((highlight) => (
            <span
              key={highlight}
              className="mt-2 inline-flex items-center gap-1 rounded-full bg-blush-100 px-2.5 py-1 text-xs font-semibold text-blush-700"
            >
              <Award className="h-3.5 w-3.5" aria-hidden="true" />
              {highlight}
            </span>
          ))}
        </div>
      </div>

      {doctor.quote && (
        <blockquote className="mt-5 border-l-4 border-blush-300 pl-4 text-sm text-slate-600 italic">“{doctor.quote}”</blockquote>
      )}

      <div className="mt-6 flex-1">
        <h4 className="mb-3 font-heading text-base font-bold">{doctor.schedules.length > 1 ? 'Locations & timings' : 'Timings'}</h4>
        <ScheduleTabs schedules={doctor.schedules} showAddress={false} />
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <Button to={`/book-appointment?doctor=${doctor.slug}`}>Book with Dr. {firstName}</Button>
        <Button to={`/doctors/${doctor.slug}`} variant="outline">
          View profile
        </Button>
      </div>
    </article>
  );
}
