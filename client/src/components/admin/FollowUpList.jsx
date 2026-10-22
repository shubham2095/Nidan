import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarClock, Check, Pencil, RotateCcw, Trash2, User } from 'lucide-react';
import { useToast } from '../../context/ToastContext.jsx';
import { deleteFollowUp, updateFollowUp } from '../../services/crmService.js';
import { formatDateOnly } from '../../utils/format.js';
import ConfirmDialog from './ConfirmDialog.jsx';
import FollowUpFormModal from './FollowUpFormModal.jsx';
import StatusBadge from './StatusBadge.jsx';

function linkOf(followUp) {
  if (followUp.patient) return { to: `/admin/patients/${followUp.patient.id}`, label: followUp.patient.name };
  if (followUp.lead) return { to: `/admin/leads/${followUp.lead.id}`, label: `Lead: ${followUp.lead.name}` };
  if (followUp.appointment) return { to: `/admin/appointments?open=${followUp.appointment.id}`, label: `Appointment ${followUp.appointment.bookingRef}` };
  return null;
}

/** Cards for follow-up tasks with done / re-open, edit and delete. `onChange` is called after any change so the parent can reload. */
export default function FollowUpList({ items, onChange }) {
  const toast = useToast();
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [busyId, setBusyId] = useState(null);

  const setStatus = async (followUp, status) => {
    setBusyId(followUp.id);
    try {
      await updateFollowUp(followUp.id, { status });
      toast.success(status === 'done' ? 'Marked as done.' : 'Follow-up re-opened.');
      onChange();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <>
      <ul className="space-y-3">
        {items.map((followUp) => {
          const link = linkOf(followUp);
          const done = followUp.status === 'done';
          return (
            <li key={followUp.id} className={`flex flex-wrap items-start gap-4 rounded-2xl border bg-white p-4 ${followUp.overdue ? 'border-red-200' : 'border-slate-200'}`}>
              <button
                type="button"
                onClick={() => setStatus(followUp, done ? 'open' : 'done')}
                disabled={busyId === followUp.id}
                aria-label={done ? `Re-open ${followUp.title}` : `Mark ${followUp.title} as done`}
                className={`mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full border-2 transition ${done ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-slate-300 text-transparent hover:border-emerald-500 hover:text-emerald-500'}`}
              >
                {done ? <RotateCcw className="h-4 w-4" aria-hidden="true" /> : <Check className="h-4 w-4" aria-hidden="true" />}
              </button>
              <div className="min-w-0 flex-1">
                <p className={`font-semibold text-slate-900 ${done ? 'line-through opacity-60' : ''}`}>{followUp.title}</p>
                {followUp.description && <p className="mt-0.5 text-sm text-slate-600">{followUp.description}</p>}
                <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                  <span className={`flex items-center gap-1 ${followUp.overdue ? 'font-bold text-red-700' : ''}`}>
                    <CalendarClock className="h-3.5 w-3.5" aria-hidden="true" />
                    {formatDateOnly(followUp.dueDate)}
                    {followUp.overdue && ' (overdue)'}
                  </span>
                  {followUp.assignee && (
                    <span className="flex items-center gap-1">
                      <User className="h-3.5 w-3.5" aria-hidden="true" />
                      {followUp.assignee.name}
                    </span>
                  )}
                  {link && (
                    <Link to={link.to} className="font-semibold text-brand-700 hover:underline">
                      {link.label}
                    </Link>
                  )}
                </p>
              </div>
              <div className="flex items-center gap-1">
                {followUp.overdue && <StatusBadge status="overdue" />}
                <button type="button" onClick={() => setEditing(followUp)} aria-label={`Edit ${followUp.title}`} className="rounded-full p-2 text-slate-500 hover:bg-slate-100">
                  <Pencil className="h-4 w-4" aria-hidden="true" />
                </button>
                <button type="button" onClick={() => setDeleting(followUp)} aria-label={`Delete ${followUp.title}`} className="rounded-full p-2 text-slate-500 hover:bg-red-50 hover:text-red-600">
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            </li>
          );
        })}
      </ul>

      {editing && <FollowUpFormModal existing={editing} onClose={() => setEditing(null)} onSaved={() => { toast.success('Follow-up updated.'); onChange(); }} />}
      {deleting && (
        <ConfirmDialog
          title="Delete this follow-up?"
          message={`“${deleting.title}” will be removed.`}
          confirmLabel="Delete"
          danger
          onConfirm={async () => {
            await deleteFollowUp(deleting.id);
            toast.success('Follow-up deleted.');
            onChange();
          }}
          onClose={() => setDeleting(null)}
        />
      )}
    </>
  );
}
