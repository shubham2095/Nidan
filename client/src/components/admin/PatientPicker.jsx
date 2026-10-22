import { useState } from 'react';
import { Check, X } from 'lucide-react';
import useDebounce from '../../hooks/useDebounce.js';
import useFetch from '../../hooks/useFetch.js';
import { listPatients } from '../../services/crmService.js';
import { ageText } from '../../utils/crm.js';
import StatusBadge from './StatusBadge.jsx';

/** Search existing patients by name, phone, code or tag and pick one. `value` is the chosen patient (or null). */
export default function PatientPicker({ value, onChange, error }) {
  const [text, setText] = useState('');
  const query = useDebounce(text.trim());
  const results = useFetch(
    (signal) => (query.length >= 2 ? listPatients({ q: query, pageSize: 8 }, signal) : Promise.resolve(null)),
    [query],
  );

  if (value) {
    return (
      <div className="flex items-center justify-between gap-3 rounded-2xl border border-brand-200 bg-brand-50 p-4">
        <div>
          <p className="flex items-center gap-2 font-bold text-slate-900">
            <Check className="h-4 w-4 text-brand-700" aria-hidden="true" />
            {value.name}
            <StatusBadge status={value.type} />
          </p>
          <p className="text-sm text-slate-600">
            {value.patientCode} · {value.phone}
            {value.dob && ` · ${ageText(value.dob)}`}
          </p>
        </div>
        <button type="button" onClick={() => onChange(null)} aria-label="Choose a different patient" className="rounded-full p-2 text-slate-500 hover:bg-white">
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    );
  }

  return (
    <div>
      <label htmlFor="patient-search" className="mb-1.5 block text-sm font-semibold text-slate-800">
        Find patient by name, phone or ID
      </label>
      <input id="patient-search" value={text} onChange={(event) => setText(event.target.value)} placeholder="Start typing…" autoComplete="off" aria-invalid={error ? 'true' : undefined} className="field-input" />
      {error && <p role="alert" className="mt-1 text-sm text-red-600">{error}</p>}
      {results.data && (
        <ul className="mt-2 max-h-56 divide-y divide-slate-100 overflow-y-auto rounded-2xl border border-slate-200 bg-white">
          {results.data.items.length === 0 && <li className="px-4 py-3 text-sm text-slate-500">No patients found. Use “New patient” instead.</li>}
          {results.data.items.map((patient) => (
            <li key={patient.id}>
              <button type="button" onClick={() => onChange(patient)} className="flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left hover:bg-brand-50">
                <span>
                  <span className="block text-sm font-semibold text-slate-900">{patient.name}</span>
                  <span className="block text-xs text-slate-500">
                    {patient.patientCode} · {patient.phone}
                  </span>
                </span>
                <StatusBadge status={patient.type} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
