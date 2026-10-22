import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Plus } from 'lucide-react';
import AdminHeader from '../../components/admin/AdminHeader.jsx';
import DataTable from '../../components/admin/DataTable.jsx';
import LeadFormModal from '../../components/admin/LeadFormModal.jsx';
import SearchBox from '../../components/admin/SearchBox.jsx';
import StatusBadge from '../../components/admin/StatusBadge.jsx';
import Button from '../../components/public/Button.jsx';
import Pagination from '../../components/public/Pagination.jsx';
import useFetch from '../../hooks/useFetch.js';
import { getUserOptions, listLeads } from '../../services/crmService.js';
import { LEAD_SOURCES, LEAD_STATUSES, sourceLabel, todayIso } from '../../utils/crm.js';
import { formatDate, formatDateOnly } from '../../utils/format.js';

export default function LeadsPage() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const [creating, setCreating] = useState(false);
  const users = useFetch((signal) => getUserOptions(signal), []);

  const filters = { q: params.get('q') || '', status: params.get('status') || '', source: params.get('source') || '', assignedTo: params.get('assignedTo') || '' };
  const page = Math.max(1, Number(params.get('page')) || 1);

  const update = (changes, { keepPage = false } = {}) => {
    const next = new URLSearchParams(params);
    Object.entries(changes).forEach(([key, value]) => (value ? next.set(key, value) : next.delete(key)));
    if (!keepPage) next.delete('page');
    setParams(next, { replace: true });
  };

  const { data, loading, error, reload } = useFetch(
    (signal) => listLeads({ q: filters.q || undefined, status: filters.status || undefined, source: filters.source || undefined, assignedTo: filters.assignedTo || undefined, page, pageSize: 20 }, signal),
    [filters.q, filters.status, filters.source, filters.assignedTo, page],
  );

  const today = todayIso();
  const columns = [
    { key: 'created', header: 'Received', className: 'whitespace-nowrap text-slate-500', render: (lead) => formatDate(lead.createdAt) },
    {
      key: 'name',
      header: 'Lead',
      render: (lead) => (
        <span>
          <span className="block font-semibold text-slate-900">{lead.name}</span>
          <span className="block text-xs text-slate-500">{lead.phone}</span>
        </span>
      ),
    },
    { key: 'source', header: 'Source', render: (lead) => sourceLabel(lead.source) },
    { key: 'status', header: 'Status', render: (lead) => <StatusBadge status={lead.status} /> },
    { key: 'assignee', header: 'Assigned to', render: (lead) => lead.assignee?.name || <span className="text-slate-400">Unassigned</span> },
    {
      key: 'next',
      header: 'Next follow-up',
      className: 'whitespace-nowrap',
      render: (lead) =>
        lead.nextFollowUpDate ? (
          <span className={lead.nextFollowUpDate < today && !['converted', 'lost'].includes(lead.status) ? 'font-bold text-red-700' : ''}>{formatDateOnly(lead.nextFollowUpDate, { short: true })}</span>
        ) : (
          <span className="text-slate-400">—</span>
        ),
    },
    { key: 'message', header: 'Message', className: 'max-w-xs', render: (lead) => <span className="line-clamp-2 text-slate-600">{lead.message}</span> },
  ];

  const select = 'field-input py-2 text-sm';

  return (
    <>
      <AdminHeader
        title="Leads"
        description="Enquiries from the website, phone calls, walk-ins and social media."
        actions={
          <Button onClick={() => setCreating(true)}>
            <Plus className="h-4 w-4" aria-hidden="true" />
            New lead
          </Button>
        }
      />

      <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <SearchBox value={filters.q} onChange={(value) => update({ q: value })} placeholder="Search name, phone or email" label="Search leads" />
        </div>
        <select aria-label="Filter by status" value={filters.status} onChange={(event) => update({ status: event.target.value })} className={select}>
          <option value="">All statuses</option>
          {LEAD_STATUSES.map((status) => (
            <option key={status} value={status}>{status.replace(/^\w/, (c) => c.toUpperCase())}</option>
          ))}
        </select>
        <select aria-label="Filter by source" value={filters.source} onChange={(event) => update({ source: event.target.value })} className={select}>
          <option value="">All sources</option>
          {LEAD_SOURCES.map(([key, label]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
        <select aria-label="Filter by assignee" value={filters.assignedTo} onChange={(event) => update({ assignedTo: event.target.value })} className={select}>
          <option value="">Anyone</option>
          <option value="me">Assigned to me</option>
          <option value="none">Unassigned</option>
          {users.data?.items.map((person) => (
            <option key={person.id} value={person.id}>{person.name}</option>
          ))}
        </select>
      </div>

      <DataTable
        caption="Leads"
        columns={columns}
        rows={data?.items}
        loading={loading}
        error={error}
        onRetry={reload}
        onRowClick={(lead) => navigate(`/admin/leads/${lead.id}`)}
        emptyTitle="No leads found"
        emptyMessage={Object.values(filters).some(Boolean) ? 'Try clearing a filter.' : 'Enquiries from the contact form will appear here.'}
      />
      {data && <p className="mt-3 text-sm text-slate-500">{data.total} lead{data.total === 1 ? '' : 's'}</p>}
      {data && <Pagination page={data.page} totalPages={data.totalPages} onChange={(next) => update({ page: next > 1 ? String(next) : '' }, { keepPage: true })} />}

      {creating && <LeadFormModal onClose={() => setCreating(false)} onSaved={(lead) => navigate(`/admin/leads/${lead.id}`)} />}
    </>
  );
}
