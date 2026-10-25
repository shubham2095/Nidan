import ContactStrip from '../../components/public/ContactStrip.jsx';
import DoctorCard from '../../components/public/DoctorCard.jsx';
import { RevealGrid } from '../../components/public/Reveal.jsx';
import PageHeader from '../../components/public/PageHeader.jsx';
import Section from '../../components/public/Section.jsx';
import Seo from '../../components/public/Seo.jsx';
import { ErrorState, LoadingState } from '../../components/public/States.jsx';
import useFetch from '../../hooks/useFetch.js';
import { getDoctors } from '../../services/publicService.js';

export default function DoctorsPage() {
  const { data, loading, error, reload } = useFetch((signal) => getDoctors(signal), [], { preload: '/public/doctors' });

  return (
    <>
      <Seo
        title="Our Doctors"
        description="Meet Dr. Manisha Ranjan, Obstetrician & Gynaecologist, and Dr. Rajeev Ranjan, Paediatrician & Neonatologist, at NIDAN Mother & Child Clinic in Noida."
      />
      <PageHeader
        title="Our Doctors"
        crumbs={[{ label: 'Doctors' }]}
        description="Experienced, compassionate specialists for mothers and children, available at our clinics in Noida and Greater Noida."
      />
      <Section>
        {loading && <LoadingState />}
        {error && <ErrorState message={error} onRetry={reload} />}
        {data && (
          <RevealGrid className="grid gap-6 lg:grid-cols-2" columns={2} step={140}>
            {data.items.map((doctor) => (
              <DoctorCard key={doctor.id} doctor={doctor} />
            ))}
          </RevealGrid>
        )}
      </Section>
      <ContactStrip />
    </>
  );
}
