import Button from '../../components/public/Button.jsx';
import Container from '../../components/public/Container.jsx';
import Seo from '../../components/public/Seo.jsx';

export default function NotFoundPage() {
  return (
    <Container className="py-24 text-center">
      <Seo title="Page not found" noindex />
      <p className="font-heading text-7xl font-extrabold text-blush-300">404</p>
      <h1 className="mt-4 text-3xl font-extrabold">We could not find that page</h1>
      <p className="mx-auto mt-3 max-w-md text-slate-600">
        The page may have moved or the link may be incorrect. You can head back home or book an appointment.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Button to="/">Go to home page</Button>
        <Button to="/book-appointment" variant="outline">
          Book Appointment
        </Button>
      </div>
    </Container>
  );
}
