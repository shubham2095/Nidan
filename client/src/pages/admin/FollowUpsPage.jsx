import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Plus } from 'lucide-react';
import AdminHeader from '../../components/admin/AdminHeader.jsx';
import FollowUpFormModal from '../../components/admin/FollowUpFormModal.jsx';
import FollowUpList from '../../components/admin/FollowUpList.jsx';
import Button from '../../components/public/Button.jsx';
import Pagination from '../../components/public/Pagination.jsx';
import { EmptyState, ErrorState, LoadingState } from '../../components/public/States.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import useFetch from '../../hooks/useFetch.js';
import { listFollowUps } from '../../services/crmService.js';

const BUCKETS = [
  ['overdue', 'Overdue', 'Nothing overdue. Nicely done.'],
  ['today', 'Due today', 'Nothing due today.'],
  ['upcoming', 'Upcoming', 'No upcoming follow-ups.'],
  ['done', 'Done', 'Completed follow-ups will appear here.'],
  ['all', 'All', 'No follow-ups yet. Add one from a lead, patient or appointment, or use “New follow-up”.'],
];

export default function FollowUpsPage() {
  const { user } = useAuth();
  const toast = useToast();
  const [params, setParams] = useSearchParams();
  const [creating, setCreating] = useState(false);

  const bucket = BUCKETS.some(([key]) => key === params.get('bucket')) ? params.get('bucket') : 'today';
  const mine = params.get('mine') === '1';
  const page = Math.max(1, Number(params.get('page')) || 1);
  const isDoctor = user.role === 'doctor';

  const update = (changes, { keepPage = false } = {}) => {
    const next = new URLSearchParams(params);
    Object.entries(changes).forEach(([key, value]) => (value ? next.set(key, value) : next.delete(key)));
    if (!keepPage) next.delete('page');
    setParams(next, { replace: true });
  };

  const { data, loading, error, reload } = useFetch(
    (signal) => listFollowUps({ bucket, assignedTo: mine ? 'me' : undefined, page, pageSize: 20 }, signal),
    [bucket, mine, page],
  );

  const empty = BUCKETS.find(([key]) => key === bucket)[2];

  return (
    <>
      <AdminHeader
        title="Follow-ups"
        description={isDoctor ? 'Reminders assigned to you.' : 'Calls to make, reports to chase and reminders for the team.'}
        actions={
          <Button onClick={() => setCreating(true)}>
            <Plus className="h-4 w-4" aria-hidden="true" />
            New follow-up
          </Button>
        }
      />

      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div role="tablist" aria-label="Follow-up groups" className="flex flex-wrap gap-1.5">
          {BUCKETS.map(([key, label]) => (
            <button key={key} type="button" role="tab" aria-selected={bucket === key} onClick={() => update({ bucket: key === 'today' ? '' : key })} className={`rounded-full px-4 py-2 text-sm font-semibold ${bucket === key ? (key === 'overdue' ? 'bg-red-600 text-white' : 'bg-brand-700 text-white') : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50'}`}>
              {label}
            </button>
          ))}
        </div>
        {!isDoctor && (
          <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
            <input type="checkbox" checked={mine} onChange={(event) => update({ mine: event.target.checked ? '1' : '' })} className="h-4 w-4 rounded border-slate-300 text-brand-700" />
            Only mine
          </label>
        )}
      </div>

      <div role="tabpanel">
        {loading && !data && <LoadingState className="py-12" />}
        {error && <ErrorState message={error} onRetry={reload} />}
        {data && data.items.length === 0 && <EmptyState title={empty} className="py-10" />}
        {data && data.items.length > 0 && (
          <>
            <FollowUpList items={data.items} onChange={reload} />
            <Pagination page={data.page} totalPages={data.totalPages} onChange={(next) => update({ page: next > 1 ? String(next) : '' }, { keepPage: true })} />
          </>
        )}
      </div>

      {creating && <FollowUpFormModal onClose={() => setCreating(false)} onSaved={() => { toast.success('Follow-up added.'); reload(); }} />}
    </>
  );
}
