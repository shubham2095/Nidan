import { AlertCircle, Loader2 } from 'lucide-react';
import Button from './Button.jsx';

export function LoadingState({ label = 'Loading…', className = 'py-16' }) {
  return (
    <div role="status" className={`flex items-center justify-center gap-3 text-slate-500 ${className}`}>
      <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}

export function ErrorState({ message, onRetry, className = 'py-16' }) {
  return (
    <div role="alert" className={`mx-auto flex max-w-md flex-col items-center gap-3 text-center ${className}`}>
      <AlertCircle className="h-8 w-8 text-red-500" aria-hidden="true" />
      <p className="font-semibold text-slate-900">We could not load this right now</p>
      <p className="text-sm text-slate-600">{message || 'Please check your connection and try again.'}</p>
      {onRetry && (
        <Button variant="outline" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}

export function EmptyState({ title, message, children, className = 'py-16' }) {
  return (
    <div className={`mx-auto max-w-md rounded-3xl border border-dashed border-slate-300 bg-slate-50 px-6 text-center ${className}`}>
      <p className="font-heading text-xl font-bold text-slate-900">{title}</p>
      {message && <p className="mt-2 text-slate-600">{message}</p>}
      {children && <div className="mt-5 flex justify-center gap-3">{children}</div>}
    </div>
  );
}
