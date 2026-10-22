import { Link } from 'react-router-dom';

const VARIANTS = {
  primary: 'bg-brand-700 text-white shadow-sm hover:bg-brand-800',
  gradient: 'bg-gradient-to-r from-brand-700 to-brand-500 text-white shadow-md shadow-brand-700/25 hover:from-brand-800 hover:to-brand-600 hover:shadow-lg',
  secondary: 'bg-blush-100 text-blush-700 hover:bg-blush-200',
  outline: 'border border-brand-700 bg-white text-brand-700 hover:bg-brand-50',
  light: 'bg-white text-brand-800 shadow-sm hover:bg-brand-50',
  whatsapp: 'bg-emerald-700 text-white shadow-sm hover:bg-emerald-800',
};

const SIZES = {
  md: 'px-5 py-2.5 text-sm',
  lg: 'px-7 py-3.5 text-base',
};

/** Renders a router <Link> (to), an <a> (href) or a <button>, all with the same look. */
export default function Button({ to, href, variant = 'primary', size = 'md', className = '', children, ...rest }) {
  const classes = `inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${SIZES[size]} ${VARIANTS[variant]} ${className}`;

  if (to) {
    return (
      <Link to={to} className={classes} {...rest}>
        {children}
      </Link>
    );
  }
  if (href) {
    return (
      <a href={href} className={classes} {...rest}>
        {children}
      </a>
    );
  }
  return (
    <button type="button" className={classes} {...rest}>
      {children}
    </button>
  );
}
