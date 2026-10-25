import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search } from 'lucide-react';
import Button from '../../components/public/Button.jsx';
import PageHeader from '../../components/public/PageHeader.jsx';
import Pagination from '../../components/public/Pagination.jsx';
import PostCard from '../../components/public/PostCard.jsx';
import { RevealGrid } from '../../components/public/Reveal.jsx';
import Section from '../../components/public/Section.jsx';
import Seo from '../../components/public/Seo.jsx';
import { EmptyState, ErrorState, LoadingState } from '../../components/public/States.jsx';
import useFetch from '../../hooks/useFetch.js';
import { getPostCategories, getPosts } from '../../services/publicService.js';

export default function BlogPage() {
  const [params, setParams] = useSearchParams();
  const page = Math.max(1, Number(params.get('page')) || 1);
  const category = params.get('category') || '';
  const q = params.get('q') || '';
  const [search, setSearch] = useState(q);

  useEffect(() => {
    setSearch(q);
  }, [q]);

  const posts = useFetch((signal) => getPosts({ page, category: category || undefined, q: q || undefined }, signal), [page, category, q]);
  const categories = useFetch((signal) => getPostCategories(signal), []);

  const update = (changes) => {
    const next = new URLSearchParams(params);
    Object.entries(changes).forEach(([key, value]) => (value ? next.set(key, value) : next.delete(key)));
    if (!('page' in changes)) next.delete('page');
    setParams(next);
  };

  const chip = (selected) =>
    `rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
      selected ? 'bg-brand-700 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
    }`;

  return (
    <>
      <Seo title="Blog" description="Practical, friendly advice on pregnancy, newborn care, vaccinations, fertility and women's health from the doctors at NIDAN Mother & Child Clinic." />
      <PageHeader title="Our Blog" crumbs={[{ label: 'Blog' }]} description="Helpful reading on pregnancy, newborn and child health, and women's wellbeing." />

      <Section>
        <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          {categories.data?.items.length > 0 && (
            <div role="group" aria-label="Filter articles by category" className="flex flex-wrap gap-2">
              <button type="button" aria-pressed={!category} onClick={() => update({ category: '' })} className={chip(!category)}>
                All
              </button>
              {categories.data.items.map((item) => (
                <button key={item.id} type="button" aria-pressed={category === item.slug} onClick={() => update({ category: item.slug })} className={chip(category === item.slug)}>
                  {item.name}
                </button>
              ))}
            </div>
          )}
          <form
            role="search"
            onSubmit={(event) => {
              event.preventDefault();
              update({ q: search.trim() });
            }}
            className="flex w-full gap-2 lg:max-w-sm"
          >
            <label htmlFor="blog-search" className="sr-only">
              Search articles
            </label>
            <input id="blog-search" type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search articles" maxLength={100} className="field-input" />
            <Button type="submit" aria-label="Search">
              <Search className="h-4 w-4" aria-hidden="true" />
            </Button>
          </form>
        </div>

        {posts.loading && <LoadingState />}
        {posts.error && <ErrorState message={posts.error} onRetry={posts.reload} />}

        {posts.data && posts.data.items.length === 0 && (
          <EmptyState
            title={q || category ? 'No articles match your search' : 'Articles are on their way'}
            message={q || category ? 'Try a different word or clear the filters.' : 'Our doctors are preparing helpful articles for you. Please check back soon.'}
          >
            {(q || category) && (
              <Button variant="outline" onClick={() => setParams(new URLSearchParams())}>
                Clear filters
              </Button>
            )}
          </EmptyState>
        )}

        {posts.data && posts.data.items.length > 0 && (
          <>
            <RevealGrid className="grid gap-6 md:grid-cols-2 lg:grid-cols-3" columns={3}>
              {posts.data.items.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </RevealGrid>
            <Pagination page={posts.data.page} totalPages={posts.data.totalPages} onChange={(next) => update({ page: next > 1 ? String(next) : '' })} />
          </>
        )}
      </Section>
    </>
  );
}
