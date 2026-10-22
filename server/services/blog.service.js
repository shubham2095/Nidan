const { Op } = require('sequelize');
const { BlogPost, BlogCategory, User } = require('../models');
const ApiError = require('../utils/ApiError');
const { slugify, uniqueSlug } = require('../utils/slug');
const { sanitizeRichText } = require('../utils/sanitize');
const { pageWindow, pageResult, escapeLike } = require('../utils/pagination');
const mediaService = require('./media.service');
const activityLog = require('./activityLog.service');

const INCLUDE = [
  { model: BlogCategory, as: 'category', attributes: ['id', 'name', 'slug'] },
  { model: User, as: 'creator', attributes: ['id', 'name'] },
];

const serialize = (post, { withContent = false } = {}) => ({
  id: post.id,
  title: post.title,
  slug: post.slug,
  excerpt: post.excerpt,
  coverImageUrl: post.coverImageUrl,
  authorName: post.authorName,
  status: post.status,
  publishedAt: post.publishedAt,
  metaTitle: post.metaTitle,
  metaDescription: post.metaDescription,
  category: post.category || null,
  createdBy: post.creator?.name || null,
  updatedAt: post.updatedAt,
  // "Scheduled" = published but with a future date; visitors do not see it yet.
  scheduled: post.status === 'published' && post.publishedAt && new Date(post.publishedAt) > new Date(),
  ...(withContent && { content: post.content }),
});

const list = async ({ status, categoryId, q, page, pageSize }) => {
  const where = {};
  if (status) where.status = status;
  if (categoryId) where.categoryId = categoryId;
  if (q) where.title = { [Op.like]: `%${escapeLike(q)}%` };
  const { rows, count } = await BlogPost.findAndCountAll({
    where,
    include: INCLUDE,
    order: [['updatedAt', 'DESC'], ['id', 'DESC']],
    ...pageWindow({ page, pageSize }),
  });
  return pageResult(rows.map((post) => serialize(post)), count, { page, pageSize });
};

const find = async (id) => {
  const post = await BlogPost.findByPk(id, { include: INCLUDE });
  if (!post) throw ApiError.notFound('Article not found');
  return post;
};

const get = async (id) => serialize(await find(id), { withContent: true });

const ensureCategory = async (categoryId) => {
  if (categoryId && !(await BlogCategory.count({ where: { id: categoryId } }))) {
    throw ApiError.badRequest('Unknown category', [{ field: 'categoryId', message: 'Choose an existing category' }]);
  }
};

/** Publishing stamps the publish date (once) unless one was chosen; going back to draft keeps it for later. */
const publishFields = (input, existing) => {
  if (input.status === 'published' && !input.publishedAt && !existing?.publishedAt) return { publishedAt: new Date() };
  return {};
};

const create = async (actor, input, req) => {
  await ensureCategory(input.categoryId);
  const content = sanitizeRichText(input.content);
  const post = await BlogPost.create({
    ...input,
    ...publishFields(input, null),
    content,
    slug: await uniqueSlug(BlogPost, slugify(input.slug || input.title)),
    excerpt: input.excerpt || undefined,
    createdBy: actor.id,
  });
  await activityLog.record({ user: actor, entityType: 'blog_post', entityId: post.id, action: 'create', summary: `Created article ${post.title}`, req });
  return get(post.id);
};

const update = async (actor, id, input, req) => {
  const post = await find(id);
  if (input.categoryId !== undefined) await ensureCategory(input.categoryId);

  const next = { ...input, ...publishFields(input, post) };
  if (next.content !== undefined) next.content = sanitizeRichText(next.content);
  if (next.slug) next.slug = await uniqueSlug(BlogPost, slugify(next.slug), { exceptId: id });

  const previousStatus = post.status;
  const statusChanged = next.status && next.status !== previousStatus;
  const previousCover = post.coverImageUrl;
  await post.update(next);
  if (next.coverImageUrl !== undefined && previousCover && previousCover !== next.coverImageUrl) await mediaService.removeByUrl(previousCover);

  await activityLog.record({
    user: actor,
    entityType: 'blog_post',
    entityId: id,
    action: statusChanged ? 'status_change' : 'update',
    summary: statusChanged ? `Article ${post.title}: ${previousStatus} → ${post.status}` : `Edited article ${post.title}`,
    req,
  });
  return get(id);
};

const remove = async (actor, id, req) => {
  const post = await find(id);
  await mediaService.removeByUrl(post.coverImageUrl);
  await post.destroy();
  await activityLog.record({ user: actor, entityType: 'blog_post', entityId: id, action: 'delete', summary: `Deleted article ${post.title}`, req });
};

module.exports = { list, get, create, update, remove };
