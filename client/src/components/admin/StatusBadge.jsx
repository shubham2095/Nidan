const STYLES = {
  // appointments
  pending: 'bg-amber-100 text-amber-800',
  confirmed: 'bg-sky-100 text-sky-800',
  completed: 'bg-emerald-100 text-emerald-800',
  cancelled: 'bg-slate-200 text-slate-700',
  no_show: 'bg-red-100 text-red-800',
  // leads
  new: 'bg-blush-100 text-blush-700',
  contacted: 'bg-sky-100 text-sky-800',
  converted: 'bg-emerald-100 text-emerald-800',
  lost: 'bg-slate-200 text-slate-700',
  // follow-ups
  open: 'bg-amber-100 text-amber-800',
  done: 'bg-emerald-100 text-emerald-800',
  overdue: 'bg-red-100 text-red-800',
  // patients
  mother: 'bg-blush-100 text-blush-700',
  child: 'bg-brand-100 text-brand-800',
};

export const labelOf = (value) => String(value).replace(/_/g, ' ').replace(/^\w/, (char) => char.toUpperCase());

export default function StatusBadge({ status, label }) {
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap ${STYLES[status] || 'bg-slate-100 text-slate-700'}`}>
      {label || labelOf(status)}
    </span>
  );
}
