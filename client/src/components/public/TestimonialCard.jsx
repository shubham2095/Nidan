import { useState } from 'react';
import { Quote } from 'lucide-react';
import { initials } from '../../utils/format.js';
import StarRating from './StarRating.jsx';

// Longer than this and a `collapsible` card shows the first few lines with a "Read more" button.
const LONG_REVIEW = 280;

/**
 * One patient's words. Line breaks in the text are kept. `collapsible` is for narrow slider cards, where a review of
 * several paragraphs would otherwise make the card very tall; the Testimonials page shows every review in full.
 */
export default function TestimonialCard({ testimonial, className = '', collapsible = false }) {
  const [open, setOpen] = useState(false);
  const long = collapsible && testimonial.content.length > LONG_REVIEW;

  return (
    <figure className={`flex h-full flex-col rounded-3xl border border-slate-100 bg-white p-6 shadow-sm ${className}`}>
      <Quote className="h-8 w-8 text-blush-300" aria-hidden="true" />
      <StarRating value={testimonial.rating} className="mt-3" />
      <blockquote className={`mt-3 flex-1 leading-relaxed whitespace-pre-line text-slate-700 ${long && !open ? 'line-clamp-6' : ''}`}>
        {testimonial.content}
      </blockquote>
      {long && (
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          className="mt-2 self-start rounded-full py-1 text-sm font-semibold text-brand-700 hover:underline"
        >
          {open ? 'Show less' : 'Read more'}
        </button>
      )}
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
