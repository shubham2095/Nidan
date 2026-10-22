import { Quote } from 'lucide-react';
import { initials } from '../../utils/format.js';
import StarRating from './StarRating.jsx';

export default function TestimonialCard({ testimonial, className = '' }) {
  return (
    <figure className={`flex h-full flex-col rounded-3xl border border-slate-100 bg-white p-6 shadow-sm ${className}`}>
      <Quote className="h-8 w-8 text-blush-300" aria-hidden="true" />
      <StarRating value={testimonial.rating} className="mt-3" />
      <blockquote className="mt-3 flex-1 leading-relaxed text-slate-700">{testimonial.content}</blockquote>
      <figcaption className="mt-5 flex items-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-full bg-brand-100 font-heading font-bold text-brand-800">
          {initials(testimonial.name)}
        </span>
        <span className="leading-tight">
          <span className="block font-semibold text-slate-900">{testimonial.name}</span>
          {testimonial.label && <span className="block text-sm text-slate-500">{testimonial.label}</span>}
        </span>
      </figcaption>
    </figure>
  );
}
