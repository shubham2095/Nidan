const { ActivityLog } = require('../models');

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

module.exports = { record };
