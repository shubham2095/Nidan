import ResourceManager from '../../components/admin/ResourceManager.jsx';
import StatusBadge from '../../components/admin/StatusBadge.jsx';
import Icon from '../../components/public/Icon.jsx';
import { specialties } from '../../services/adminService.js';

const initial = { title: '', description: '', icon: '', isActive: true };

const fields = [
  { name: 'title', label: 'Title', required: true, wide: true },
  { name: 'description', label: 'Description', type: 'textarea', rows: 3 },
  { name: 'icon', label: 'Icon', type: 'icon' },
  { name: 'isActive', type: 'checkbox', checkboxLabel: 'Show this on the website' },
];

const columns = [
  {
    key: 'title',
    header: 'Specialty',
    render: (item) => (
      <span className="flex items-center gap-3">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-blush-100 text-blush-600"><Icon name={item.icon} className="h-5 w-5" /></span>
        <span className="font-semibold text-slate-900">{item.title}</span>
      </span>
    ),
  },
  { key: 'description', header: 'Description', className: 'max-w-md', render: (item) => <span className="line-clamp-2 text-slate-600">{item.description}</span> },
  { key: 'status', header: 'Status', render: (item) => <StatusBadge status={item.isActive ? 'confirmed' : 'cancelled'} label={item.isActive ? 'Visible' : 'Hidden'} /> },
];

export default function SpecialtiesAdminPage() {
  return (
    <ResourceManager
      title="Specialties"
      description="The “what we are known for” cards on the home page."
      singular="Specialty"
      api={specialties}
      columns={columns}
      fields={fields}
      initial={initial}
      canReorder
    />
  );
}
