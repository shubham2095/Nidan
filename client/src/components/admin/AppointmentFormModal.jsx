import { useMemo, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useToast } from '../../context/ToastContext.jsx';
import useClinicOptions from '../../hooks/useClinicOptions.js';
import useFetch from '../../hooks/useFetch.js';
import { createAppointment, getStaffDates, getStaffSlots } from '../../services/crmService.js';
import { emptyPatient, serverFieldErrors, toPatientPayload, validatePatient } from '../../utils/crm.js';
import { formatDateOnly, formatTime } from '../../utils/format.js';
import Button from '../public/Button.jsx';
import DatePicker from '../public/DatePicker.jsx';
import { ConsentCheckbox, Field, FormMessage } from '../public/FormField.jsx';
import SlotPicker from '../public/SlotPicker.jsx';
import { LoadingState } from '../public/States.jsx';
import Modal from './Modal.jsx';
import PatientFields from './PatientFields.jsx';
import PatientPicker from './PatientPicker.jsx';

const section = 'font-heading text-base font-extrabold text-slate-900';

/** Phone / walk-in booking made by reception. `presetPatient` pre-selects an existing patient. */
export default function AppointmentFormModal({ presetPatient = null, onClose, onCreated }) {
  const toast = useToast();
  const options = useClinicOptions();

  const [mode, setMode] = useState('existing');
  const [patient, setPatient] = useState(presetPatient);
  const [fresh, setFresh] = useState(emptyPatient());
  const [consent, setConsent] = useState(false);
  const [doctorId, setDoctorId] = useState('');
  const [locationId, setLocationId] = useState('');
  const [date, setDate] = useState('');
  const [slot, setSlot] = useState(null);
  const [source, setSource] = useState('phone');
  const [status, setStatus] = useState('confirmed');
  const [reason, setReason] = useState('');
  const [staffNote, setStaffNote] = useState('');
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState(null);
  const [busy, setBusy] = useState(false);

  const doctor = options.doctors.find((item) => String(item.id) === doctorId);
  const locations = useMemo(() => doctor?.schedules.map((entry) => entry.location) || [], [doctor]);

  const dates = useFetch(
    (signal) => (doctorId && locationId ? getStaffDates({ doctorId, locationId }, signal) : Promise.resolve(null)),
    [doctorId, locationId],
  );
  const slots = useFetch(
    (signal) => (doctorId && locationId && date ? getStaffSlots({ doctorId, locationId, date }, signal) : Promise.resolve(null)),
    [doctorId, locationId, date],
  );

  const patch = (changes) => setFresh((current) => ({ ...current, ...changes }));

  const chooseDoctor = (value) => {
    setDoctorId(value);
    const found = options.doctors.find((item) => String(item.id) === value);
    const only = found?.schedules.length === 1 ? String(found.schedules[0].location.id) : '';
    setLocationId(only);
    setDate('');
    setSlot(null);
  };

  const submit = async (event) => {
    event.preventDefault();
    const found = {};
    if (mode === 'existing' && !patient) found.patient = 'Choose a patient, or switch to “New patient”.';
    if (mode === 'new') {
      Object.assign(found, validatePatient(fresh));
      if (!consent) found.consent = 'Confirm that the patient agrees to their details being stored.';
    }
    if (!doctorId) found.doctor = 'Choose a doctor';
    if (!locationId) found.location = 'Choose a location';
    if (!slot) found.slot = 'Choose a date and a time';
    setErrors(found);
    if (Object.keys(found).length) {
      setFormError('Please complete the highlighted parts.');
      return;
    }

    setBusy(true);
    setFormError(null);
    try {
      const payload = {
        ...(mode === 'existing' ? { patientId: patient.id } : { newPatient: { ...toPatientPayload(fresh), consent: true } }),
        doctorId: Number(doctorId),
        locationId: Number(locationId),
        date,
        startTime: slot.startTime.slice(0, 5),
        source,
        status,
        reason: reason || undefined,
        staffNote: staffNote || undefined,
      };
      const { appointment } = await createAppointment(payload);
      toast.success(`Booked ${appointment.bookingRef} for ${formatDateOnly(appointment.appointmentDate)}, ${formatTime(appointment.startTime)}.`);
      onCreated(appointment);
      onClose();
    } catch (error) {
      if (error.response?.data?.details?.code === 'slot_unavailable') {
        setSlot(null);
        slots.reload();
      }
      const { fields, message } = serverFieldErrors(error);
      setErrors(fields);
      setFormError(message);
      setBusy(false);
    }
  };

  return (
    <Modal
      title="New appointment"
      size="xl"
      onClose={onClose}
      dismissible={!busy}
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button type="submit" form="appointment-form" disabled={busy}>
            {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
            Book appointment
          </Button>
        </>
      }
    >
      <form id="appointment-form" onSubmit={submit} noValidate className="space-y-8">
        <section aria-labelledby="af-patient">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <h3 id="af-patient" className={section}>
              1. Patient
            </h3>
            <div role="group" aria-label="Patient source" className="flex rounded-full bg-slate-100 p-1 text-sm font-semibold">
              {[['existing', 'Existing patient'], ['new', 'New patient']].map(([key, label]) => (
                <button key={key} type="button" aria-pressed={mode === key} onClick={() => setMode(key)} className={`rounded-full px-4 py-1.5 ${mode === key ? 'bg-white shadow-sm' : 'text-slate-600'}`}>
                  {label}
                </button>
              ))}
            </div>
          </div>
          {mode === 'existing' ? (
            <PatientPicker value={patient} onChange={setPatient} error={errors.patient || errors.patientId} />
          ) : (
            <div className="space-y-4">
              <PatientFields value={fresh} onChange={patch} errors={errors} />
              <ConsentCheckbox checked={consent} onChange={(event) => setConsent(event.target.checked)} error={errors.consent}>
                The patient (or parent) has agreed to their details being stored for their care.
              </ConsentCheckbox>
            </div>
          )}
        </section>

        <section aria-labelledby="af-when">
          <h3 id="af-when" className={`${section} mb-3`}>
            2. Doctor, date and time
          </h3>
          {options.loading ? (
            <LoadingState className="py-6" />
          ) : (
            <div className="space-y-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Doctor" required error={errors.doctor || errors.doctorId}>
                  {(props) => (
                    <select {...props} value={doctorId} onChange={(event) => chooseDoctor(event.target.value)} className="field-input">
                      <option value="">Choose a doctor</option>
                      {options.doctors.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.name}
                        </option>
                      ))}
                    </select>
                  )}
                </Field>
                <Field label="Location" required error={errors.location || errors.locationId}>
                  {(props) => (
                    <select {...props} value={locationId} onChange={(event) => { setLocationId(event.target.value); setDate(''); setSlot(null); }} disabled={!doctor} className="field-input">
                      <option value="">{doctor ? 'Choose a location' : 'Choose a doctor first'}</option>
                      {locations.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.name}
                        </option>
                      ))}
                    </select>
                  )}
                </Field>
              </div>

              {doctorId && locationId && (
                <div className="grid gap-6 lg:grid-cols-2">
                  <div>
                    {dates.loading && <LoadingState className="py-8" />}
                    {dates.data && !dates.data.dates.length && <p className="text-sm text-slate-600">No free dates for this doctor and location.</p>}
                    {dates.data?.dates.length > 0 && <DatePicker dates={dates.data.dates} value={date} onChange={(value) => { setDate(value); setSlot(null); }} />}
                  </div>
                  <div>
                    {!date && <p className="text-sm text-slate-500">Choose a date to see the free times.</p>}
                    {date && slots.loading && <LoadingState className="py-8" />}
                    {slots.data && !slots.data.slots.length && <p className="text-sm text-slate-600">No free times on this day.</p>}
                    {slots.data?.slots.length > 0 && (
                      <>
                        <p className="mb-3 text-sm font-semibold text-slate-700">{formatDateOnly(date)}</p>
                        <SlotPicker slots={slots.data.slots} value={slot?.startTime} onChange={setSlot} />
                      </>
                    )}
                  </div>
                </div>
              )}
              {errors.slot && <p role="alert" className="text-sm text-red-600">{errors.slot}</p>}
              {errors.startTime && <p role="alert" className="text-sm text-red-600">{errors.startTime}</p>}
            </div>
          )}
        </section>

        <section aria-labelledby="af-details">
          <h3 id="af-details" className={`${section} mb-3`}>
            3. Details
          </h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="How was it booked?" required>
              {(props) => (
                <select {...props} value={source} onChange={(event) => setSource(event.target.value)} className="field-input">
                  <option value="phone">Phone call</option>
                  <option value="walk_in">Walk-in</option>
                </select>
              )}
            </Field>
            <Field label="Status" hint="Phone and walk-in bookings are usually confirmed straight away.">
              {(props) => (
                <select {...props} value={status} onChange={(event) => setStatus(event.target.value)} className="field-input">
                  <option value="confirmed">Confirmed</option>
                  <option value="pending">Pending</option>
                </select>
              )}
            </Field>
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Field label="Reason for visit (optional)" error={errors.reason}>
              {(props) => <textarea {...props} rows={2} value={reason} onChange={(event) => setReason(event.target.value)} maxLength={500} className="field-input" />}
            </Field>
            <Field label="Internal note (optional)" hint="Only staff can see this." error={errors.staffNote}>
              {(props) => <textarea {...props} rows={2} value={staffNote} onChange={(event) => setStaffNote(event.target.value)} maxLength={1000} className="field-input" />}
            </Field>
          </div>
        </section>

        <FormMessage type="error">{formError}</FormMessage>
      </form>
    </Modal>
  );
}
