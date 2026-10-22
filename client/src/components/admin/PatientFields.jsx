import { Baby, UserRound } from 'lucide-react';
import { Field } from '../public/FormField.jsx';
import { todayIso } from '../../utils/crm.js';

const TYPES = [
  { value: 'mother', label: 'Mother / Woman', Icon: UserRound },
  { value: 'child', label: 'Child', Icon: Baby },
];

/**
 * Controlled patient fields. `value` is the form state from utils/crm.js (emptyPatient),
 * `onChange(patch)` merges changes, and `errors` is { field: message }.
 * `showTags` adds the tags box; `compact` hides gender.
 */
export default function PatientFields({ value, onChange, errors = {}, showTags = false, phoneReadOnly = false, hideContact = false }) {
  const child = value.type === 'child';
  const set = (field) => (event) => onChange({ [field]: event.target.value });

  return (
    <div className="space-y-4">
      <fieldset>
        <legend className="mb-2 text-sm font-semibold text-slate-800">Patient type</legend>
        <div className="grid grid-cols-2 gap-3">
          {TYPES.map(({ value: type, label, Icon }) => (
            <label key={type} className="block">
              <input type="radio" name="patient-type" value={type} checked={value.type === type} onChange={() => onChange({ type })} className="peer sr-only" />
              <span className="flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-semibold transition-colors peer-checked:border-brand-600 peer-checked:bg-brand-50 peer-focus-visible:outline-2 peer-focus-visible:outline-brand-600">
                <Icon className="h-4 w-4 text-brand-700" aria-hidden="true" />
                {label}
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={child ? "Child's full name" : 'Full name'} required error={errors.name}>
          {(props) => <input {...props} value={value.name} onChange={set('name')} autoComplete="off" className="field-input" />}
        </Field>
        {!hideContact && (
          <>
            <Field label="Mobile number" required error={errors.phone}>
              {(props) => <input {...props} value={value.phone} onChange={set('phone')} readOnly={phoneReadOnly} type="tel" inputMode="tel" autoComplete="off" className={`field-input ${phoneReadOnly ? 'bg-slate-50 text-slate-500' : ''}`} />}
            </Field>
            <Field label="Email (optional)" error={errors.email}>
              {(props) => <input {...props} value={value.email} onChange={set('email')} type="email" autoComplete="off" className="field-input" />}
            </Field>
          </>
        )}
        <Field label="Gender (optional)" error={errors.gender}>
          {(props) => (
            <select {...props} value={value.gender} onChange={set('gender')} className="field-input">
              <option value="">Not stated</option>
              <option value="female">Female</option>
              <option value="male">Male</option>
              <option value="other">Other</option>
            </select>
          )}
        </Field>
      </div>

      {child && (
        <div className="space-y-4 rounded-2xl bg-brand-50/60 p-4">
          <Field label="Parent / guardian name" required error={errors.guardianName}>
            {(props) => <input {...props} value={value.guardianName} onChange={set('guardianName')} autoComplete="off" className="field-input" />}
          </Field>
          <fieldset className="space-y-3">
            <legend className="text-sm font-semibold text-slate-800">Child&apos;s age</legend>
            <div className="flex flex-wrap gap-5 text-sm">
              <label className="flex items-center gap-2">
                <input type="radio" name="age-mode" checked={value.ageMode === 'dob'} onChange={() => onChange({ ageMode: 'dob' })} className="h-4 w-4 text-brand-700" />
                Date of birth
              </label>
              <label className="flex items-center gap-2">
                <input type="radio" name="age-mode" checked={value.ageMode === 'age'} onChange={() => onChange({ ageMode: 'age' })} className="h-4 w-4 text-brand-700" />
                Age only
              </label>
            </div>
            {value.ageMode === 'dob' ? (
              <div className="max-w-xs">
                <Field label="Date of birth" required error={errors.dob}>
                  {(props) => <input {...props} value={value.dob} onChange={set('dob')} type="date" max={todayIso()} className="field-input" />}
                </Field>
              </div>
            ) : (
              <div className="grid max-w-xs grid-cols-2 gap-3">
                <Field label="Years" required error={errors.ageYears}>
                  {(props) => <input {...props} value={value.ageYears} onChange={set('ageYears')} type="number" inputMode="numeric" min="0" max="18" className="field-input" />}
                </Field>
                <Field label="Months" error={errors.ageMonths}>
                  {(props) => <input {...props} value={value.ageMonths} onChange={set('ageMonths')} type="number" inputMode="numeric" min="0" max="11" className="field-input" />}
                </Field>
              </div>
            )}
          </fieldset>
        </div>
      )}

      {showTags && (
        <Field label="Tags (optional)" hint="Separate with commas, e.g. high-risk, vaccination" error={errors.tags}>
          {(props) => <input {...props} value={value.tags} onChange={set('tags')} className="field-input" />}
        </Field>
      )}
    </div>
  );
}
