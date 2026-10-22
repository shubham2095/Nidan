import ContactStrip from '../../components/public/ContactStrip.jsx';
import PageHeader from '../../components/public/PageHeader.jsx';
import Section from '../../components/public/Section.jsx';
import Seo from '../../components/public/Seo.jsx';
import ServiceCard from '../../components/public/ServiceCard.jsx';
import { ErrorState, LoadingState } from '../../components/public/States.jsx';
import useFetch from '../../hooks/useFetch.js';
import { getServices } from '../../services/publicService.js';

export default function ServicesPage() {
  const { data, loading, error, reload } = useFetch((signal) => getServices(signal), []);

  return (
    <>
      <Seo
        title="Our Services"
        description="Maternity, gynaecology, fertility, neonatology, paediatrics, fetal medicine, surgery, lactation support and more, all at Nidan Mother & Child Care in Noida."
      />
      <PageHeader
        title="Our Services"
        crumbs={[{ label: 'Services' }]}
        description="Complete healthcare for mothers and children, under one roof."
      />
      <Section>
        {loading && <LoadingState />}
        {error && <ErrorState message={error} onRetry={reload} />}
        {data && (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {data.items.map((service) => (
              <ServiceCard key={service.id} service={service} />
            ))}
          </div>
        )}
      </Section>
      <ContactStrip />
    </>
  );
}
