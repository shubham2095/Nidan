import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ChevronDown, ChevronRight } from 'lucide-react';
import AdminHeader from '../../components/admin/AdminHeader.jsx';
import SearchBox from '../../components/admin/SearchBox.jsx';
import { labelOf } from '../../components/admin/StatusBadge.jsx';
import Pagination from '../../components/public/Pagination.jsx';
import { EmptyState, ErrorState, LoadingState } from '../../components/public/States.jsx';
import useFetch from '../../hooks/useFetch.js';
import { listActivity, listUsers } from '../../services/adminService.js';
import { formatDateTime } from '../../utils/format.js';

const show = (value) => {
  if (value === null || value === undefined || value === '') return '—';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
};

function Changes({ changes }) {
  return (
    <dl className="mt-2 grid gap-x-4 gap-y-1 text-xs sm:grid-cols-[auto_1fr]">
      {Object.entries(changes).map(([field, change]) => (
        <div key={field} className="contents">
          <dt className="font-semibold text-slate-500">{labelOf(field.replace(/([A-Z])/g, ' $1').toLowerCase())}</dt>
          <dd className="break-words text-slate-700">
            {change && typeof change === 'object' && ('from' in change || 'to' in change) ? (
              <>
                <span className="text-slate-500 line-through">{show(change.from)}</span> → <span className="font-medium">{show(change.to)}</span>
              </>
            ) : (
              show(change)
            )}
          </dd>
        </div>
      ))}
    </dl>
  );
}

function Entry({ entry }) {
  const [open, setOpen] = useState(false);
  const hasChanges = entry.changes && Object.keys(entry.changes).length > 0;

  return (
    <li className="px-4 py-3">
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm text-slate-900">{entry.summary || `${labelOf(entry.action)} ${labelOf(entry.entityType).toLowerCase()}`}</p>
          <p className="mt-0.5 flex flex-wrap gap-x-3 text-xs text-slate-500">
            <span>{entry.userName || 'System'}</span>
            <span>{formatDateTime(entry.createdAt)}</span>
            <span>{labelOf(entry.entityType)} · {labelOf(entry.action)}</span>
            {entry.ipAddress && <span>IP {entry.ipAddress}</span>}
          </p>
          {hasChanges && open && <Changes changes={entry.changes} />}
        </div>
        {hasChanges && (
          <button type="button" onClick={() => setOpen((value) => !value)} aria-expanded={open} className="flex shrink-0 items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold text-brand-700 hover:bg-brand-50">
            {open ? <ChevronDown className="h-4 w-4" aria-hidden="true" /> : <ChevronRight className="h-4 w-4" aria-hidden="true" />}
            {open ? 'Hide' : 'Details'}
          </button>
        )}
      </div>
    </li>
  );
}

export default function ActivityLogPage() {
  const [params, setParams] = useSearchParams();
  const users = useFetch((signal) => listUsers(signal), []);
  const filters = {
    q: params.get('q') || '',
    userId: params.get('userId') || '',
    entityType: params.get('entityType') || '',
    action: params.get('action') || '',
    from: params.get('from') || '',
    to: params.get('to') || '',
  };
  const page = Math.max(1, Number(params.get('page')) || 1);

  const update = (changes, { keepPage = false } = {}) => {
    const next = new URLSearchParams(params);
    Object.entries(changes).forEach(([key, value]) => (value ? next.set(key, value) : next.delete(key)));
    if (!keepPage) next.delete('page');
    setParams(next, { replace: true });
  };

  const { data, loading, error, reload } = useFetch(
    (signal) => listActivity({ ...Object.fromEntries(Object.entries(filters).filter(([, value]) => value)), page, pageSize: 30 }, signal),
    [filters.q, filters.userId, filters.entityType, filters.action, filters.from, filters.to, page],
  );

  const select = 'field-input py-2 text-sm';

  return (
    <>
      <AdminHeader title="Activity log" description="Who changed what, and when. Passwords and clinical notes are never recorded here." />

      <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
        <div className="sm:col-span-2">
          <SearchBox value={filters.q} onChange={(value) => update({ q: value })} placeholder="Search the description" label="Search activity" />
        </div>
        <select aria-label="Filter by person" value={filters.userId} onChange={(event) => update({ userId: event.target.value })} className={select}>
          <option value="">Everyone</option>
          {users.data?.items.map((person) => (
            <option key={person.id} value={person.id}>{person.name}</option>
          ))}
        </select>
        <select aria-label="Filter by area" value={filters.entityType} onChange={(event) => update({ entityType: event.target.value })} className={select}>
          <option value="">All areas</option>
          {data?.entityTypes.map((type) => (
            <option key={type} value={type}>{labelOf(type)}</option>
          ))}
        </select>
        <select aria-label="Filter by action" value={filters.action} onChange={(event) => update({ action: event.target.value })} className={select}>
          <option value="">All actions</option>
          {data?.actions.map((action) => (
            <option key={action} value={action}>{labelOf(action)}</option>
          ))}
        </select>
        <div className="grid gap-3 sm:col-span-2 sm:grid-cols-2 lg:col-span-6 lg:flex lg:justify-end">
          <label className="flex items-center gap-2 text-sm text-slate-600">
            <span className="w-10 shrink-0 lg:w-auto">From</span>
            <input type="date" value={filters.from} max={filters.to || undefined} onChange={(event) => update({ from: event.target.value })} className={`${select} min-w-0 flex-1 lg:w-auto lg:flex-none`} />
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-600">
            <span className="w-10 shrink-0 lg:w-auto">To</span>
            <input type="date" value={filters.to} min={filters.from || undefined} onChange={(event) => update({ to: event.target.value })} className={`${select} min-w-0 flex-1 lg:w-auto lg:flex-none`} />
          </label>
        </div>
      </div>

      {error && <ErrorState message={error} onRetry={reload} />}
      {loading && !data && <LoadingState />}
      {data && data.items.length === 0 && <EmptyState title="No activity found" message={Object.values(filters).some(Boolean) ? 'Try clearing a filter.' : 'Changes made in the dashboard will be listed here.'} />}
      {data && data.items.length > 0 && (
        <ul className={`divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200 bg-white transition-opacity ${loading ? 'opacity-60' : ''}`}>
          {data.items.map((entry) => (
            <Entry key={entry.id} entry={entry} />
          ))}
        </ul>
      )}
      {data && <p className="mt-3 text-sm text-slate-500">{data.total} entr{data.total === 1 ? 'y' : 'ies'}</p>}
      {data && <Pagination page={data.page} totalPages={data.totalPages} onChange={(next) => update({ page: next > 1 ? String(next) : '' }, { keepPage: true })} />}
    </>
  );
}
