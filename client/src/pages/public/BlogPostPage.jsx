import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Clock } from 'lucide-react';
import ContactStrip from '../../components/public/ContactStrip.jsx';
import PageHeader from '../../components/public/PageHeader.jsx';
import PostCard from '../../components/public/PostCard.jsx';
import { RevealGrid } from '../../components/public/Reveal.jsx';
import Section, { SectionHeading } from '../../components/public/Section.jsx';
import Seo from '../../components/public/Seo.jsx';
import { ErrorState, LoadingState } from '../../components/public/States.jsx';
import { useSite } from '../../context/SiteContext.jsx';
import useFetch from '../../hooks/useFetch.js';
import { getPost } from '../../services/publicService.js';
import { formatDate } from '../../utils/format.js';
import { articleJsonLd } from '../../utils/jsonLd.js';
import NotFoundPage from './NotFoundPage.jsx';

export default function BlogPostPage() {
  const { slug } = useParams();
  const site = useSite();
  const { data: post, loading, error, status, reload } = useFetch((signal) => getPost(slug, signal), [slug]);

  if (status === 404) return <NotFoundPage />;
  if (loading) return <LoadingState className="min-h-[50vh]" />;
  if (error) return <ErrorState message={error} onRetry={reload} />;

  return (
    <>
      <Seo
        title={post.metaTitle || post.title}
        description={post.metaDescription || post.excerpt}
        image={post.coverImageUrl}
        type="article"
        jsonLd={articleJsonLd(post, site, window.location.origin)}
      />
      <PageHeader title={post.title} crumbs={[{ label: 'Blog', to: '/blog' }, { label: post.title }]}>
        <p className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-slate-600">
          {post.category && <span className="rounded-full bg-blush-100 px-3 py-1 font-semibold text-blush-700">{post.category.name}</span>}
          <time dateTime={post.publishedAt}>{formatDate(post.publishedAt)}</time>
          {post.authorName && <span>By {post.authorName}</span>}
          <span className="flex items-center gap-1">
            <Clock className="h-4 w-4" aria-hidden="true" />
            {post.readingMinutes} min read
          </span>
        </p>
      </PageHeader>

      <Section>
        <div className="mx-auto max-w-3xl">
          <article>
            {post.coverImageUrl && (
              <img src={post.coverImageUrl} alt="" width="1200" height="675" className="mb-8 aspect-video w-full rounded-3xl object-cover" />
            )}
            <div className="rich-text text-lg" dangerouslySetInnerHTML={{ __html: post.content }} />
          </article>
          <p className="mt-10">
            <Link to="/blog" className="inline-flex items-center gap-2 font-semibold text-brand-700 hover:underline">
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Back to all articles
            </Link>
          </p>
        </div>
      </Section>

      {post.related.length > 0 && (
        <Section tone="soft">
          <SectionHeading title="Keep reading" />
          <RevealGrid className="grid gap-6 md:grid-cols-3" columns={3}>
            {post.related.map((item) => (
              <PostCard key={item.id} post={item} />
            ))}
          </RevealGrid>
        </Section>
      )}
      <ContactStrip />
    </>
  );
}
