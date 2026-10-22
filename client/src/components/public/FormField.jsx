import { forwardRef, useId } from 'react';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

/** Label + control + inline error. `children` is a render function receiving the props to spread on the control. */
export function Field({ label, error, hint, required = false, children }) {
  const id = useId();
  const describedBy = [error && `${id}-error`, hint && `${id}-hint`].filter(Boolean).join(' ') || undefined;
  const controlProps = { id, 'aria-invalid': error ? 'true' : undefined, 'aria-describedby': describedBy };

  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-semibold text-slate-800">
        {label}
        {required && <span className="text-blush-600" aria-hidden="true"> *</span>}
      </label>
      {children(controlProps)}
      {hint && !error && (
        <p id={`${id}-hint`} className="mt-1 text-xs text-slate-500">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} role="alert" className="mt-1 text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}

export const ConsentCheckbox = forwardRef(function ConsentCheckbox({ error, children, ...props }, ref) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className="flex items-start gap-3 text-sm text-slate-700">
        <input
          id={id}
          ref={ref}
          type="checkbox"
          aria-invalid={error ? 'true' : undefined}
          className="mt-0.5 h-5 w-5 shrink-0 rounded border-slate-300 text-brand-700 focus:ring-brand-500"
          {...props}
        />
        <span>{children}</span>
      </label>
      {error && (
        <p role="alert" className="mt-1 text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
});

/** Hidden anti-spam field: people never see it, bots fill it in. */
export const Honeypot = forwardRef(function Honeypot(props, ref) {
  return (
    <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
      <label>
        Website
        <input ref={ref} type="text" tabIndex={-1} autoComplete="off" {...props} />
      </label>
    </div>
  );
});

export function FormMessage({ type, children }) {
  if (!children) return null;
  const success = type === 'success';
  const Icon = success ? CheckCircle2 : AlertCircle;
  return (
    <div
      role={success ? 'status' : 'alert'}
      className={`flex items-start gap-3 rounded-2xl p-4 text-sm ${
        success ? 'bg-emerald-50 text-emerald-900' : 'bg-red-50 text-red-800'
      }`}
    >
      <Icon className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
      <p>{children}</p>
    </div>
  );
}
