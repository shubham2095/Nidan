import { useMemo, useState } from 'react';
import { AlertTriangle, Loader2, Plus, Trash2 } from 'lucide-react';
import { useToast } from '../../context/ToastContext.jsx';
import { saveSchedules } from '../../services/adminService.js';
import { formatDays } from '../../utils/schedule.js';
import { formatTime } from '../../utils/format.js';
import Button from '../public/Button.jsx';

const DAYS = [[1, 'Mon'], [2, 'Tue'], [3, 'Wed'], [4, 'Thu'], [5, 'Fri'], [6, 'Sat'], [0, 'Sun']];
const hhmm = (time) => time.slice(0, 5);
let nextKey = 1;

/** Groups raw rows into editable blocks: "these days, this place, these hours". */
const toBlocks = (rows) => {
  const groups = new Map();
  for (const row of rows) {
    const id = `${row.locationId}|${hhmm(row.startTime)}|${hhmm(row.endTime)}`;
    const group = groups.get(id) || { key: nextKey++, locationId: row.locationId, startTime: hhmm(row.startTime), endTime: hhmm(row.endTime), days: [] };
    group.days.push(row.weekday);
    groups.set(id, group);
  }
  return [...groups.values()].sort((a, b) => a.locationId - b.locationId || a.startTime.localeCompare(b.startTime));
};

const toRows = (blocks) => blocks.flatMap((block, blockIndex) => block.days.map((weekday) => ({ locationId: Number(block.locationId), weekday, startTime: block.startTime, endTime: block.endTime, blockIndex })));

/** Different places on the same day and hours: bookings still cannot clash (they are blocked per doctor), but staff should know. */
const crossLocationOverlaps = (blocks) => {
  const warnings = new Set();
  blocks.forEach((a, i) => blocks.forEach((b, j) => {
    if (j <= i || Number(a.locationId) === Number(b.locationId)) return;
    const sharedDay = a.days.some((day) => b.days.includes(day));
    if (sharedDay && a.startTime < b.endTime && b.startTime < a.endTime) { warnings.add(i); warnings.add(j); }
  }));
  return warnings;
};

/** Weekly timetable: add a block for each place and set of days. Saving replaces the whole timetable. */
export default function ScheduleEditor({ doctor, locations, canEdit, onSaved }) {
  const toast = useToast();
  const [blocks, setBlocks] = useState(() => toBlocks(doctor.schedules));
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState(null);
  const [busy, setBusy] = useState(false);
  const warnings = useMemo(() => crossLocationOverlaps(blocks), [blocks]);
  const locationName = (id) => locations.find((location) => location.id === Number(id))?.name || 'Unknown location';

  const patch = (index, changes) => setBlocks((current) => current.map((block, i) => (i === index ? { ...block, ...changes } : block)));
  const toggleDay = (index, day) => {
    const block = blocks[index];
    patch(index, { days: block.days.includes(day) ? block.days.filter((d) => d !== day) : [...block.days, day] });
  };
  const add = () => setBlocks((current) => [...current, { key: nextKey++, locationId: locations[0]?.id, days: [1, 2, 3, 4, 5], startTime: '09:00', endTime: '13:00' }]);

  const save = async () => {
    const found = {};
    blocks.forEach((block, index) => {
      if (!block.days.length) found[index] = 'Choose at least one day';
      else if (block.endTime <= block.startTime) found[index] = 'The end time must be after the start time';
    });
    setErrors(found);
    if (Object.keys(found).length) {
      setFormError('Please fix the highlighted time ranges.');
      return;
    }

    setBusy(true);
    setFormError(null);
    const rows = toRows(blocks);
    try {
      const { doctor: updated } = await saveSchedules(doctor.id, rows.map(({ blockIndex, ...row }) => row));
      toast.success('Timetable saved. The booking page uses it straight away.');
      setBlocks(toBlocks(updated.schedules));
      onSaved(updated);
    } catch (error) {
      const next = {};
      for (const detail of error.response?.data?.details || []) {
        const match = /^schedules\.(\d+)\./.exec(detail.field || '');
        if (match && rows[Number(match[1])]) next[rows[Number(match[1])].blockIndex] = detail.message;
      }
      setErrors(next);
      setFormError(error.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      {blocks.length === 0 && <p className="mb-3 text-sm text-slate-600">No timetable yet. Patients cannot book online until at least one time range is added.</p>}
      <ul className="space-y-3">
        {blocks.map((block, index) => (
          <li key={block.key} className={`rounded-2xl border p-4 ${errors[index] ? 'border-red-300 bg-red-50/40' : 'border-slate-200 bg-white'}`}>
            {canEdit ? (
              <div className="space-y-3">
                <div className="grid gap-3 sm:grid-cols-[1fr_9.5rem_9.5rem_auto] sm:items-end">
                  <label className="block text-sm font-semibold text-slate-800">
                    Location
                    <select value={block.locationId} onChange={(event) => patch(index, { locationId: Number(event.target.value) })} className="field-input mt-1.5 py-2 text-sm">
                      {locations.map((location) => (
                        <option key={location.id} value={location.id}>{location.name}</option>
                      ))}
                    </select>
                  </label>
                  <label className="block text-sm font-semibold text-slate-800">
                    From
                    <input type="time" value={block.startTime} onChange={(event) => patch(index, { startTime: event.target.value })} className="field-input mt-1.5 py-2 text-sm" />
                  </label>
                  <label className="block text-sm font-semibold text-slate-800">
                    To
                    <input type="time" value={block.endTime} onChange={(event) => patch(index, { endTime: event.target.value })} className="field-input mt-1.5 py-2 text-sm" />
                  </label>
                  <button type="button" onClick={() => setBlocks((current) => current.filter((_, i) => i !== index))} aria-label="Remove this time range" className="grid h-10 w-10 place-items-center rounded-full text-slate-400 hover:bg-red-50 hover:text-red-600">
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
                <div role="group" aria-label="Days" className="flex flex-wrap gap-1.5">
                  {DAYS.map(([day, label]) => (
                    <button key={day} type="button" aria-pressed={block.days.includes(day)} onClick={() => toggleDay(index, day)} className={`rounded-full px-3.5 py-1.5 text-sm font-semibold ${block.days.includes(day) ? 'bg-brand-700 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-sm">
                <strong className="text-slate-900">{locationName(block.locationId)}</strong>
                <span className="block text-slate-600">{formatDays(block.days)} · {formatTime(`${block.startTime}:00`)} – {formatTime(`${block.endTime}:00`)}</span>
              </p>
            )}
            {errors[index] && <p role="alert" className="mt-2 text-sm text-red-600">{errors[index]}</p>}
            {warnings.has(index) && (
              <p className="mt-2 flex items-start gap-2 text-sm text-amber-800">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                These hours overlap with another location. Patients cannot be double-booked, but a time booked at one place disappears from the other.
              </p>
            )}
          </li>
        ))}
      </ul>

      {canEdit && (
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Button variant="outline" onClick={add}>
            <Plus className="h-4 w-4" aria-hidden="true" />
            Add time range
          </Button>
          <Button onClick={save} disabled={busy}>
            {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
            Save timetable
          </Button>
          {formError && <p role="alert" className="text-sm text-red-600">{formError}</p>}
        </div>
      )}
    </div>
  );
}
