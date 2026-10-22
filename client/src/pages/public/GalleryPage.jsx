import { useMemo, useState } from 'react';
import { ZoomIn } from 'lucide-react';
import Button from '../../components/public/Button.jsx';
import Lightbox from '../../components/public/Lightbox.jsx';
import Reveal from '../../components/public/Reveal.jsx';
import PageHeader from '../../components/public/PageHeader.jsx';
import Section from '../../components/public/Section.jsx';
import Seo from '../../components/public/Seo.jsx';
import { EmptyState, ErrorState, LoadingState } from '../../components/public/States.jsx';
import useFetch from '../../hooks/useFetch.js';
import { getGallery } from '../../services/publicService.js';

export default function GalleryPage() {
  const { data, loading, error, reload } = useFetch((signal) => getGallery(signal), []);
  const [category, setCategory] = useState('all');
  const [openIndex, setOpenIndex] = useState(null);

  const images = useMemo(() => {
    if (!data) return [];
    return category === 'all' ? data.images : data.images.filter((image) => image.categoryId === category);
  }, [data, category]);

  const chip = (selected) =>
    `rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
      selected ? 'bg-brand-700 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
    }`;

  return (
    <>
      <Seo title="Gallery" description="Take a look inside Nidan Mother & Child Care: our clinic, our team and our community events in Noida." />
      <PageHeader title="Gallery" crumbs={[{ label: 'Gallery' }]} description="A look at our clinic, team and community." />

      <Section>
        {loading && <LoadingState />}
        {error && <ErrorState message={error} onRetry={reload} />}

        {data && data.images.length === 0 && (
          <EmptyState title="Photos are coming soon" message="We are putting our gallery together. In the meantime, you are always welcome to visit us.">
            <Button to="/contact-us">Find our clinic</Button>
          </EmptyState>
        )}

        {data && data.images.length > 0 && (
          <>
            {data.categories.length > 0 && (
              <div role="group" aria-label="Filter photos by category" className="mb-8 flex flex-wrap justify-center gap-2">
                <button type="button" aria-pressed={category === 'all'} onClick={() => setCategory('all')} className={chip(category === 'all')}>
                  All
                </button>
                {data.categories.map((item) => (
                  <button key={item.id} type="button" aria-pressed={category === item.id} onClick={() => setCategory(item.id)} className={chip(category === item.id)}>
                    {item.name}
                  </button>
                ))}
              </div>
            )}

            <ul className="columns-2 gap-4 md:columns-3 lg:columns-4">
              {images.map((image, index) => (
                <Reveal as="li" key={image.id} variant="zoom" delay={(index % 4) * 80} className="mb-4 break-inside-avoid">
                  <button
                    type="button"
                    onClick={() => setOpenIndex(index)}
                    aria-label={`Enlarge photo: ${image.title || image.altText}`}
                    className="group relative block w-full overflow-hidden rounded-3xl bg-slate-100"
                  >
                    <img src={image.imageUrl} alt={image.altText} loading="lazy" className="h-auto w-full transition duration-500 group-hover:scale-105" />
                    <span className="absolute inset-0 grid place-items-center bg-slate-900/0 text-white opacity-0 transition group-hover:bg-slate-900/30 group-hover:opacity-100">
                      <ZoomIn className="h-8 w-8" aria-hidden="true" />
                    </span>
                  </button>
                </Reveal>
              ))}
            </ul>

            {openIndex !== null && (
              <Lightbox images={images} index={openIndex} onChange={setOpenIndex} onClose={() => setOpenIndex(null)} />
            )}
          </>
        )}
      </Section>
    </>
  );
}
