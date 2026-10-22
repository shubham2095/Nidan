/** { limit, offset } for Sequelize from validated page / pageSize numbers. */
const pageWindow = ({ page, pageSize }) => ({ limit: pageSize, offset: (page - 1) * pageSize });

/** Standard list response: { items, page, pageSize, total, totalPages } */
const pageResult = (items, total, { page, pageSize }) => ({
  items,
  page,
  pageSize,
  total,
  totalPages: Math.max(1, Math.ceil(total / pageSize)),
});

/** Escapes % and _ so user text cannot act as a LIKE wildcard. */
const escapeLike = (value) => value.replace(/[\\%_]/g, '\\$&');

module.exports = { pageWindow, pageResult, escapeLike };
