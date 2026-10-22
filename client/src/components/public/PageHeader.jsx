import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import Container from './Container.jsx';

/** Title band at the top of inner pages, with breadcrumbs. */
export default function PageHeader({ title, description, crumbs = [], children }) {
  return (
    <div className="relative overflow-hidden bg-gradient-to-b from-blush-50 to-white">
      <div aria-hidden="true" className="anim-drift absolute -top-24 -right-16 h-64 w-64 rounded-full bg-brand-100/60 blur-3xl" />
      <div aria-hidden="true" className="anim-drift-reverse absolute -bottom-20 left-10 h-48 w-48 rounded-full bg-blush-100/70 blur-3xl" />
      <Container className="relative py-12 sm:py-16">
        <nav aria-label="Breadcrumb" className="hero-in mb-4 text-sm text-slate-500">
          <ol className="flex flex-wrap items-center gap-1">
            <li>
              <Link to="/" className="hover:text-brand-700 hover:underline">
                Home
              </Link>
            </li>
            {crumbs.map((crumb) => (
              <li key={crumb.label} className="flex items-center gap-1">
                <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
                {crumb.to ? (
                  <Link to={crumb.to} className="hover:text-brand-700 hover:underline">
                    {crumb.label}
                  </Link>
                ) : (
                  <span aria-current="page" className="text-slate-700">
                    {crumb.label}
                  </span>
                )}
              </li>
            ))}
          </ol>
        </nav>
        <h1 className="hero-in max-w-3xl text-4xl font-extrabold tracking-tight sm:text-5xl" style={{ '--d': '100ms' }}>
          {title}
        </h1>
        {description && (
          <p className="hero-in mt-4 max-w-2xl text-lg text-slate-600" style={{ '--d': '220ms' }}>
            {description}
          </p>
        )}
        {children && (
          <div className="hero-in" style={{ '--d': '340ms' }}>
            {children}
          </div>
        )}
      </Container>
    </div>
  );
}
