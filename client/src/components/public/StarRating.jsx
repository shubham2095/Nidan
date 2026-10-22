import { Star } from 'lucide-react';

export default function StarRating({ value, className = '' }) {
  if (!value) return null;
  return (
    <span role="img" aria-label={`${value} out of 5 stars`} className={`flex gap-0.5 ${className}`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          aria-hidden="true"
          className={`h-4 w-4 ${star <= value ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`}
        />
      ))}
    </span>
  );
}
