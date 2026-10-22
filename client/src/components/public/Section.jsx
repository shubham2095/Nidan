import Container from './Container.jsx';

const TONES = {
  white: 'bg-white',
  soft: 'bg-blush-50',
  mint: 'bg-brand-50',
};

/** Page band with consistent spacing. */
export default function Section({ tone = 'white', className = '', children, ...rest }) {
  return (
    <section className={`py-14 sm:py-20 ${TONES[tone]} ${className}`} {...rest}>
      <Container>{children}</Container>
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
