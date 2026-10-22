import { Link } from 'react-router-dom';
import { CalendarDays, CheckCircle2, Clock, MapPin, MessageCircle, PhoneCall, Stethoscope, UserRound } from 'lucide-react';
import { useSite } from '../../context/SiteContext.jsx';
import { formatDateOnly, formatTime, telHref, whatsappHref } from '../../utils/format.js';
import Button from './Button.jsx';

export default function BookingConfirmation({ booking, onBookAnother }) {
  const { clinic } = useSite();
  const when = `${formatDateOnly(booking.date)}, ${formatTime(booking.startTime)}`;

  const rows = [
    { Icon: UserRound, label: 'Patient', value: booking.patientName },
    { Icon: Stethoscope, label: 'Doctor', value: booking.doctor.name },
    { Icon: CalendarDays, label: 'Date', value: formatDateOnly(booking.date) },
    { Icon: Clock, label: 'Time', value: `${formatTime(booking.startTime)} – ${formatTime(booking.endTime)}` },
    { Icon: MapPin, label: 'Where', value: `${booking.location.name}, ${booking.location.address}` },
  ];

  return (
    <div className="text-center" role="status">
      <CheckCircle2 className="mx-auto h-14 w-14 text-brand-600" aria-hidden="true" />
      <h2 className="mt-4 text-3xl font-extrabold">Your booking is received</h2>
      <p className="mx-auto mt-2 max-w-md text-slate-600">
        Our team will confirm your appointment shortly by phone or WhatsApp. Please keep your booking ID handy.
      </p>

      <div className="mx-auto mt-6 max-w-sm rounded-3xl bg-brand-50 p-6">
        <p className="text-sm font-semibold text-slate-600">Booking ID</p>
        <p className="mt-1 font-heading text-4xl font-extrabold tracking-wider text-brand-800">{booking.ref}</p>
        <p className="mt-2 inline-block rounded-full bg-blush-100 px-3 py-1 text-xs font-semibold text-blush-700">Awaiting confirmation</p>
      </div>

      <ul className="mx-auto mt-6 max-w-md space-y-3 text-left">
        {rows.map(({ Icon, label, value }) => (
          <li key={label} className="flex items-start gap-3 rounded-2xl border border-slate-100 p-4">
            <Icon className="mt-0.5 h-5 w-5 shrink-0 text-brand-700" aria-hidden="true" />
            <span>
              <span className="block text-xs font-semibold text-slate-500 uppercase">{label}</span>
              <span className="font-semibold text-slate-900">{value}</span>
            </span>
          </li>
        ))}
      </ul>
      {booking.location.mapUrl && (
        <p className="mt-3">
          <a href={booking.location.mapUrl} target="_blank" rel="noopener noreferrer" className="font-semibold text-brand-700 hover:underline">
            Get directions
          </a>
        </p>
      )}

      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Button
          href={whatsappHref(clinic.whatsappNumber, `Hello ${clinic.name}, my booking ID is ${booking.ref} (${when}). `)}
          target="_blank"
          rel="noopener noreferrer"
          variant="whatsapp"
        >
          <MessageCircle className="h-4 w-4" aria-hidden="true" />
          Message us about this booking
        </Button>
        <Button href={telHref(clinic.phonePrimary)} variant="outline">
          <PhoneCall className="h-4 w-4" aria-hidden="true" />
          {clinic.phonePrimary}
        </Button>
      </div>
      <p className="mt-6 text-sm text-slate-600">
        <button type="button" onClick={onBookAnother} className="font-semibold text-brand-700 hover:underline">
          Book another appointment
        </button>
        {' · '}
        <Link to="/" className="font-semibold text-brand-700 hover:underline">
          Back to home
        </Link>
      </p>
    </div>
  );
}
