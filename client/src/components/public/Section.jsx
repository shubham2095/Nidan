import Container from './Container.jsx';
import LazyMount from './LazyMount.jsx';
import Reveal from './Reveal.jsx';

const TONES = {
  white: 'bg-white',
  soft: 'bg-blush-50',
  mint: 'bg-brand-50',
};

/**
 * Page band with consistent spacing. The content eases in as the band scrolls into view (pass reveal={false} to skip).
 * `lazy` (a CSS height such as '40rem', roughly the band's height) builds the content only when the band is about
 * to be seen; use it for bands well below the first screen.
 */
export default function Section({ tone = 'white', className = '', reveal = true, lazy = false, children, ...rest }) {
  const content = lazy ? <LazyMount minHeight={lazy === true ? undefined : lazy}>{children}</LazyMount> : children;
  return (
    // overflow-x-clip: nothing inside a band, such as a slide-in or a decorative blob, can widen the page
    <section className={`overflow-x-clip py-14 sm:py-20 ${TONES[tone]} ${className}`} {...rest}>
      <Container>
        {reveal ? (
          <Reveal distance={20} variant="up">
            {content}
          </Reveal>
        ) : (
          content
        )}
      </Container>
    </section>
  );
}

export function SectionHeading({ eyebrow, title, description, align = 'center', className = '' }) {
  const alignment = align === 'center' ? 'mx-auto text-center' : 'text-left';
  return (
    <div className={`mb-10 max-w-2xl sm:mb-12 ${alignment} ${className}`}>
      {eyebrow && (
        <p className="mb-3 inline-block rounded-full bg-blush-100 px-3 py-1 text-xs font-semibold tracking-wide text-blush-700 uppercase">
          {eyebrow}
        </p>
      )}
      <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">{title}</h2>
      {description && <p className="mt-4 text-lg text-slate-600">{description}</p>}
    </div>
  );
}
