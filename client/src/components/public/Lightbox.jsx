import { useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

/** Full-screen image viewer. Esc closes, arrow keys move between images, focus returns to the thumbnail. */
export default function Lightbox({ images, index, onClose, onChange }) {
  const closeButton = useRef(null);
  const image = images[index];

  useEffect(() => {
    const trigger = document.activeElement;
    closeButton.current?.focus();
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
      trigger?.focus?.();
    };
  }, []);

  useEffect(() => {
    const onKey = (event) => {
      if (event.key === 'Escape') onClose();
      if (event.key === 'ArrowRight') onChange((index + 1) % images.length);
      if (event.key === 'ArrowLeft') onChange((index - 1 + images.length) % images.length);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [index, images.length, onChange, onClose]);

  if (!image) return null;

  const arrowClasses = 'absolute top-1/2 -translate-y-1/2 grid h-12 w-12 place-items-center rounded-full bg-white/15 text-white hover:bg-white/30';

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={image.title || image.altText}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
      onClick={onClose}
    >
      <button
        ref={closeButton}
        type="button"
        onClick={onClose}
        aria-label="Close gallery"
        className="absolute top-4 right-4 grid h-12 w-12 place-items-center rounded-full bg-white/15 text-white hover:bg-white/30"
      >
        <X className="h-6 w-6" aria-hidden="true" />
      </button>

      {images.length > 1 && (
        <>
          <button
            type="button"
            aria-label="Previous image"
            className={`${arrowClasses} left-3 sm:left-6`}
            onClick={(event) => {
              event.stopPropagation();
              onChange((index - 1 + images.length) % images.length);
            }}
          >
            <ChevronLeft className="h-6 w-6" aria-hidden="true" />
          </button>
          <button
            type="button"
            aria-label="Next image"
            className={`${arrowClasses} right-3 sm:right-6`}
            onClick={(event) => {
              event.stopPropagation();
              onChange((index + 1) % images.length);
            }}
          >
            <ChevronRight className="h-6 w-6" aria-hidden="true" />
          </button>
        </>
      )}

      <figure className="max-h-full max-w-5xl" onClick={(event) => event.stopPropagation()}>
        <img src={image.imageUrl} alt={image.altText} className="max-h-[80vh] w-auto rounded-xl object-contain" />
        {image.title && <figcaption className="mt-3 text-center text-sm text-white/90">{image.title}</figcaption>}
      </figure>
    </div>
  );
}
