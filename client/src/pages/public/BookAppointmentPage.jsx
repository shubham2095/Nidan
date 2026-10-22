import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ArrowLeft, MapPin } from 'lucide-react';
import BookingConfirmation from '../../components/public/BookingConfirmation.jsx';
import BookingStepper from '../../components/public/BookingStepper.jsx';
import BookingSummary from '../../components/public/BookingSummary.jsx';
import Container from '../../components/public/Container.jsx';
import DatePicker from '../../components/public/DatePicker.jsx';
import DoctorAvatar from '../../components/public/DoctorAvatar.jsx';
import HelpBar from '../../components/public/HelpBar.jsx';
import PageHeader from '../../components/public/PageHeader.jsx';
import PatientDetailsForm from '../../components/public/PatientDetailsForm.jsx';
import Seo from '../../components/public/Seo.jsx';
import SlotPicker from '../../components/public/SlotPicker.jsx';
import { ErrorState, LoadingState } from '../../components/public/States.jsx';
import { FormMessage } from '../../components/public/FormField.jsx';
import useFetch from '../../hooks/useFetch.js';
import { getBookingDates, getBookingSlots, getDoctors } from '../../services/publicService.js';
import { formatDateOnly } from '../../utils/format.js';
import { groupSchedule } from '../../utils/schedule.js';

const EMPTY = { doctor: null, location: null, date: null, slot: null };
const CONFIRMATION = 6;

export default function BookAppointmentPage() {
  const [params] = useSearchParams();
  const [step, setStep] = useState(1);
  const [selection, setSelection] = useState(EMPTY);
  const [booking, setBooking] = useState(null);
  const [notice, setNotice] = useState(null);
  const prefilled = useRef(false);
  const card = useRef(null);

  const doctors = useFetch((signal) => getDoctors(signal), []);
  const { doctor, location, date } = selection;

  const dates = useFetch(
    (signal) => (doctor && location ? getBookingDates({ doctorId: doctor.id, locationId: location.id }, signal) : Promise.resolve(null)),
    [doctor?.id, location?.id, step === 3],
  );
  const slots = useFetch(
    (signal) =>
      doctor && location && date
        ? getBookingSlots({ doctorId: doctor.id, locationId: location.id, date }, signal)
        : Promise.resolve(null),
    [doctor?.id, location?.id, date, step === 4],
  );

  // Links such as /book-appointment?doctor=dr-rajeev-ranjan&location=nidan-sector-51 start part-way through.
  useEffect(() => {
    if (prefilled.current || !doctors.data) return;
    prefilled.current = true;
    const chosen = doctors.data.items.find((item) => item.slug === params.get('doctor'));
    if (!chosen) return;
    const options = chosen.schedules.map((entry) => entry.location);
    const preferred = options.find((item) => item.slug === params.get('location')) || (options.length === 1 ? options[0] : null);
    setSelection({ ...EMPTY, doctor: chosen, location: preferred });
    setStep(preferred ? 3 : 2);
  }, [doctors.data, params]);

  // Move focus and scroll to the top of the card when the step changes so keyboard and screen-reader users land in the right place.
  const previousStep = useRef(step);
  useEffect(() => {
    if (previousStep.current === step) return;
    previousStep.current = step;
    card.current?.focus({ preventScroll: true });
    card.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [step]);

  const goTo = (target) => {
    setNotice(null);
    setStep(target);
  };

  const chooseDoctor = (chosen) => {
    if (chosen.id === doctor?.id) return goTo(location ? 3 : 2);
    const options = chosen.schedules.map((entry) => entry.location);
    const onlyLocation = options.length === 1 ? options[0] : null;
    setSelection({ ...EMPTY, doctor: chosen, location: onlyLocation });
    return goTo(onlyLocation ? 3 : 2);
  };

  const chooseLocation = (chosen) => {
    if (chosen.id !== location?.id) setSelection((current) => ({ ...current, location: chosen, date: null, slot: null }));
    goTo(3);
  };

  const chooseDate = (chosen) => {
    if (chosen !== date) setSelection((current) => ({ ...current, date: chosen, slot: null }));
    goTo(4);
  };

  const chooseSlot = (chosen) => {
    setSelection((current) => ({ ...current, slot: chosen }));
    goTo(5);
  };

  const slotLost = (message) => {
    setSelection((current) => ({ ...current, slot: null }));
    setNotice(message);
    setStep(4);
  };

  const reset = () => {
    setSelection(EMPTY);
    setBooking(null);
    goTo(1);
  };

  const interest = doctor ? `${doctor.name}${location ? ` at ${location.name}` : ''}` : '';

  return (
    <>
      <Seo title="Book an Appointment" description="Book an appointment online with Dr. Manisha Ranjan or Dr. Rajeev Ranjan at Nidan Mother & Child Care, Noida. Choose a doctor, location, date and time." />
      <PageHeader title="Book an Appointment" crumbs={[{ label: 'Book Appointment' }]} description="Choose your doctor, a convenient time and share a few details. It takes about a minute." />

      <Container size="narrow" className="py-10 sm:py-14">
        <div ref={card} tabIndex={-1} className="scroll-mt-24 rounded-3xl border border-slate-100 bg-white p-5 shadow-sm outline-none sm:p-8">
          {step < CONFIRMATION && (
            <div className="mb-8">
              <BookingStepper current={step} onGo={goTo} />
            </div>
          )}

          {step < CONFIRMATION && step > 1 && <BookingSummary selection={selection} onGo={goTo} />}
          {notice && (
            <div className="mb-6">
              <FormMessage type="error">{notice}</FormMessage>
            </div>
          )}

          {step === 1 && (
            <section aria-labelledby="step-doctor">
              <h2 id="step-doctor" className="text-2xl font-extrabold">Choose your doctor</h2>
              {doctors.loading && <LoadingState />}
              {doctors.error && <ErrorState message={doctors.error} onRetry={doctors.reload} />}
              <div className="mt-5 grid gap-4">
                {doctors.data?.items.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => chooseDoctor(item)}
                    className="flex items-center gap-4 rounded-2xl border border-slate-200 p-4 text-left transition hover:border-brand-400 hover:bg-brand-50"
                  >
                    <DoctorAvatar doctor={item} size="md" />
                    <span>
                      <span className="block font-heading text-xl font-extrabold text-slate-900">{item.name}</span>
                      <span className="block font-semibold text-brand-700">{item.designation}</span>
                      <span className="block text-sm text-slate-600">{item.qualifications}</span>
                    </span>
                  </button>
                ))}
              </div>
            </section>
          )}

          {step === 2 && doctor && (
            <section aria-labelledby="step-location">
              <h2 id="step-location" className="text-2xl font-extrabold">Where would you like to see {doctor.name}?</h2>
              <div className="mt-5 grid gap-4">
                {doctor.schedules.map((entry) => (
                  <button
                    key={entry.location.id}
                    type="button"
                    onClick={() => chooseLocation(entry.location)}
                    className="rounded-2xl border border-slate-200 p-4 text-left transition hover:border-brand-400 hover:bg-brand-50"
                  >
                    <span className="block font-heading text-lg font-extrabold text-slate-900">{entry.location.name}</span>
                    <span className="mt-1 flex items-start gap-2 text-sm text-slate-600">
                      <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-blush-500" aria-hidden="true" />
                      {entry.location.address}
                    </span>
                    <span className="mt-2 block text-sm text-slate-700">
                      {groupSchedule(entry.slots).map((line) => (
                        <span key={`${line.days}-${line.time}`} className="block">
                          <strong>{line.days}</strong> · {line.time}
                        </span>
                      ))}
                    </span>
                  </button>
                ))}
              </div>
            </section>
          )}

          {step === 3 && doctor && location && (
            <section aria-labelledby="step-date">
              <h2 id="step-date" className="mb-5 text-2xl font-extrabold">Pick a date</h2>
              {dates.loading && <LoadingState />}
              {dates.error && <ErrorState message={dates.error} onRetry={dates.reload} />}
              {dates.data && dates.data.dates.length === 0 && (
                <p className="rounded-2xl bg-slate-50 p-5 text-slate-700">
                  There are no free online appointments in the next few weeks at this location. Please try another location or doctor, or ask us to call you back below.
                </p>
              )}
              {dates.data && dates.data.dates.length > 0 && <DatePicker dates={dates.data.dates} value={date} onChange={chooseDate} />}
            </section>
          )}

          {step === 4 && date && (
            <section aria-labelledby="step-time">
              <h2 id="step-time" className="mb-1 text-2xl font-extrabold">Pick a time</h2>
              <p className="mb-5 text-slate-600">{formatDateOnly(date)}</p>
              {slots.loading && <LoadingState />}
              {slots.error && <ErrorState message={slots.error} onRetry={slots.reload} />}
              {slots.data && slots.data.slots.length === 0 && (
                <p className="rounded-2xl bg-slate-50 p-5 text-slate-700">
                  All times on this day have just been taken. Please choose another date.
                </p>
              )}
              {slots.data && slots.data.slots.length > 0 && <SlotPicker slots={slots.data.slots} value={selection.slot?.startTime} onChange={chooseSlot} />}
            </section>
          )}

          {step === 5 && selection.slot && (
            <section aria-labelledby="step-details">
              <h2 id="step-details" className="mb-5 text-2xl font-extrabold">Your details</h2>
              <PatientDetailsForm selection={selection} onBooked={(result) => { setBooking(result); setStep(CONFIRMATION); }} onSlotLost={slotLost} />
            </section>
          )}

          {step === CONFIRMATION && booking && <BookingConfirmation booking={booking} onBookAnother={reset} />}

          {step > 1 && step < CONFIRMATION && (
            <button type="button" onClick={() => goTo(step - 1)} className="mt-8 inline-flex items-center gap-2 font-semibold text-slate-600 hover:text-brand-700">
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Back
            </button>
          )}
        </div>

        {step < CONFIRMATION && <HelpBar interest={interest} />}
      </Container>
    </>
  );
}
