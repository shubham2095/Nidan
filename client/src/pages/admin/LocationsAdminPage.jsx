import ResourceManager from '../../components/admin/ResourceManager.jsx';
import StatusBadge from '../../components/admin/StatusBadge.jsx';
import { locations } from '../../services/adminService.js';

const initial = {
  name: '', slug: '', address: '', city: 'Noida', state: 'Uttar Pradesh', postalCode: '', phone: '', mapUrl: '', mapEmbedUrl: '',
  isOwnClinic: true, isActive: true,
};

const fields = [
  { name: 'name', label: 'Name', required: true, hint: 'e.g. Nidan – Sector 51' },
  { name: 'slug', label: 'Web address', hint: 'Leave empty to create it from the name' },
  { name: 'address', label: 'Address', type: 'textarea', rows: 2, required: true },
  { name: 'city', label: 'City', required: true },
  { name: 'state', label: 'State', required: true },
  { name: 'postalCode', label: 'PIN code' },
  { name: 'phone', label: 'Phone (optional)' },
  { name: 'mapUrl', label: 'Google Maps link (optional)', type: 'url', wide: true, hint: 'Leave empty to create it from the address' },
  { name: 'mapEmbedUrl', label: 'Map embed link (optional)', type: 'url', wide: true, hint: 'Leave empty to create it from the address' },
  { name: 'isOwnClinic', type: 'checkbox', checkboxLabel: 'This is one of our own clinics', hint: 'Own clinics are listed in the website footer and contact page. Partner hospitals are not.' },
  { name: 'isActive', type: 'checkbox', checkboxLabel: 'In use', hint: 'Switch off to stop new bookings and hide it from the website. Old appointments are kept.' },
];

const columns = [
  {
    key: 'name',
    header: 'Location',
    render: (location) => (
      <span>
        <span className="block font-semibold text-slate-900">{location.name}</span>
        <span className="block text-xs text-slate-500">{location.isOwnClinic ? 'Our clinic' : 'Partner hospital'}</span>
      </span>
    ),
  },
  { key: 'address', header: 'Address', className: 'max-w-xs', render: (location) => <span className="text-slate-600">{location.address}, {location.city}{location.postalCode && ` ${location.postalCode}`}</span> },
  { key: 'phone', header: 'Phone', className: 'whitespace-nowrap', render: (location) => location.phone || <span className="text-slate-400">—</span> },
  { key: 'status', header: 'Status', render: (location) => <StatusBadge status={location.isActive ? 'confirmed' : 'cancelled'} label={location.isActive ? 'In use' : 'Switched off'} /> },
];

export default function LocationsAdminPage() {
  return (
    <ResourceManager
      title="Locations"
      description="Clinics and hospitals where the doctors see patients."
      singular="Location"
      api={locations}
      columns={columns}
      fields={fields}
      initial={initial}
      canReorder
      deleteMessage={(location) => `“${location.name}” will be removed. A location with appointments or timetables cannot be deleted: switch it off instead.`}
    />
  );
}
