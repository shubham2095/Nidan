import { useState } from 'react';
import { ArrowDown, ArrowUp, Loader2, Plus, Trash2 } from 'lucide-react';
import AdminHeader, { Card } from '../../components/admin/AdminHeader.jsx';
import FieldInput from '../../components/admin/FieldInput.jsx';
import Button from '../../components/public/Button.jsx';
import { FormMessage } from '../../components/public/FormField.jsx';
import { ErrorState, LoadingState } from '../../components/public/States.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import useFetch from '../../hooks/useFetch.js';
import { getSettings, saveSetting, uploadImage } from '../../services/adminService.js';
import { serverFieldErrors } from '../../utils/crm.js';

const MAX_REASONS = 8;
const MAX_FAQS = 12;

const SECTIONS = [
  {
    key: 'clinic',
    title: 'Clinic details',
    description: 'Used in the header, footer, contact page and booking emails.',
    fields: [
      { name: 'name', label: 'Clinic name', required: true },
      { name: 'tagline', label: 'Tagline' },
      { name: 'phonePrimary', label: 'Main phone number', required: true, type: 'tel' },
      { name: 'phoneSecondary', label: 'Second phone number (optional)', type: 'tel' },
      { name: 'whatsappNumber', label: 'WhatsApp number', required: true, hint: 'Digits only, with the country code, e.g. 919773507333' },
      { name: 'email', label: 'Email address', required: true, type: 'email' },
    ],
  },
  {
    key: 'social',
    title: 'Social media',
    description: 'Links shown in the footer. Leave a link empty to hide it.',
    fields: [
      { name: 'instagram', label: 'Instagram', type: 'url', hint: 'https://www.instagram.com/…' },
      { name: 'facebook', label: 'Facebook', type: 'url', hint: 'https://www.facebook.com/…' },
      { name: 'youtube', label: 'YouTube – Dr. Manisha Ranjan', type: 'url', hint: 'https://www.youtube.com/…' },
      { name: 'youtubeRajeev', label: 'YouTube – Dr. Rajeev Ranjan', type: 'url', hint: 'https://www.youtube.com/@…' },
    ],
  },
  {
    key: 'hero',
    title: 'Home page banner',
    description: 'The large heading and buttons at the top of the home page.',
    fields: [
      { name: 'heading', label: 'Heading', required: true, wide: true },
      { name: 'subheading', label: 'Short text under the heading', type: 'textarea', rows: 2 },
      { name: 'primaryCta', label: 'Main button text', required: true },
      { name: 'secondaryCta', label: 'Second button text', required: true },
      { name: 'imageUrl', label: 'Banner picture (optional)', type: 'image', upload: (file) => uploadImage(file, 'content'), hint: 'A warm photo of the clinic, a doctor or a family works best (portrait or square). Without one, an illustration is shown. It is also the picture used when the site is shared on WhatsApp.' },
      { name: 'imageAlt', label: 'Describe the picture', wide: true, hint: 'For people using screen readers, e.g. "Dr. Manisha Ranjan with a young mother at our Sector 51 clinic"' },
    ],
  },
  {
    key: 'announcement',
    title: 'Announcement bar',
    description: 'A short notice across the top of every page, for example holiday timings.',
    fields: [
      { name: 'enabled', type: 'checkbox', checkboxLabel: 'Show the announcement on the website' },
      { name: 'text', label: 'Announcement', hint: 'Keep it to one short sentence', wide: true },
      { name: 'link', label: 'Link (optional)', hint: 'A page like /contact-us or a full https:// address', wide: true },
    ],
  },
  {
    key: 'about',
    title: 'About page',
    description: 'The story of the clinic, shown on the About us page.',
    fields: [
      { name: 'heading', label: 'Heading', required: true, wide: true },
      { name: 'body', label: 'Text', type: 'richtext', minHeight: '14rem' },
    ],
  },
  {
    key: 'seo',
    title: 'Search engines',
    description: 'How the home page appears on Google and when the link is shared.',
    fields: [
      { name: 'siteTitle', label: 'Site title', required: true, wide: true, hint: 'About 60 characters' },
      { name: 'siteDescription', label: 'Site description', type: 'textarea', rows: 3, hint: 'About 150 characters' },
    ],
  },
];

/** Shared save behaviour: a form with its own Save button, field errors from the server, success toast. */
function SettingsForm({ settingKey, label, onSave, children, disabled = false }) {
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState(null);
  const [errors, setErrors] = useState({});

  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setFormError(null);
    setErrors({});
    try {
      await onSave();
      toast.success('Saved. Visitors see the change within a minute.');
    } catch (error) {
      const { fields, message } = serverFieldErrors(error, []);
      setErrors(fields);
      setFormError(message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} noValidate data-setting={settingKey}>
      {children({ errors })}
      <div className="mt-5 space-y-3">
        <FormMessage type="error">{formError}</FormMessage>
        <Button type="submit" disabled={busy || disabled}>
          {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
          Save {label}
        </Button>
      </div>
    </form>
  );
}

function SimpleSection({ section, value }) {
  const [values, setValues] = useState(() => Object.fromEntries(section.fields.map((field) => [field.name, value?.[field.name] ?? (field.type === 'checkbox' ? false : '')])));
  const change = (name, next) => setValues((current) => ({ ...current, [name]: next }));

  return (
    <Card title={section.title}>
      <p className="-mt-2 mb-5 text-sm text-slate-600">{section.description}</p>
      <SettingsForm settingKey={section.key} label={section.title.toLowerCase()} onSave={() => saveSetting(section.key, values)}>
        {({ errors }) => (
          <div className="grid gap-4 sm:grid-cols-2">
            {section.fields.map((field) => (
              <FieldInput key={field.name} field={field} value={values[field.name]} error={errors[field.name]} onChange={change} />
            ))}
          </div>
        )}
      </SettingsForm>
    </Card>
  );
}

/**
 * Editor for a setting that is a list of items (reasons, FAQs): add, remove, reorder, save as a whole.
 * `fields` are FieldInput configs; `blank` is a new empty item; `min` / `max` bound the list length.
 */
function ListSection({ settingKey, title, description, label, itemName, value, fields, blank, min = 0, max }) {
  const [items, setItems] = useState(() => (value || []).map((item) => ({ ...blank, ...item })));
  const change = (index, name, next) => setItems((current) => current.map((item, position) => (position === index ? { ...item, [name]: next } : item)));
  const move = (index, delta) =>
    setItems((current) => {
      const next = [...current];
      const [moved] = next.splice(index, 1);
      next.splice(index + delta, 0, moved);
      return next;
    });
  const iconButton = 'rounded-full p-2 text-slate-500 hover:bg-slate-100 disabled:opacity-30';

  return (
    <Card title={title}>
      <p className="-mt-2 mb-5 text-sm text-slate-600">{description}</p>
      <SettingsForm settingKey={settingKey} label={label} onSave={() => saveSetting(settingKey, items)} disabled={items.length < min}>
        {({ errors }) => (
          <div className="space-y-4">
            {items.length === 0 && <p className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">Nothing here yet, so this section is hidden on the website.</p>}
            {items.map((item, index) => (
              <fieldset key={index} className="rounded-2xl border border-slate-200 p-4">
                <legend className="px-2 text-sm font-semibold text-slate-500">{itemName} {index + 1}</legend>
                <div className="grid gap-4 sm:grid-cols-2">
                  {fields.map((field) => (
                    <FieldInput key={field.name} field={field} value={item[field.name]} error={errors[`${index}.${field.name}`]} onChange={(name, next) => change(index, name, next)} />
                  ))}
                </div>
                <div className="mt-3 flex justify-end gap-1">
                  <button type="button" onClick={() => move(index, -1)} disabled={index === 0} aria-label={`Move ${itemName.toLowerCase()} ${index + 1} up`} className={iconButton}><ArrowUp className="h-4 w-4" aria-hidden="true" /></button>
                  <button type="button" onClick={() => move(index, 1)} disabled={index === items.length - 1} aria-label={`Move ${itemName.toLowerCase()} ${index + 1} down`} className={iconButton}><ArrowDown className="h-4 w-4" aria-hidden="true" /></button>
                  <button type="button" onClick={() => setItems((current) => current.filter((_, position) => position !== index))} disabled={items.length <= min} aria-label={`Remove ${itemName.toLowerCase()} ${index + 1}`} className={`${iconButton} hover:!bg-red-50 hover:!text-red-600`}><Trash2 className="h-4 w-4" aria-hidden="true" /></button>
                </div>
              </fieldset>
            ))}
            {(!max || items.length < max) && (
              <Button variant="outline" onClick={() => setItems((current) => [...current, { ...blank }])}>
                <Plus className="h-4 w-4" aria-hidden="true" />
                Add {/^[aeiou]/i.test(itemName) ? 'an' : 'a'} {itemName.toLowerCase()}
              </Button>
            )}
          </div>
        )}
      </SettingsForm>
    </Card>
  );
}

const REASON_FIELDS = [
  { name: 'title', label: 'Title', required: true },
  { name: 'icon', label: 'Icon', type: 'icon' },
  { name: 'description', label: 'Description', type: 'textarea', rows: 2 },
];
const HOURS_FIELDS = [
  { name: 'days', label: 'Days', required: true, hint: 'e.g. Monday – Friday' },
  { name: 'time', label: 'Hours', required: true, hint: 'e.g. 7:00 am – 10:00 pm, or Closed' },
];
const FAQ_FIELDS = [
  { name: 'question', label: 'Question', required: true, wide: true },
  { name: 'answer', label: 'Answer', type: 'textarea', rows: 4, required: true, hint: 'Plain text. Keep it short and friendly.' },
];

export default function SettingsPage() {
  const { data, loading, error, reload } = useFetch((signal) => getSettings(signal), []);

  return (
    <>
      <AdminHeader title="Site settings" description="Text and details shown across the website. Each section is saved on its own." />
      {loading && !data && <LoadingState />}
      {error && <ErrorState message={error} onRetry={reload} />}
      {data && (
        <div className="space-y-6">
          {SECTIONS.slice(0, 4).map((section) => (
            <SimpleSection key={section.key} section={section} value={data.settings[section.key]} />
          ))}
          <ListSection
            settingKey="hours"
            title="Opening hours"
            description="Shown on the home page, Contact page and footer. These are the clinic's opening hours; the times patients can book online come from each doctor's timetable (Doctors)."
            label="opening hours"
            itemName="Row"
            value={data.settings.hours}
            fields={HOURS_FIELDS}
            blank={{ days: '', time: '' }}
            max={10}
          />
          <ListSection
            settingKey="whyChooseUs"
            title="Why choose us"
            description={`The reasons shown on the home page. Between 1 and ${MAX_REASONS}.`}
            label="reasons"
            itemName="Reason"
            value={data.settings.whyChooseUs}
            fields={REASON_FIELDS}
            blank={{ title: '', description: '', icon: 'sparkles' }}
            min={1}
            max={MAX_REASONS}
          />
          <ListSection
            settingKey="faq"
            title="Frequently asked questions"
            description={`Shown on the home page, in this order. Up to ${MAX_FAQS}. Remove every question to hide the section.`}
            label="questions"
            itemName="Question"
            value={data.settings.faq}
            fields={FAQ_FIELDS}
            blank={{ question: '', answer: '' }}
            max={MAX_FAQS}
          />
          {SECTIONS.slice(4).map((section) => (
            <SimpleSection key={section.key} section={section} value={data.settings[section.key]} />
          ))}
        </div>
      )}
    </>
  );
}
