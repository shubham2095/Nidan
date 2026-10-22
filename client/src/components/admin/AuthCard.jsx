import { Link } from 'react-router-dom';
import Logo from '../public/Logo.jsx';

/** Centered card used by sign-in, forgot-password and reset-password screens. */
export default function AuthCard({ title, description, children, footer }) {
  return (
    <div className="grid min-h-screen place-items-center bg-gradient-to-b from-blush-50 via-white to-brand-50 px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-6 flex justify-center">
          <Link to="/" aria-label="Back to the website">
            <Logo />
          </Link>
        </div>
        <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-lg sm:p-8">
          <h1 className="text-2xl font-extrabold">{title}</h1>
          {description && <p className="mt-1 text-sm text-slate-600">{description}</p>}
          <div className="mt-6">{children}</div>
        </div>
        {footer && <p className="mt-5 text-center text-sm text-slate-600">{footer}</p>}
      </div>
    </div>
  );
}
