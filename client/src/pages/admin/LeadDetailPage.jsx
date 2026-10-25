import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ClipboardCheck, Loader2, Mail, MessageCircle, Phone, Trash2, UserCheck } from 'lucide-react';
import AdminHeader, { Card } from '../../components/admin/AdminHeader.jsx';
import ConfirmDialog from '../../components/admin/ConfirmDialog.jsx';
import ConvertLeadModal from '../../components/admin/ConvertLeadModal.jsx';
import FollowUpFormModal from '../../components/admin/FollowUpFormModal.jsx';
import StatusBadge from '../../components/admin/StatusBadge.jsx';
import Button from '../../components/public/Button.jsx';
import { Field } from '../../components/public/FormField.jsx';
import { ErrorState, LoadingState } from '../../components/public/States.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import useFetch from '../../hooks/useFetch.js';
import { addLeadNote, deleteLead, getLead, getUserOptions, updateLead } from '../../services/crmService.js';
import { phoneDigits, sourceLabel } from '../../utils/crm.js';
import { formatDate, formatDateOnly, telHref, whatsappHref } from '../../utils/format.js';
import NotFoundPage from '../public/NotFoundPage.jsx';

export default function LeadDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const { data, loading, error, status, reload } = useFetch((signal) => getLead(id, signal), [id]);
  const users = useFetch((signal) => getUserOptions(signal), []);
  const [dialog, setDialog] = useState(null); // 'lost' | 'convert' | 'delete' | 'followup'
  const [note, setNote] = useState('');
  const [savingNote, setSavingNote] = useState(false);

  if (status === 404) return <NotFoundPage />;
  if (loading && !data) return <LoadingState className="py-24" />;
  if (error) return <ErrorState message={error} onRetry={reload} />;

  const { lead } = data;
  const closed = lead.status === 'converted';

  const save = async (changes, message) => {
    try {
      await updateLead(lead.id, changes);
      toast.success(message);
      reload();
    } catch (failure) {
      toast.error(failure.message);
    }
  };

  const addNote = async (event) => {
    event.preventDefault();
    if (!note.trim()) return;
    setSavingNote(true);
    try {
      await addLeadNote(lead.id, note);
      setNote('');
      toast.success('Note added.');
      reload();
    } catch (failure) {
      toast.error(failure.message);
    } finally {
      setSavingNote(false);
    }
  };

  const select = 'field-input py-2 text-sm';

  return (
    <>
      <p className="mb-3 text-sm">
        <Link to="/admin/leads" className="font-semibold text-brand-700 hover:underline">← All leads</Link>
      </p>
      <AdminHeader
        title={lead.name}
        description={`${sourceLabel(lead.source)} · received ${formatDate(lead.createdAt)}`}
        actions={
          <>
            <Button href={telHref(lead.phone)} variant="outline">
              <Phone className="h-4 w-4" aria-hidden="true" />
              Call
            </Button>
            <Button href={whatsappHref(phoneDigits(lead.phone), `Hello ${lead.name}, this is NIDAN Mother & Child Clinic. Thank you for getting in touch.`)} target="_blank" rel="noopener noreferrer" variant="whatsapp">
              <MessageCircle className="h-4 w-4" aria-hidden="true" />
              WhatsApp
            </Button>
            {!closed && (
              <Button onClick={() => setDialog('convert')}>
                <UserCheck className="h-4 w-4" aria-hidden="true" />
                Convert to patient
              </Button>
            )}
            {user.role === 'super_admin' && (
              <Button variant="outline" className="!border-red-300 !text-red-700 hover:!bg-red-50" onClick={() => setDialog('delete')}>
                <Trash2 className="h-4 w-4" aria-hidden="true" />
                Delete
              </Button>
            )}
          </>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6">
          <Card title="Lead details">
            <dl className="space-y-4 text-sm">
              <div>
                <dt className="text-xs font-semibold tracking-wide text-slate-500 uppercase">Phone</dt>
                <dd className="mt-0.5 text-slate-900">{lead.phone}</dd>
              </div>
              {lead.email && (
                <div>
                  <dt className="text-xs font-semibold tracking-wide text-slate-500 uppercase">Email</dt>
                  <dd className="mt-0.5"><a href={`mailto:${lead.email}`} className="inline-flex items-center gap-1.5 break-all text-brand-700 hover:underline"><Mail className="h-4 w-4 shrink-0" aria-hidden="true" />{lead.email}</a></dd>
                </div>
              )}
              {lead.preferredDoctor && (
                <div>
                  <dt className="text-xs font-semibold tracking-wide text-slate-500 uppercase">Preferred doctor</dt>
                  <dd className="mt-0.5 text-slate-900">{lead.preferredDoctor.name}</dd>
                </div>
              )}
              {lead.message && (
                <div>
                  <dt className="text-xs font-semibold tracking-wide text-slate-500 uppercase">Their message</dt>
                  <dd className="mt-0.5 whitespace-pre-wrap text-slate-900">{lead.message}</dd>
                </div>
              )}
              {lead.status === 'lost' && lead.lostReason && (
                <div>
                  <dt className="text-xs font-semibold tracking-wide text-slate-500 uppercase">Lost because</dt>
                  <dd className="mt-0.5 text-slate-900">{lead.lostReason}</dd>
                </div>
              )}
              {closed && lead.patient && (
                <div>
                  <dt className="text-xs font-semibold tracking-wide text-slate-500 uppercase">Patient record</dt>
                  <dd className="mt-0.5"><Link to={`/admin/patients/${lead.patient.id}`} className="font-bold text-brand-700 hover:underline">{lead.patient.name} ({lead.patient.patientCode})</Link></dd>
                </div>
              )}
            </dl>
          </Card>

          <Card title="Manage">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-600">Status</span>
                <StatusBadge status={lead.status} />
              </div>
              {!closed && (
                <>
                  <Field label="Change status">
                    {(props) => (
                      <select {...props} value={lead.status === 'lost' ? 'lost' : lead.status} onChange={(event) => (event.target.value === 'lost' ? setDialog('lost') : save({ status: event.target.value }, 'Status updated.'))} className={select}>
                        <option value="new">New</option>
                        <option value="contacted">Contacted</option>
                        <option value="lost">Lost</option>
                      </select>
                    )}
                  </Field>
                  <Field label="Assigned to">
                    {(props) => (
                      <select {...props} value={lead.assignee?.id || ''} onChange={(event) => save({ assignedTo: event.target.value || null }, 'Assignee updated.')} className={select}>
                        <option value="">Nobody yet</option>
                        {users.data?.items.map((person) => (
                          <option key={person.id} value={person.id}>{person.name}</option>
                        ))}
                      </select>
                    )}
                  </Field>
                  <Field label="Next follow-up date">
                    {(props) => <input {...props} type="date" value={lead.nextFollowUpDate || ''} onChange={(event) => save({ nextFollowUpDate: event.target.value || null }, 'Follow-up date updated.')} className={select} />}
                  </Field>
                </>
              )}
              <Button variant="outline" onClick={() => setDialog('followup')} className="w-full">
                <ClipboardCheck className="h-4 w-4" aria-hidden="true" />
                Add follow-up task
              </Button>
            </div>
          </Card>
        </div>

        <div className="space-y-6 lg:col-span-2">
          <Card title="Notes">
            <form onSubmit={addNote} className="mb-5 space-y-3">
              <label htmlFor="lead-note" className="sr-only">Add a note</label>
              <textarea id="lead-note" rows={3} value={note} onChange={(event) => setNote(event.target.value)} placeholder="What happened? e.g. Called, will visit on Saturday" className="field-input" />
              <Button type="submit" disabled={savingNote || !note.trim()}>
                {savingNote && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
                Add note
              </Button>
            </form>
            {lead.notes.length === 0 ? (
              <p className="text-sm text-slate-500">No notes yet. Adding the first note marks a new lead as contacted.</p>
            ) : (
              <ol className="space-y-4 border-l-2 border-slate-100 pl-5">
                {lead.notes.map((entry) => (
                  <li key={entry.id} className="relative">
                    <span className="absolute -left-[1.6rem] top-1.5 h-2.5 w-2.5 rounded-full bg-brand-500" aria-hidden="true" />
                    <p className="text-xs font-semibold text-slate-500">{entry.author?.name || 'Staff'} · {formatDate(entry.createdAt)}</p>
                    <p className="mt-0.5 whitespace-pre-wrap text-slate-800">{entry.note}</p>
                  </li>
                ))}
              </ol>
            )}
          </Card>

          {lead.followUps.length > 0 && (
            <Card title="Follow-up tasks">
              <ul className="divide-y divide-slate-100">
                {lead.followUps.map((followUp) => (
                  <li key={followUp.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                    <span className={followUp.status === 'done' ? 'text-slate-400 line-through' : 'font-medium text-slate-800'}>{followUp.title}</span>
                    <span className="text-slate-500">{formatDateOnly(followUp.dueDate, { short: true })}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-sm"><Link to="/admin/follow-ups" className="font-semibold text-brand-700 hover:underline">Open all follow-ups</Link></p>
            </Card>
          )}
        </div>
      </div>

      {dialog === 'lost' && (
        <ConfirmDialog
          title="Mark this lead as lost?"
          message="They will stay in the list so you can see why it did not work out."
          confirmLabel="Mark as lost"
          reasonLabel="Why was it lost?"
          reasonRequired
          onConfirm={async (reason) => {
            await updateLead(lead.id, { status: 'lost', lostReason: reason });
            toast.success('Lead marked as lost.');
            reload();
          }}
          onClose={() => { setDialog(null); reload(); }}
        />
      )}
      {dialog === 'convert' && <ConvertLeadModal lead={lead} onClose={() => setDialog(null)} onConverted={reload} />}
      {dialog === 'followup' && <FollowUpFormModal defaults={{ leadId: lead.id, title: `Call back ${lead.name}` }} context={`Lead: ${lead.name}`} onClose={() => setDialog(null)} onSaved={() => { toast.success('Follow-up added.'); reload(); }} />}
      {dialog === 'delete' && (
        <ConfirmDialog
          title="Delete this lead?"
          message={`${lead.name} and their notes will be removed from the list.`}
          confirmLabel="Delete lead"
          danger
          onConfirm={async () => {
            await deleteLead(lead.id);
            toast.success('Lead deleted.');
            navigate('/admin/leads', { replace: true });
          }}
          onClose={() => setDialog(null)}
        />
      )}
    </>
  );
}
