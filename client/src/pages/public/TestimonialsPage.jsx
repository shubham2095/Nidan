import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Send } from 'lucide-react';
import Button from '../../components/public/Button.jsx';
import { ConsentCheckbox, Field, FormMessage, Honeypot } from '../../components/public/FormField.jsx';
import PageHeader from '../../components/public/PageHeader.jsx';
import Section, { SectionHeading } from '../../components/public/Section.jsx';
import Seo from '../../components/public/Seo.jsx';
import { EmptyState, ErrorState, LoadingState } from '../../components/public/States.jsx';
import TestimonialCard from '../../components/public/TestimonialCard.jsx';
import Reveal from '../../components/public/Reveal.jsx';
import useFetch from '../../hooks/useFetch.js';
import { getTestimonials, submitTestimonial } from '../../services/publicService.js';
import { applyServerErrors, testimonialSchema } from '../../utils/forms.js';

function ShareExperienceForm() {
  const [result, setResult] = useState(null);
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(testimonialSchema),
    defaultValues: { name: '', label: '', rating: '', content: '', consent: false, website: '' },
  });

  const onSubmit = async (values) => {
    setResult(null);
    try {
      const response = await submitTestimonial({ ...values, rating: values.rating || undefined });
      setResult({ type: 'success', message: response.message });
      reset();
    } catch (error) {
      if (!applyServerErrors(error, setError)) setResult({ type: 'error', message: error.message });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="relative space-y-5 rounded-3xl border border-slate-100 bg-white p-6 shadow-sm sm:p-8">
      <Honeypot {...register('website')} />
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Your name" required error={errors.name?.message}>
          {(props) => <input {...props} {...register('name')} autoComplete="name" className="field-input" />}
        </Field>
        <Field label="About you (optional)" hint="For example: Mother of a newborn" error={errors.label?.message}>
          {(props) => <input {...props} {...register('label')} className="field-input" />}
        </Field>
      </div>
      <Field label="Rating (optional)" error={errors.rating?.message}>
        {(props) => (
          <select {...props} {...register('rating')} className="field-input">
            <option value="">No rating</option>
            {[5, 4, 3, 2, 1].map((stars) => (
              <option key={stars} value={stars}>
                {stars} {stars === 1 ? 'star' : 'stars'}
              </option>
            ))}
          </select>
        )}
      </Field>
      <Field label="Your experience" required error={errors.content?.message}>
        {(props) => <textarea {...props} {...register('content')} rows={5} className="field-input" />}
      </Field>
      <ConsentCheckbox {...register('consent')} error={errors.consent?.message}>
        I agree that my name and review may be published on the Nidan Mother &amp; Child Care website after review by the team.
      </ConsentCheckbox>
      <FormMessage type={result?.type}>{result?.message}</FormMessage>
      <Button type="submit" size="lg" disabled={isSubmitting}>
        {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" /> : <Send className="h-5 w-5" aria-hidden="true" />}
        {isSubmitting ? 'Sending…' : 'Submit my experience'}
      </Button>
    </form>
  );
}

export default function TestimonialsPage() {
  const { data, loading, error, reload } = useFetch((signal) => getTestimonials(signal), []);

  return (
    <>
      <Seo title="Patient Testimonials" description="Read what patients and parents say about their experience at Nidan Mother & Child Care in Noida, and share your own." />
      <PageHeader title="Testimonials" crumbs={[{ label: 'Testimonials' }]} description="Kind words from the families we have had the privilege to care for." />

      <Section>
        {loading && <LoadingState />}
        {error && <ErrorState message={error} onRetry={reload} />}
        {data && data.items.length === 0 && (
          <EmptyState title="Be the first to share" message="We are collecting experiences from our patients. Yours would mean a lot to us." />
        )}
        {data && data.items.length > 0 && (
          <div className="columns-1 gap-5 md:columns-2 lg:columns-3">
            {data.items.map((testimonial, index) => (
              <Reveal key={testimonial.id} variant="zoom" delay={(index % 3) * 90} className="mb-5 break-inside-avoid">
                <TestimonialCard testimonial={testimonial} />
              </Reveal>
            ))}
          </div>
        )}
      </Section>

      <Section tone="soft" id="share">
        <SectionHeading
          eyebrow="Share your experience"
          title="Tell us how we did"
          description="Your feedback helps other families and helps us improve. Reviews are checked by our team before they appear."
        />
        <div className="mx-auto max-w-2xl">
          <ShareExperienceForm />
        </div>
      </Section>
    </>
  );
}
