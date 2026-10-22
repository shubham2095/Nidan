import { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import TestimonialCard from './TestimonialCard.jsx';

/** Swipeable carousel (CSS scroll-snap) with arrow buttons; no auto-play so people can read at their own pace. */
export default function TestimonialSlider({ testimonials }) {
  const track = useRef(null);

  const scrollByPage = (direction) => {
    const element = track.current;
    if (element) element.scrollBy({ left: direction * element.clientWidth * 0.9, behavior: 'smooth' });
  };

  return (
    <div className="relative">
      <div
        ref={track}
        tabIndex={0}
        role="region"
        aria-label="Patient testimonials"
        className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-5 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0"
      >
        {testimonials.map((testimonial) => (
          <div key={testimonial.id} className="w-[85%] shrink-0 snap-start sm:w-[calc(50%-0.625rem)] lg:w-[calc(33.333%-0.85rem)]">
            <TestimonialCard testimonial={testimonial} />
          </div>
        ))}
      </div>

      {testimonials.length > 1 && (
        <div className="mt-6 flex justify-center gap-3">
          {[
            { label: 'Previous testimonials', direction: -1, Icon: ChevronLeft },
            { label: 'Next testimonials', direction: 1, Icon: ChevronRight },
          ].map(({ label, direction, Icon }) => (
            <button
              key={label}
              type="button"
              onClick={() => scrollByPage(direction)}
              aria-label={label}
              className="grid h-11 w-11 place-items-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm hover:bg-brand-50"
            >
              <Icon className="h-5 w-5" aria-hidden="true" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
