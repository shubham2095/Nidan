import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Plus } from 'lucide-react';
import AdminHeader from '../../components/admin/AdminHeader.jsx';
import DataTable from '../../components/admin/DataTable.jsx';
import PatientFormModal from '../../components/admin/PatientFormModal.jsx';
import SearchBox from '../../components/admin/SearchBox.jsx';
import StatusBadge from '../../components/admin/StatusBadge.jsx';
import Button from '../../components/public/Button.jsx';
import Pagination from '../../components/public/Pagination.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import useFetch from '../../hooks/useFetch.js';
import { listPatients } from '../../services/crmService.js';
import { ageText } from '../../utils/crm.js';
import { formatDate } from '../../utils/format.js';

export default function PatientsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const [creating, setCreating] = useState(false);

  const q = params.get('q') || '';
  const type = params.get('type') || '';
  const page = Math.max(1, Number(params.get('page')) || 1);
  const isDoctor = user.role === 'doctor';

  const update = (changes, { keepPage = false } = {}) => {
    const next = new URLSearchParams(params);
    Object.entries(changes).forEach(([key, value]) => (value ? next.set(key, value) : next.delete(key)));
    if (!keepPage) next.delete('page');
    setParams(next, { replace: true });
  };

  const { data, loading, error, reload } = useFetch(
    (signal) => listPatients({ q: q || undefined, type: type || undefined, page, pageSize: 20 }, signal),
    [q, type, page],
  );

  const columns = [
    {
      key: 'name',
      header: 'Patient',
      render: (patient) => (
        <span>
          <span className="block font-semibold text-slate-900">{patient.name}</span>
          <span className="block text-xs text-slate-500">{patient.patientCode}</span>
        </span>
      ),
    },
    { key: 'type', header: 'Type', render: (patient) => <StatusBadge status={patient.type} /> },
    { key: 'phone', header: 'Phone', className: 'whitespace-nowrap', render: (patient) => patient.phone },
    { key: 'age', header: 'Age', className: 'whitespace-nowrap', render: (patient) => ageText(patient.dob) || <span className="text-slate-400">—</span> },
    {
      key: 'tags',
      header: 'Tags',
      render: (patient) => (
        <span className="flex flex-wrap gap-1">
          {patient.tags.map((tag) => (
            <span key={tag} className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">{tag}</span>
          ))}
        </span>
      ),
    },
    { key: 'added', header: 'Added', className: 'whitespace-nowrap text-slate-500', render: (patient) => formatDate(patient.createdAt) },
  ];

  return (
    <>
      <AdminHeader
        title="Patients"
        description={isDoctor ? 'Patients you have seen.' : 'Mothers and children, created automatically from bookings.'}
        actions={
          !isDoctor && (
            <Button onClick={() => setCreating(true)}>
              <Plus className="h-4 w-4" aria-hidden="true" />
              New patient
            </Button>
          )
        }
      />

      <div className="mb-5 grid gap-3 sm:grid-cols-3">
        <div className="sm:col-span-2">
          <SearchBox value={q} onChange={(value) => update({ q: value })} placeholder="Search name, phone, patient ID or tag" label="Search patients" />
        </div>
        <select aria-label="Filter by type" value={type} onChange={(event) => update({ type: event.target.value })} className="field-input py-2 text-sm">
          <option value="">Mothers and children</option>
          <option value="mother">Mothers / women</option>
          <option value="child">Children</option>
        </select>
      </div>

      <DataTable
        caption="Patients"
        columns={columns}
        rows={data?.items}
        loading={loading}
        error={error}
        onRetry={reload}
        onRowClick={(patient) => navigate(`/admin/patients/${patient.id}`)}
        emptyTitle="No patients found"
        emptyMessage={q || type ? 'Try a different search.' : 'Patients are added automatically when someone books.'}
      />
      {data && <p className="mt-3 text-sm text-slate-500">{data.total} patient{data.total === 1 ? '' : 's'}</p>}
      {data && <Pagination page={data.page} totalPages={data.totalPages} onChange={(next) => update({ page: next > 1 ? String(next) : '' }, { keepPage: true })} />}

      {creating && <PatientFormModal onClose={() => setCreating(false)} onSaved={(patient) => navigate(`/admin/patients/${patient.id}`)} />}
    </>
  );
}
