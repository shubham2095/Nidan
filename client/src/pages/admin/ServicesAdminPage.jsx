import ResourceManager from '../../components/admin/ResourceManager.jsx';
import StatusBadge from '../../components/admin/StatusBadge.jsx';
import Icon from '../../components/public/Icon.jsx';
import { services, uploadImage } from '../../services/adminService.js';

const initial = { name: '', slug: '', shortDescription: '', description: '', icon: '', imageUrl: '', metaTitle: '', metaDescription: '', isActive: true };

const fields = [
  { name: 'name', label: 'Name', required: true },
  { name: 'slug', label: 'Web address', hint: 'Leave empty to create it from the name, e.g. fertility-ivf' },
  { name: 'shortDescription', label: 'Short description', type: 'textarea', rows: 2, hint: 'Shown on the service cards (about one sentence)' },
  { name: 'icon', label: 'Icon', type: 'icon' },
  { name: 'description', label: 'Page content', type: 'richtext' },
  { name: 'imageUrl', label: 'Picture (optional)', type: 'image', upload: (file) => uploadImage(file, 'content') },
  { name: 'metaTitle', label: 'Search title (optional)', hint: 'Shown in Google results; keep it under 60 characters' },
  { name: 'metaDescription', label: 'Search description (optional)', type: 'textarea', rows: 2, hint: 'Keep it under 160 characters' },
  { name: 'isActive', type: 'checkbox', checkboxLabel: 'Show this service on the website' },
];

const columns = [
  {
    key: 'name',
    header: 'Service',
    render: (service) => (
      <span className="flex items-center gap-3">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-700"><Icon name={service.icon} className="h-5 w-5" /></span>
        <span>
          <span className="block font-semibold text-slate-900">{service.name}</span>
          <span className="block text-xs text-slate-500">/services/{service.slug}</span>
        </span>
      </span>
    ),
  },
  { key: 'short', header: 'Short description', className: 'max-w-sm', render: (service) => <span className="line-clamp-2 text-slate-600">{service.shortDescription}</span> },
  { key: 'status', header: 'Status', render: (service) => <StatusBadge status={service.isActive ? 'confirmed' : 'cancelled'} label={service.isActive ? 'Visible' : 'Hidden'} /> },
];

export default function ServicesAdminPage() {
  return (
    <ResourceManager
      title="Services"
      description="The services listed on the website. Use the arrows to change the order they appear in."
      singular="Service"
      api={services}
      columns={columns}
      fields={fields}
      initial={initial}
      canReorder
    />
  );
}
