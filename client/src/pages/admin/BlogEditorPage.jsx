import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ExternalLink, Loader2, Trash2 } from 'lucide-react';
import AdminHeader, { Card } from '../../components/admin/AdminHeader.jsx';
import ConfirmDialog from '../../components/admin/ConfirmDialog.jsx';
import ImageUpload from '../../components/admin/ImageUpload.jsx';
import RichTextEditor from '../../components/admin/RichTextEditor.jsx';
import StatusBadge from '../../components/admin/StatusBadge.jsx';
import Button from '../../components/public/Button.jsx';
import { Field, FormMessage } from '../../components/public/FormField.jsx';
import { ErrorState, LoadingState } from '../../components/public/States.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import useFetch from '../../hooks/useFetch.js';
import { blogCategories, createPost, deletePost, getPost, updatePost, uploadImage } from '../../services/adminService.js';
import { serverFieldErrors } from '../../utils/crm.js';
import { fromIstInput, toIstInput } from '../../utils/format.js';
import NotFoundPage from '../public/NotFoundPage.jsx';
import { postStatus } from './BlogAdminPage.jsx';

const blank = { title: '', slug: '', excerpt: '', content: '', coverImageUrl: '', categoryId: '', authorName: '', status: 'draft', publishedAt: '', metaTitle: '', metaDescription: '' };

const toValues = (post) => ({
  title: post.title,
  slug: post.slug,
  excerpt: post.excerpt || '',
  content: post.content || '',
  coverImageUrl: post.coverImageUrl || '',
  categoryId: post.category ? String(post.category.id) : '',
  authorName: post.authorName || '',
  status: post.status,
  publishedAt: toIstInput(post.publishedAt),
  metaTitle: post.metaTitle || '',
  metaDescription: post.metaDescription || '',
});

function Editor({ post, categories, onSaved }) {
  const navigate = useNavigate();
  const toast = useToast();
  const [values, setValues] = useState(post ? toValues(post) : blank);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const set = (name) => (event) => setValues((current) => ({ ...current, [name]: event.target.value }));

  const save = async (event) => {
    event.preventDefault();
    const missing = {};
    if (!values.title.trim()) missing.title = 'Enter a title';
    if (!values.content.trim()) missing.content = 'Write the article';
    setErrors(missing);
    if (Object.keys(missing).length) {
      setFormError('Please fill in the highlighted fields.');
      return;
    }
    setBusy(true);
    setFormError(null);
    try {
      const payload = {
        title: values.title,
        slug: values.slug,
        excerpt: values.excerpt,
        content: values.content,
        coverImageUrl: values.coverImageUrl,
        categoryId: values.categoryId,
        authorName: values.authorName,
        status: values.status,
        metaTitle: values.metaTitle,
        metaDescription: values.metaDescription,
        // an empty date means "now" when publishing; it is left as it is, never cleared
        ...(values.publishedAt && { publishedAt: fromIstInput(values.publishedAt) }),
      };
      if (post) {
        const saved = await updatePost(post.id, payload);
        toast.success('Article saved.');
        setValues(toValues(saved.post));
        onSaved(saved.post);
      } else {
        const saved = await createPost(payload);
        toast.success('Article created.');
        navigate(`/admin/blog/${saved.post.id}`, { replace: true });
      }
    } catch (error) {
      const { fields, message } = serverFieldErrors(error, []);
      setErrors(fields);
      setFormError(message);
    } finally {
      setBusy(false);
    }
  };

  const state = post ? postStatus(post) : null;
  const live = post && post.status === 'published' && !post.scheduled;

  return (
    <form onSubmit={save} noValidate>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="space-y-6">
          <Card>
            <div className="space-y-5">
              <Field label="Title" required error={errors.title}>{(props) => <input {...props} value={values.title} onChange={set('title')} maxLength={250} className="field-input text-lg font-semibold" />}</Field>
              <Field label="Summary (optional)" hint="Shown in the article list and in search results. About 150 characters is ideal." error={errors.excerpt}>
                {(props) => <textarea {...props} rows={3} maxLength={600} value={values.excerpt} onChange={set('excerpt')} className="field-input" />}
              </Field>
              <div>
                <span className="mb-1.5 block text-sm font-semibold text-slate-800">Article <span className="text-blush-600" aria-hidden="true">*</span></span>
                <RichTextEditor value={values.content} onChange={(content) => setValues((current) => ({ ...current, content }))} label="Article" minHeight="22rem" />
                {errors.content && <p role="alert" className="mt-1 text-sm text-red-600">{errors.content}</p>}
              </div>
            </div>
          </Card>

          <Card title="Search results (optional)">
            <div className="space-y-4">
              <Field label="Search title" hint="Leave empty to use the article title" error={errors.metaTitle}>{(props) => <input {...props} value={values.metaTitle} onChange={set('metaTitle')} maxLength={200} className="field-input" />}</Field>
              <Field label="Search description" hint="Leave empty to use the summary" error={errors.metaDescription}>{(props) => <textarea {...props} rows={2} maxLength={400} value={values.metaDescription} onChange={set('metaDescription')} className="field-input" />}</Field>
              <Field label="Web address" hint={`/blog/${values.slug || 'created-from-the-title'}`} error={errors.slug}>{(props) => <input {...props} value={values.slug} onChange={set('slug')} maxLength={80} className="field-input" />}</Field>
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card title="Publishing">
            <div className="space-y-4">
              {state && <p className="flex items-center gap-2 text-sm text-slate-600">Now: <StatusBadge {...state} /></p>}
              <Field label="Status" error={errors.status}>
                {(props) => (
                  <select {...props} value={values.status} onChange={set('status')} className="field-input">
                    <option value="draft">Draft (not on the website)</option>
                    <option value="published">Published</option>
                  </select>
                )}
              </Field>
              {values.status === 'published' && (
                <Field label="Publish date and time" hint="Leave empty to publish now. A future date schedules the article." error={errors.publishedAt}>
                  {(props) => <input {...props} type="datetime-local" value={values.publishedAt} onChange={set('publishedAt')} className="field-input" />}
                </Field>
              )}
              <FormMessage type="error">{formError}</FormMessage>
              <div className="flex flex-wrap gap-2">
                <Button type="submit" disabled={busy}>
                  {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
                  {post ? 'Save changes' : values.status === 'published' ? 'Publish' : 'Save draft'}
                </Button>
                {live && (
                  <a href={`/blog/${post.slug}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-full px-4 py-2.5 text-sm font-semibold text-brand-700 hover:bg-brand-50">
                    View on website
                    <ExternalLink className="h-4 w-4" aria-hidden="true" />
                    <span className="sr-only">(opens in a new tab)</span>
                  </a>
                )}
              </div>
            </div>
          </Card>

          <Card title="Details">
            <div className="space-y-4">
              <Field label="Category" error={errors.categoryId}>
                {(props) => (
                  <select {...props} value={values.categoryId} onChange={set('categoryId')} className="field-input">
                    <option value="">No category</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>{category.name}</option>
                    ))}
                  </select>
                )}
              </Field>
              <Field label="Author name" hint="Shown under the title" error={errors.authorName}>{(props) => <input {...props} value={values.authorName} onChange={set('authorName')} maxLength={150} className="field-input" />}</Field>
              <ImageUpload
                label="Cover picture"
                value={values.coverImageUrl}
                hint="Shown at the top of the article and in link previews."
                upload={(file) => uploadImage(file, 'blog')}
                onChange={(url) => setValues((current) => ({ ...current, coverImageUrl: url || '' }))}
              />
              {errors.coverImageUrl && <p role="alert" className="text-sm text-red-600">{errors.coverImageUrl}</p>}
            </div>
          </Card>

          {post && (
            <Button variant="outline" className="!border-red-300 !text-red-700 hover:!bg-red-50" onClick={() => setDeleting(true)}>
              <Trash2 className="h-4 w-4" aria-hidden="true" />
              Delete article
            </Button>
          )}
        </div>
      </div>

      {deleting && (
        <ConfirmDialog
          title="Delete this article?"
          message={`“${post.title}” will be removed from the website for good.`}
          confirmLabel="Delete article"
          danger
          onConfirm={async () => {
            await deletePost(post.id);
            toast.success('Article deleted.');
            navigate('/admin/blog', { replace: true });
          }}
          onClose={() => setDeleting(false)}
        />
      )}
    </form>
  );
}

export default function BlogEditorPage() {
  const { id } = useParams();
  const categories = useFetch((signal) => blogCategories.list(signal), []);
  const [override, setOverride] = useState(null);
  const loaded = useFetch((signal) => (id ? getPost(id, signal) : Promise.resolve(null)), [id]);

  if (id && loaded.status === 404) return <NotFoundPage />;
  if (loaded.error) return <ErrorState message={loaded.error} onRetry={loaded.reload} />;
  // `!loaded.data` rather than `loaded.loading`: right after the address changes the new request has not started yet
  if ((id && !loaded.data) || (categories.loading && !categories.data)) return <LoadingState className="py-24" />;

  const post = id ? (override?.id === loaded.data.post.id ? override : loaded.data.post) : null;

  return (
    <>
      <p className="mb-3 text-sm"><Link to="/admin/blog" className="font-semibold text-brand-700 hover:underline">← All articles</Link></p>
      <AdminHeader title={post ? 'Edit article' : 'New article'} description={post ? post.title : 'Write it now, publish when you are ready.'} />
      <Editor key={post?.id || 'new'} post={post} categories={categories.data?.items || []} onSaved={setOverride} />
    </>
  );
}
