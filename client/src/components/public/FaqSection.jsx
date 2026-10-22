import { ChevronDown, MessageCircle, Phone } from 'lucide-react';
import { useSite } from '../../context/SiteContext.jsx';
import { telHref, whatsappHref } from '../../utils/format.js';
import Button from './Button.jsx';
import { RevealGrid } from './Reveal.jsx';
import Section, { SectionHeading } from './Section.jsx';

/** Frequently asked questions (edited in Site settings). Native <details>, so it works with keyboard and screen readers. */
export default function FaqSection({ items }) {
  const { clinic } = useSite();

  return (
    <Section id="faq">
      <div className="grid gap-10 lg:grid-cols-[5fr_7fr] lg:gap-16">
        <div className="lg:sticky lg:top-28 lg:self-start">
          <SectionHeading
            align="left"
            eyebrow="Questions"
            title="Good to know before you visit"
            description="Quick answers to what families ask us most. Cannot find yours? Just ask, we are happy to help."
            className="!mb-6 sm:!mb-6"
          />
          <div className="flex flex-wrap gap-3">
            <Button href={whatsappHref(clinic.whatsappNumber, `Hello ${clinic.name}, I have a question.`)} target="_blank" rel="noopener noreferrer" variant="whatsapp">
              <MessageCircle className="h-4 w-4" aria-hidden="true" />
              Ask on WhatsApp
            </Button>
            <Button href={telHref(clinic.phonePrimary)} variant="outline">
              <Phone className="h-4 w-4" aria-hidden="true" />
              {clinic.phonePrimary}
            </Button>
          </div>
        </div>

        <RevealGrid className="space-y-3" columns={1} step={0} itemClassName="" variant="right">
          {items.map((item, index) => (
            <details key={item.question} open={index === 0} className="group rounded-2xl border border-slate-200 bg-white transition-colors open:border-brand-200 open:bg-brand-50/40">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 rounded-2xl p-5 font-heading text-base font-bold text-slate-900 marker:hidden focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 sm:text-lg [&::-webkit-details-marker]:hidden">
                {item.question}
                <ChevronDown className="h-5 w-5 shrink-0 text-brand-700 transition-transform duration-200 group-open:rotate-180" aria-hidden="true" />
              </summary>
              <p className="open-down px-5 pb-5 leading-relaxed whitespace-pre-line text-slate-600">{item.answer}</p>
            </details>
          ))}
        </RevealGrid>
      </div>
    </Section>
  );
}
