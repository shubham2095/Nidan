import { CalendarClock, MessageCircle, Phone } from 'lucide-react';
import Button from '../../components/public/Button.jsx';
import PageHeader from '../../components/public/PageHeader.jsx';
import Section from '../../components/public/Section.jsx';
import Seo from '../../components/public/Seo.jsx';
import { useSite } from '../../context/SiteContext.jsx';
import { telHref, whatsappHref } from '../../utils/format.js';

// Placeholder until the booking engine is built (Phase 3).
export default function BookAppointmentPage() {
  const { clinic } = useSite();

  return (
    <>
      <Seo title="Book an Appointment" description={`Book an appointment with the doctors at ${clinic.name} in Noida.`} />
      <PageHeader title="Book an Appointment" crumbs={[{ label: 'Book Appointment' }]} />
      <Section>
        <div className="mx-auto max-w-xl rounded-3xl bg-brand-50 p-8 text-center">
          <CalendarClock className="mx-auto h-10 w-10 text-brand-700" aria-hidden="true" />
          <h2 className="mt-4 text-2xl font-extrabold">Online booking is almost ready</h2>
          <p className="mt-2 text-slate-600">In the meantime, our team will gladly book your visit by phone or WhatsApp.</p>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <Button href={telHref(clinic.phonePrimary)} size="lg">
              <Phone className="h-5 w-5" aria-hidden="true" />
              Call us
            </Button>
            <Button
              href={whatsappHref(clinic.whatsappNumber, `Hello ${clinic.name}, I would like to book an appointment.`)}
              target="_blank"
              rel="noopener noreferrer"
              variant="whatsapp"
              size="lg"
            >
              <MessageCircle className="h-5 w-5" aria-hidden="true" />
              WhatsApp
            </Button>
          </div>
        </div>
      </Section>
    </>
  );
}
