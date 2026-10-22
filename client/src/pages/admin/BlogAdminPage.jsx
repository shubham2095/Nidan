import { useNavigate, useSearchParams } from 'react-router-dom';
import { Plus } from 'lucide-react';
import AdminHeader, { Card } from '../../components/admin/AdminHeader.jsx';
import DataTable from '../../components/admin/DataTable.jsx';
import ResourceManager from '../../components/admin/ResourceManager.jsx';
import SearchBox from '../../components/admin/SearchBox.jsx';
import StatusBadge from '../../components/admin/StatusBadge.jsx';
import Button from '../../components/public/Button.jsx';
import Pagination from '../../components/public/Pagination.jsx';
import useFetch from '../../hooks/useFetch.js';
import { blogCategories, listPosts } from '../../services/adminService.js';
import { formatDate } from '../../utils/format.js';

const categoryFields = [
  { name: 'name', label: 'Category name', required: true },
  { name: 'slug', label: 'Web address (optional)', hint: 'Created from the name if left empty' },
];

export function postStatus(post) {
  if (post.status === 'draft') return { status: 'pending', label: 'Draft' };
  if (post.scheduled) return { status: 'confirmed', label: 'Scheduled' };
  return { status: 'completed', label: 'Published' };
}

export default function BlogAdminPage() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const categories = useFetch((signal) => blogCategories.list(signal), []);
  const filters = { q: params.get('q') || '', status: params.get('status') || '', categoryId: params.get('categoryId') || '' };
  const page = Math.max(1, Number(params.get('page')) || 1);

  const update = (changes, { keepPage = false } = {}) => {
    const next = new URLSearchParams(params);
    Object.entries(changes).forEach(([key, value]) => (value ? next.set(key, value) : next.delete(key)));
    if (!keepPage) next.delete('page');
    setParams(next, { replace: true });
  };

  const { data, loading, error, reload } = useFetch(
    (signal) => listPosts({ q: filters.q || undefined, status: filters.status || undefined, categoryId: filters.categoryId || undefined, page, pageSize: 20 }, signal),
    [filters.q, filters.status, filters.categoryId, page],
  );

  const columns = [
    {
      key: 'title',
      header: 'Article',
      render: (post) => (
        <span>
          <span className="block font-semibold text-slate-900">{post.title}</span>
          <span className="block text-xs text-slate-500">/blog/{post.slug}</span>
        </span>
      ),
    },
    { key: 'status', header: 'Status', render: (post) => <StatusBadge {...postStatus(post)} /> },
    { key: 'category', header: 'Category', render: (post) => post.category?.name || <span className="text-slate-400">None</span> },
    { key: 'published', header: 'Publish date', className: 'whitespace-nowrap text-slate-500', render: (post) => (post.publishedAt ? formatDate(post.publishedAt) : '—') },
    { key: 'updated', header: 'Last edited', className: 'whitespace-nowrap text-slate-500', render: (post) => formatDate(post.updatedAt) },
  ];

  const select = 'field-input py-2 text-sm';

  return (
    <>
      <AdminHeader
        title="Blog"
        description="Articles for parents. Drafts and scheduled articles are not visible on the website."
        actions={
          <Button onClick={() => navigate('/admin/blog/new')}>
            <Plus className="h-4 w-4" aria-hidden="true" />
            New article
          </Button>
        }
      />

      <div className="mb-5 grid gap-3 sm:grid-cols-3">
        <SearchBox value={filters.q} onChange={(value) => update({ q: value })} placeholder="Search by title" label="Search articles" />
        <select aria-label="Filter by status" value={filters.status} onChange={(event) => update({ status: event.target.value })} className={select}>
          <option value="">All statuses</option>
          <option value="draft">Drafts</option>
          <option value="published">Published and scheduled</option>
        </select>
        <select aria-label="Filter by category" value={filters.categoryId} onChange={(event) => update({ categoryId: event.target.value })} className={select}>
          <option value="">All categories</option>
          {categories.data?.items.map((category) => (
            <option key={category.id} value={category.id}>{category.name}</option>
          ))}
        </select>
      </div>

      <DataTable
        caption="Articles"
        columns={columns}
        rows={data?.items}
        loading={loading}
        error={error}
        onRetry={reload}
        onRowClick={(post) => navigate(`/admin/blog/${post.id}`)}
        emptyTitle="No articles found"
        emptyMessage={Object.values(filters).some(Boolean) ? 'Try clearing a filter.' : 'Write the first article with “New article”.'}
      />
      {data && <p className="mt-3 text-sm text-slate-500">{data.total} article{data.total === 1 ? '' : 's'}</p>}
      {data && <Pagination page={data.page} totalPages={data.totalPages} onChange={(next) => update({ page: next > 1 ? String(next) : '' }, { keepPage: true })} />}

      <div className="mt-10">
        <Card>
          <ResourceManager
            embedded
            title="Categories"
            singular="Category"
            api={blogCategories}
            columns={[{ key: 'name', header: 'Category', render: (category) => <span className="font-semibold text-slate-900">{category.name}</span> }, { key: 'slug', header: 'Address', render: (category) => <span className="text-slate-500">{category.slug}</span> }]}
            fields={categoryFields}
            initial={{ name: '', slug: '' }}
            onChanged={() => { categories.reload(); reload(); }}
            deleteMessage={(category) => `The category “${category.name}” will be deleted. Its articles stay on the website without a category.`}
          />
        </Card>
      </div>
    </>
  );
}
