import Icon from './Icon.jsx';

export default function SpecialtyCard({ specialty }) {
  return (
    <div className="flex gap-4 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-blush-100">
      <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-blush-100 text-blush-600">
        <Icon name={specialty.icon} className="h-6 w-6" />
      </span>
      <div>
        <h3 className="text-lg font-bold">{specialty.title}</h3>
        <p className="mt-1 text-sm leading-relaxed text-slate-600">{specialty.description}</p>
      </div>
    </div>
  );
}
