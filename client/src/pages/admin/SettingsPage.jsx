import { useState } from 'react';
import { ArrowDown, ArrowUp, Loader2, Plus, Trash2 } from 'lucide-react';
import AdminHeader, { Card } from '../../components/admin/AdminHeader.jsx';
import FieldInput from '../../components/admin/FieldInput.jsx';
import Button from '../../components/public/Button.jsx';
import { FormMessage } from '../../components/public/FormField.jsx';
import { ErrorState, LoadingState } from '../../components/public/States.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import useFetch from '../../hooks/useFetch.js';
import { getSettings, saveSetting } from '../../services/adminService.js';
import { serverFieldErrors } from '../../utils/crm.js';

const MAX_REASONS = 8;

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
      { name: 'youtube', label: 'YouTube', type: 'url', hint: 'https://www.youtube.com/…' },
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

function ReasonsSection({ value }) {
  const [items, setItems] = useState(() => (value || []).map((item) => ({ title: item.title, description: item.description || '', icon: item.icon || 'sparkles' })));
  const change = (index, name, next) => setItems((current) => current.map((item, position) => (position === index ? { ...item, [name]: next } : item)));
  const move = (index, delta) =>
    setItems((current) => {
      const next = [...current];
      const [moved] = next.splice(index, 1);
      next.splice(index + delta, 0, moved);
      return next;
    });

  return (
    <Card title="Why choose us">
      <p className="-mt-2 mb-5 text-sm text-slate-600">The reasons shown on the home page. Between 1 and {MAX_REASONS}.</p>
      <SettingsForm settingKey="whyChooseUs" label="reasons"onSave={() => saveSetting('whyChooseUs', items)} disabled={items.length === 0}>
        {({ errors }) => (
          <div className="space-y-4">
            {items.map((item, index) => (
              <fieldset key={index} className="rounded-2xl border border-slate-200 p-4">
                <legend className="px-2 text-sm font-semibold text-slate-500">Reason {index + 1}</legend>
                <div className="grid gap-4 sm:grid-cols-2">
                  <FieldInput field={{ name: 'title', label: 'Title', required: true }} value={item.title} error={errors[`${index}.title`]} onChange={(name, next) => change(index, name, next)} />
                  <FieldInput field={{ name: 'icon', label: 'Icon', type: 'icon' }} value={item.icon} error={errors[`${index}.icon`]} onChange={(name, next) => change(index, name, next)} />
                  <FieldInput field={{ name: 'description', label: 'Description', type: 'textarea', rows: 2 }} value={item.description} error={errors[`${index}.description`]} onChange={(name, next) => change(index, name, next)} />
                </div>
                <div className="mt-3 flex justify-end gap-1">
                  <button type="button" onClick={() => move(index, -1)} disabled={index === 0} aria-label={`Move reason ${index + 1} up`} className="rounded-full p-2 text-slate-500 hover:bg-slate-100 disabled:opacity-30"><ArrowUp className="h-4 w-4" aria-hidden="true" /></button>
                  <button type="button" onClick={() => move(index, 1)} disabled={index === items.length - 1} aria-label={`Move reason ${index + 1} down`} className="rounded-full p-2 text-slate-500 hover:bg-slate-100 disabled:opacity-30"><ArrowDown className="h-4 w-4" aria-hidden="true" /></button>
                  <button type="button" onClick={() => setItems((current) => current.filter((_, position) => position !== index))} disabled={items.length === 1} aria-label={`Remove reason ${index + 1}`} className="rounded-full p-2 text-slate-500 hover:bg-red-50 hover:text-red-600 disabled:opacity-30"><Trash2 className="h-4 w-4" aria-hidden="true" /></button>
                </div>
              </fieldset>
            ))}
            {items.length < MAX_REASONS && (
              <Button variant="outline" onClick={() => setItems((current) => [...current, { title: '', description: '', icon: 'sparkles' }])}>
                <Plus className="h-4 w-4" aria-hidden="true" />
                Add a reason
              </Button>
            )}
          </div>
        )}
      </SettingsForm>
    </Card>
  );
}

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
          <ReasonsSection value={data.settings.whyChooseUs} />
          {SECTIONS.slice(4).map((section) => (
            <SimpleSection key={section.key} section={section} value={data.settings[section.key]} />
          ))}
        </div>
      )}
    </>
  );
}
