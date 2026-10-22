import { useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, EyeOff, ImagePlus, Loader2, Pencil, Trash2 } from 'lucide-react';
import AdminHeader, { Card } from '../../components/admin/AdminHeader.jsx';
import ConfirmDialog from '../../components/admin/ConfirmDialog.jsx';
import FieldInput from '../../components/admin/FieldInput.jsx';
import Modal from '../../components/admin/Modal.jsx';
import ResourceManager from '../../components/admin/ResourceManager.jsx';
import Button from '../../components/public/Button.jsx';
import { Field, FormMessage } from '../../components/public/FormField.jsx';
import { EmptyState, ErrorState, LoadingState } from '../../components/public/States.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import useFetch from '../../hooks/useFetch.js';
import { deleteGalleryImage, galleryCategories, listGalleryImages, reorderGalleryImages, updateGalleryImage, uploadGalleryImage } from '../../services/adminService.js';
import { serverFieldErrors } from '../../utils/crm.js';

const categoryFields = [
  { name: 'name', label: 'Album name', required: true },
  { name: 'slug', label: 'Web address (optional)', hint: 'Created from the name if left empty' },
];

function UploadForm({ categories, onUploaded }) {
  const toast = useToast();
  const input = useRef(null);
  const [file, setFile] = useState(null);
  const [values, setValues] = useState({ altText: '', title: '', categoryId: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const set = (name) => (event) => setValues((current) => ({ ...current, [name]: event.target.value }));

  const pick = (event) => {
    const chosen = event.target.files?.[0] || null;
    setError(null);
    if (chosen && chosen.size > 5 * 1024 * 1024) {
      setError('That image is larger than 5 MB.');
      event.target.value = '';
      return;
    }
    setFile(chosen);
  };

  const submit = async (event) => {
    event.preventDefault();
    if (!file) return setError('Choose a picture first.');
    if (!values.altText.trim()) return setError('Describe the picture so people using screen readers know what it shows.');
    setBusy(true);
    setError(null);
    try {
      await uploadGalleryImage({ altText: values.altText, title: values.title, categoryId: values.categoryId }, file);
      toast.success('Picture added to the gallery.');
      setFile(null);
      setValues((current) => ({ ...current, altText: '', title: '' }));
      if (input.current) input.current.value = '';
      onUploaded();
    } catch (failure) {
      setError(failure.message);
    } finally {
      setBusy(false);
    }
    return undefined;
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Picture (JPEG, PNG or WebP, up to 5 MB)" required>
          {(props) => <input {...props} ref={input} type="file" accept="image/jpeg,image/png,image/webp" onChange={pick} className="field-input file:mr-3 file:rounded-full file:border-0 file:bg-brand-50 file:px-3 file:py-1 file:font-semibold file:text-brand-800" />}
        </Field>
        <Field label="Album">
          {(props) => (
            <select {...props} value={values.categoryId} onChange={set('categoryId')} className="field-input">
              <option value="">No album</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>{category.name}</option>
              ))}
            </select>
          )}
        </Field>
        <Field label="Description for screen readers" required hint="e.g. The reception area at our Sector 51 clinic">
          {(props) => <input {...props} value={values.altText} onChange={set('altText')} maxLength={300} className="field-input" />}
        </Field>
        <Field label="Caption (optional)">{(props) => <input {...props} value={values.title} onChange={set('title')} maxLength={200} className="field-input" />}</Field>
      </div>
      <FormMessage type="error">{error}</FormMessage>
      <Button type="submit" disabled={busy}>
        {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <ImagePlus className="h-4 w-4" aria-hidden="true" />}
        Add to gallery
      </Button>
    </form>
  );
}

function EditImageModal({ image, categories, onClose, onSaved }) {
  const toast = useToast();
  const [values, setValues] = useState({ altText: image.altText, title: image.title || '', categoryId: image.categoryId ? String(image.categoryId) : '', isActive: image.isActive });
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState(null);
  const change = (name, value) => setValues((current) => ({ ...current, [name]: value }));

  const save = async (event) => {
    event.preventDefault();
    setBusy(true);
    try {
      await updateGalleryImage(image.id, values);
      toast.success('Picture updated.');
      onSaved();
      onClose();
    } catch (error) {
      const { fields, message } = serverFieldErrors(error, []);
      setErrors(fields);
      setFormError(message);
      setBusy(false);
    }
  };

  return (
    <Modal title="Edit picture" onClose={onClose} dismissible={!busy} footer={<><Button variant="outline" onClick={onClose} disabled={busy}>Cancel</Button><Button type="submit" form="image-form" disabled={busy}>Save</Button></>}>
      <img src={image.imageUrl} alt="" className="mb-4 max-h-48 rounded-2xl object-cover" />
      <form id="image-form" onSubmit={save} className="grid gap-4">
        <FieldInput field={{ name: 'altText', label: 'Description for screen readers', required: true }} value={values.altText} error={errors.altText} onChange={change} />
        <FieldInput field={{ name: 'title', label: 'Caption (optional)' }} value={values.title} onChange={change} />
        <FieldInput field={{ name: 'categoryId', label: 'Album', type: 'select', options: [['', 'No album'], ...categories.map((category) => [String(category.id), category.name])] }} value={values.categoryId} onChange={change} />
        <FieldInput field={{ name: 'isActive', type: 'checkbox', checkboxLabel: 'Show on the website' }} value={values.isActive} onChange={change} />
        <FormMessage type="error">{formError}</FormMessage>
      </form>
    </Modal>
  );
}

export default function GalleryAdminPage() {
  const toast = useToast();
  const categories = useFetch((signal) => galleryCategories.list(signal), []);
  const images = useFetch((signal) => listGalleryImages(signal), []);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const list = images.data?.items || [];

  const move = async (index, delta) => {
    const ids = list.map((image) => image.id);
    const [moved] = ids.splice(index, 1);
    ids.splice(index + delta, 0, moved);
    try {
      await reorderGalleryImages(ids);
      images.reload();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const categoryName = (id) => categories.data?.items.find((category) => category.id === id)?.name;

  return (
    <>
      <AdminHeader title="Gallery" description="Pictures shown on the Gallery page and the home page. The first pictures in the list appear on the home page." />
      <div className="space-y-6">
        <Card title="Add a picture">
          <UploadForm categories={categories.data?.items || []} onUploaded={images.reload} />
        </Card>

        <Card title="Pictures">
          {images.loading && !images.data && <LoadingState className="py-8" />}
          {images.error && <ErrorState message={images.error} onRetry={images.reload} className="py-8" />}
          {images.data && list.length === 0 && <EmptyState title="No pictures yet" message="Add the first one above." className="py-8" />}
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {list.map((image, index) => (
              <li key={image.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                <div className="relative aspect-[4/3] bg-slate-100">
                  <img src={image.imageUrl} alt={image.altText} loading="lazy" className={`h-full w-full object-cover ${image.isActive ? '' : 'opacity-40'}`} />
                  {!image.isActive && <span className="absolute top-2 left-2 flex items-center gap-1 rounded-full bg-slate-900/80 px-2.5 py-1 text-xs font-semibold text-white"><EyeOff className="h-3.5 w-3.5" aria-hidden="true" />Hidden</span>}
                </div>
                <div className="p-3">
                  <p className="truncate text-sm font-semibold text-slate-900">{image.title || image.altText}</p>
                  <p className="truncate text-xs text-slate-500">{categoryName(image.categoryId) || 'No album'}</p>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="flex">
                      <button type="button" onClick={() => move(index, -1)} disabled={index === 0} aria-label="Move earlier" className="rounded-full p-1.5 text-slate-500 hover:bg-slate-100 disabled:opacity-30"><ArrowLeft className="h-4 w-4" aria-hidden="true" /></button>
                      <button type="button" onClick={() => move(index, 1)} disabled={index === list.length - 1} aria-label="Move later" className="rounded-full p-1.5 text-slate-500 hover:bg-slate-100 disabled:opacity-30"><ArrowRight className="h-4 w-4" aria-hidden="true" /></button>
                    </span>
                    <span className="flex">
                      <button type="button" onClick={() => setEditing(image)} aria-label={`Edit ${image.title || image.altText}`} className="rounded-full p-1.5 text-slate-500 hover:bg-slate-100"><Pencil className="h-4 w-4" aria-hidden="true" /></button>
                      <button type="button" onClick={() => setDeleting(image)} aria-label={`Delete ${image.title || image.altText}`} className="rounded-full p-1.5 text-slate-500 hover:bg-red-50 hover:text-red-600"><Trash2 className="h-4 w-4" aria-hidden="true" /></button>
                    </span>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </Card>

        <Card>
          <ResourceManager
            embedded
            title="Albums"
            singular="Album"
            api={galleryCategories}
            columns={[{ key: 'name', header: 'Album', render: (category) => <span className="font-semibold text-slate-900">{category.name}</span> }, { key: 'slug', header: 'Address', render: (category) => <span className="text-slate-500">{category.slug}</span> }]}
            fields={categoryFields}
            initial={{ name: '', slug: '' }}
            canReorder
            onChanged={() => { categories.reload(); images.reload(); }}
            deleteMessage={(category) => `The album “${category.name}” will be deleted. Its pictures stay in the gallery without an album.`}
          />
        </Card>
      </div>

      {editing && <EditImageModal image={editing} categories={categories.data?.items || []} onClose={() => setEditing(null)} onSaved={images.reload} />}
      {deleting && (
        <ConfirmDialog
          title="Delete this picture?"
          message="It will be removed from the website and its file deleted."
          confirmLabel="Delete picture"
          danger
          onConfirm={async () => { await deleteGalleryImage(deleting.id); toast.success('Picture deleted.'); images.reload(); }}
          onClose={() => setDeleting(null)}
        />
      )}
    </>
  );
}
