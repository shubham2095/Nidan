import { Heart } from 'lucide-react';

export default function Logo({ tone = 'dark' }) {
  const text = tone === 'dark' ? 'text-slate-900' : 'text-white';
  const sub = tone === 'dark' ? 'text-slate-500' : 'text-brand-100';
  return (
    <span className="flex items-center gap-3">
      <span className="grid h-10 w-10 place-items-center rounded-2xl bg-brand-700 text-blush-200 shadow-sm">
        <Heart className="h-5 w-5 fill-current" aria-hidden="true" />
      </span>
      <span className="leading-tight">
        <span className={`block font-heading text-xl font-extrabold tracking-tight ${text}`}>Nidan</span>
        <span className={`block text-[11px] font-semibold tracking-wide uppercase ${sub}`}>Mother &amp; Child Care</span>
      </span>
    </span>
  );
}
