import { initials } from '../../utils/format.js';

const SIZES = {
  md: 'h-16 w-16 text-xl',
  lg: 'h-28 w-28 text-3xl',
  xl: 'h-40 w-40 text-5xl sm:h-48 sm:w-48',
};

/** Doctor photo, or a friendly initials badge until a photo is uploaded. */
export default function DoctorAvatar({ doctor, size = 'md', className = '' }) {
  const dimensions = SIZES[size];

  if (doctor.photoUrl) {
    return (
      <img
        src={doctor.photoUrl}
        alt={`Portrait of ${doctor.name}`}
        loading="lazy"
        decoding="async"
        width="192"
        height="192"
        className={`shrink-0 rounded-full object-cover ring-4 ring-white ${dimensions} ${className}`}
      />
    );
  }
  return (
    <span
      role="img"
      aria-label={doctor.name}
      className={`grid shrink-0 place-items-center rounded-full bg-gradient-to-br from-blush-200 to-brand-200 font-heading font-extrabold text-brand-900 ring-4 ring-white ${dimensions} ${className}`}
    >
      {initials(doctor.name)}
    </span>
  );
}
