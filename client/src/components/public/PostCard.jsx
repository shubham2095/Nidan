import { Link } from 'react-router-dom';
import { Clock } from 'lucide-react';
import { formatDate } from '../../utils/format.js';

export default function PostCard({ post }) {
  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
      <Link to={`/blog/${post.slug}`} className="block aspect-[16/9] overflow-hidden bg-gradient-to-br from-blush-100 to-brand-100">
        {post.coverImageUrl && (
          <img
            src={post.coverImageUrl}
            alt=""
            loading="lazy" decoding="async"
            width="640"
            height="360"
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
        )}
      </Link>
      <div className="flex flex-1 flex-col p-6">
        {post.category && (
          <span className="mb-3 w-fit rounded-full bg-blush-100 px-2.5 py-1 text-xs font-semibold text-blush-700">{post.category.name}</span>
        )}
        <h3 className="text-xl leading-snug font-bold">
          <Link to={`/blog/${post.slug}`} className="hover:text-brand-700">
            {post.title}
          </Link>
        </h3>
        <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-600">{post.excerpt}</p>
        <p className="mt-4 flex items-center gap-3 text-xs text-slate-500">
          <time dateTime={post.publishedAt}>{formatDate(post.publishedAt)}</time>
          <span className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" aria-hidden="true" />
            {post.readingMinutes} min read
          </span>
        </p>
      </div>
    </article>
  );
}
