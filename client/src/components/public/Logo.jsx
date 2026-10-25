/**
 * The clinic logo (client/public/images/nidan-logo.webp). It has a white background, so on dark areas
 * (`tone="light"`, e.g. the footer) it sits on a white tile. `className` sets the height.
 */
export default function Logo({ tone = 'dark', className = 'h-12 lg:h-16' }) {
  const image = <img src="/images/nidan-logo.webp" alt="NIDAN Mother & Child Clinic" width="300" height="162" className={`w-auto ${className}`} />;
  if (tone === 'light') return <span className="inline-block rounded-2xl bg-white p-2 shadow-sm">{image}</span>;
  return image;
}
