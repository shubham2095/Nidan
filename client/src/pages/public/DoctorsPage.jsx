import ContactStrip from '../../components/public/ContactStrip.jsx';
import DoctorCard from '../../components/public/DoctorCard.jsx';
import PageHeader from '../../components/public/PageHeader.jsx';
import Section from '../../components/public/Section.jsx';
import Seo from '../../components/public/Seo.jsx';
import { ErrorState, LoadingState } from '../../components/public/States.jsx';
import useFetch from '../../hooks/useFetch.js';
import { getDoctors } from '../../services/publicService.js';

export default function DoctorsPage() {
  const { data, loading, error, reload } = useFetch((signal) => getDoctors(signal), []);

  return (
    <>
      <Seo
        title="Our Doctors"
        description="Meet Dr. Manisha Ranjan, Obstetrician & Gynaecologist, and Dr. Rajeev Ranjan, Paediatrician & Neonatologist, at Nidan Mother & Child Care in Noida."
      />
      <PageHeader
        title="Our Doctors"
        crumbs={[{ label: 'Doctors' }]}
        description="Experienced, compassionate specialists for mothers and children. Pick a location to see timings."
      />
      <Section>
        {loading && <LoadingState />}
        {error && <ErrorState message={error} onRetry={reload} />}
        {data && (
          <div className="grid gap-6 lg:grid-cols-2">
            {data.items.map((doctor) => (
              <DoctorCard key={doctor.id} doctor={doctor} />
            ))}
          </div>
        )}
      </Section>
      <ContactStrip />
    </>
  );
}
