const { Op, fn, col } = require('sequelize');
const { ActivityLog } = require('../models');
const { pageWindow, pageResult, escapeLike } = require('../utils/pagination');

// Never persist credentials, tokens or free-text medical/visit notes in the audit trail.
const SENSITIVE_FIELD = /pass|token|hash|secret|note/i;

const scrub = (changes) => {
  if (!changes || typeof changes !== 'object') return null;
  const safe = Object.fromEntries(Object.entries(changes).filter(([field]) => !SENSITIVE_FIELD.test(field)));
  return Object.keys(safe).length ? safe : null;
};

/**
 * Writes one audit entry. Logging problems are reported but never fail the request.
 * `changes` is an optional { field: { from, to } } map of non-sensitive values.
 */
const record = async ({ user, entityType, entityId = null, action, summary = null, changes = null, req = null }) => {
  try {
    await ActivityLog.create({
      userId: user?.id ?? null,
      userName: user?.name ?? null,
      entityType,
      entityId,
      action,
      summary,
      changes: scrub(changes),
      ipAddress: req?.ip ?? null,
    });
  } catch (error) {
    console.error(`[activity] could not write log entry: ${error.message}`);
  }
};

/** Filtered, paged audit trail for the Activity log screen. */
const list = async ({ q, userId, entityType, action, from, to, page, pageSize }) => {
  const where = {};
  if (userId) where.userId = userId;
  if (entityType) where.entityType = entityType;
  if (action) where.action = action;
  if (q) where.summary = { [Op.like]: `%${escapeLike(q)}%` };
  if (from || to) {
    // Dates are India dates; the log stores UTC timestamps (IST = UTC+5:30).
    const start = from ? new Date(`${from}T00:00:00+05:30`) : null;
    const end = to ? new Date(`${to}T23:59:59.999+05:30`) : null;
    where.createdAt = { ...(start && { [Op.gte]: start }), ...(end && { [Op.lte]: end }) };
  }

  const [{ rows, count }, entityTypes, actions] = await Promise.all([
    ActivityLog.findAndCountAll({ where, order: [['createdAt', 'DESC'], ['id', 'DESC']], ...pageWindow({ page, pageSize }) }),
    ActivityLog.findAll({ attributes: [[fn('DISTINCT', col('entity_type')), 'entityType']], raw: true }),
    ActivityLog.findAll({ attributes: [[fn('DISTINCT', col('action')), 'action']], raw: true }),
  ]);

  return {
    ...pageResult(
      rows.map((row) => ({
        id: row.id,
        createdAt: row.createdAt,
        userId: row.userId,
        userName: row.userName,
        entityType: row.entityType,
        entityId: row.entityId,
        action: row.action,
        summary: row.summary,
        changes: row.changes,
        ipAddress: row.ipAddress,
      })),
      count,
      { page, pageSize },
    ),
    entityTypes: entityTypes.map((item) => item.entityType).sort(),
    actions: actions.map((item) => item.action).sort(),
  };
};

module.exports = { record, list };
