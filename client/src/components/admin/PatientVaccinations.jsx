import { useState } from 'react';
import { Syringe } from 'lucide-react';
import { EmptyState, ErrorState, LoadingState } from '../public/States.jsx';
import Button from '../public/Button.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import useFetch from '../../hooks/useFetch.js';
import { getPatientVaccinations, markVaccination } from '../../services/adminService.js';
import { formatDateOnly } from '../../utils/format.js';
import MarkGivenModal from './MarkGivenModal.jsx';
import StatusBadge from './StatusBadge.jsx';

/** A child's vaccine timeline, worked out from their date of birth. */
export default function PatientVaccinations({ patient }) {
  const toast = useToast();
  const { data, loading, error, reload } = useFetch((signal) => getPatientVaccinations(patient.id, signal), [patient.id, patient.dob]);
  const [recording, setRecording] = useState(null);

  if (loading && !data) return <LoadingState className="py-10" />;
  if (error) return <ErrorState message={error} onRetry={reload} className="py-10" />;
  if (!data.eligible) return <EmptyState title="No vaccination schedule" message={data.reason} className="py-8" />;

  const given = data.items.filter((item) => item.status === 'given').length;
  const clear = async (item) => {
    try {
      await markVaccination(patient.id, item.id, { givenDate: null });
      toast.success('Dose cleared.');
      reload();
    } catch (failure) {
      toast.error(failure.message);
    }
  };

  return (
    <div>
      <p className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-700">
        <Syringe className="h-4 w-4 text-brand-700" aria-hidden="true" />
        {given} of {data.items.length} doses given
      </p>
      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
        <table className="w-full min-w-[30rem] text-left text-sm">
          <caption className="sr-only">Vaccination schedule</caption>
          <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold tracking-wide text-slate-500 uppercase">
            <tr>
              <th scope="col" className="px-4 py-3">Vaccine</th>
              <th scope="col" className="px-4 py-3">Due</th>
              <th scope="col" className="px-4 py-3">Status</th>
              <th scope="col" className="px-4 py-3"><span className="sr-only">Action</span></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data.items.map((item) => (
              <tr key={item.id}>
                <td className="px-4 py-3">
                  <span className="block font-semibold text-slate-900">{item.vaccine.name}</span>
                  <span className="block text-xs text-slate-500">{item.vaccine.ageLabel}</span>
                  {item.notes && <span className="block text-xs text-slate-500 italic">{item.notes}</span>}
                </td>
                <td className="px-4 py-3 whitespace-nowrap">{formatDateOnly(item.dueDate, { short: true })}</td>
                <td className="px-4 py-3">
                  <StatusBadge status={item.status} label={item.status === 'given' ? `Given ${formatDateOnly(item.givenDate, { short: true })}` : item.status === 'due_soon' ? 'Due soon' : undefined} />
                  {item.givenBy && <span className="mt-1 block text-xs text-slate-500">by {item.givenBy.name}</span>}
                </td>
                <td className="px-4 py-3 text-right whitespace-nowrap">
                  {item.status === 'given' ? (
                    <button type="button" onClick={() => clear(item)} className="text-sm font-semibold text-slate-500 hover:text-red-600 hover:underline">Clear</button>
                  ) : (
                    <Button variant="outline" onClick={() => setRecording(item)}>Record</Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {recording && <MarkGivenModal patientId={patient.id} childName={patient.name} record={recording} onClose={() => setRecording(null)} onSaved={reload} />}
    </div>
  );
}
