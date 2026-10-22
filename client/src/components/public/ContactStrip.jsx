import { CalendarCheck, Mail, MapPin, MessageCircle, Phone } from 'lucide-react';
import { useSite } from '../../context/SiteContext.jsx';
import { telHref, whatsappHref } from '../../utils/format.js';
import Button from './Button.jsx';
import Container from './Container.jsx';

/** "Talk to us" band used at the bottom of the home page and detail pages. */
export default function ContactStrip() {
  const { clinic, ownClinics } = useSite();

  return (
    <section className="py-14 sm:py-20">
      <Container>
        <div className="relative overflow-hidden rounded-[2rem] bg-brand-800 px-6 py-12 text-white sm:px-12">
          <div aria-hidden="true" className="absolute -top-20 -right-20 h-72 w-72 rounded-full bg-brand-600/50 blur-2xl" />
          <div aria-hidden="true" className="absolute -bottom-24 -left-10 h-64 w-64 rounded-full bg-blush-400/20 blur-2xl" />
          <div className="relative grid gap-10 lg:grid-cols-2 lg:items-center">
            <div>
              <h2 className="text-3xl font-extrabold text-white sm:text-4xl">We are here to help</h2>
              <p className="mt-3 max-w-md text-lg text-brand-100">
                Book online, call, or send us a WhatsApp message. Our team will help you choose the right doctor and time.
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Button to="/book-appointment" variant="light" size="lg">
                  <CalendarCheck className="h-5 w-5" aria-hidden="true" />
                  Book Appointment
                </Button>
                <Button
                  href={whatsappHref(clinic.whatsappNumber, `Hello ${clinic.name}, I would like to book an appointment.`)}
                  target="_blank"
                  rel="noopener noreferrer"
                  variant="whatsapp"
                  size="lg"
                >
                  <MessageCircle className="h-5 w-5" aria-hidden="true" />
                  WhatsApp us
                </Button>
              </div>
            </div>

            <ul className="space-y-4 text-brand-50">
              <li className="flex items-center gap-3">
                <Phone className="h-5 w-5 shrink-0 text-blush-200" aria-hidden="true" />
                <span>
                  <a href={telHref(clinic.phonePrimary)} className="font-semibold text-white hover:underline">
                    {clinic.phonePrimary}
                  </a>
                  {clinic.phoneSecondary && (
                    <>
                      {' · '}
                      <a href={telHref(clinic.phoneSecondary)} className="font-semibold text-white hover:underline">
                        {clinic.phoneSecondary}
                      </a>
                    </>
                  )}
                </span>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="h-5 w-5 shrink-0 text-blush-200" aria-hidden="true" />
                <a href={`mailto:${clinic.email}`} className="font-semibold text-white hover:underline">
                  {clinic.email}
                </a>
              </li>
              {ownClinics.map((location) => (
                <li key={location.id} className="flex items-start gap-3">
                  <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-blush-200" aria-hidden="true" />
                  <span>
                    <strong className="block text-white">{location.name}</strong>
                    {location.address}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Container>
    </section>
  );
}
