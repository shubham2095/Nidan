import { Field } from '../public/FormField.jsx';
import Icon, { ICON_NAMES } from '../public/Icon.jsx';
import ImageUpload from './ImageUpload.jsx';
import RichTextEditor from './RichTextEditor.jsx';

/**
 * One form field chosen by `field.type`: text (default) / url / email / tel / number / textarea / select / icon / checkbox /
 * richtext / image. `onChange(name, value)` receives raw values (strings, booleans).
 */
export default function FieldInput({ field, value, error, onChange }) {
  const set = (next) => onChange(field.name, next);

  if (field.type === 'richtext') {
    return (
      <div className="sm:col-span-2">
        <span className="mb-1.5 block text-sm font-semibold text-slate-800">{field.label}</span>
        <RichTextEditor value={value} onChange={set} label={field.label} minHeight={field.minHeight || '12rem'} />
        {error && <p role="alert" className="mt-1 text-sm text-red-600">{error}</p>}
      </div>
    );
  }
  if (field.type === 'image') {
    return (
      <div className="sm:col-span-2">
        <ImageUpload label={field.label} value={value} onChange={(url) => set(url || '')} upload={(file) => field.upload(file)} hint={field.hint} />
        {error && <p role="alert" className="mt-1 text-sm text-red-600">{error}</p>}
      </div>
    );
  }
  if (field.type === 'checkbox') {
    return (
      <div className="sm:col-span-2">
        <label className="flex items-center gap-3 text-sm font-medium text-slate-800">
          <input type="checkbox" checked={Boolean(value)} onChange={(event) => set(event.target.checked)} className="h-5 w-5 rounded border-slate-300 text-brand-700" />
          {field.checkboxLabel}
        </label>
        {field.hint && <p className="mt-1 ml-8 text-xs text-slate-500">{field.hint}</p>}
      </div>
    );
  }

  return (
    <div className={field.wide || field.type === 'textarea' ? 'sm:col-span-2' : ''}>
      <Field label={field.label} required={field.required} hint={field.hint} error={error}>
        {(props) => {
          if (field.type === 'textarea') return <textarea {...props} rows={field.rows || 3} value={value ?? ''} onChange={(event) => set(event.target.value)} className="field-input" />;
          if (field.type === 'select') {
            return (
              <select {...props} value={value ?? ''} onChange={(event) => set(event.target.value)} className="field-input">
                {field.options.map(([optionValue, optionLabel]) => (
                  <option key={optionValue} value={optionValue}>{optionLabel}</option>
                ))}
              </select>
            );
          }
          if (field.type === 'icon') {
            return (
              <div className="flex items-center gap-3">
                <select {...props} value={value ?? ''} onChange={(event) => set(event.target.value)} className="field-input">
                  <option value="">No icon</option>
                  {ICON_NAMES.map((name) => (
                    <option key={name} value={name}>{name}</option>
                  ))}
                </select>
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-700">{value ? <Icon name={value} className="h-5 w-5" /> : null}</span>
              </div>
            );
          }
          return <input {...props} type={field.type || 'text'} autoComplete={field.autoComplete} value={value ?? ''} onChange={(event) => set(event.target.value)} className="field-input" />;
        }}
      </Field>
    </div>
  );
}
