const ApiError = require('../utils/ApiError');
const activityLog = require('./activityLog.service');

/**
 * Standard list / create / update / delete / reorder for a simple content table, with audit-log entries.
 *
 *  - `prepare(input, existing)` returns the columns to save (slug generation, HTML sanitising ...)
 *  - `describe(row)` is the name used in the audit-log summary
 *  - `beforeRemove(row)` may clean up (e.g. delete an uploaded file) or throw to refuse
 */
const createCrud = ({
  Model, entity, label, order = [['sortOrder', 'ASC'], ['id', 'ASC']], prepare = async (input) => input,
  describe = (row) => row.name || row.title, serialize = (row) => row.toJSON(), beforeRemove, listOptions = () => ({}),
}) => {
  const find = async (id) => {
    const row = await Model.findByPk(id, listOptions());
    if (!row) throw ApiError.notFound(`${label} not found`);
    return row;
  };

  return {
    find,
    list: async () => ({ items: (await Model.findAll({ order, ...listOptions() })).map(serialize) }),
    get: async (id) => serialize(await find(id)),

    create: async (actor, input, req) => {
      const data = await prepare(input, null);
      const row = await Model.create(data);
      await activityLog.record({ user: actor, entityType: entity, entityId: row.id, action: 'create', summary: `Added ${label.toLowerCase()} ${describe(row)}`, req });
      return serialize(await find(row.id));
    },

    update: async (actor, id, input, req) => {
      const row = await find(id);
      const data = await prepare(input, row);
      const changes = {};
      for (const [key, value] of Object.entries(data)) {
        if (JSON.stringify(row[key]) !== JSON.stringify(value)) changes[key] = { from: row[key], to: value };
      }
      for (const long of ['description', 'content', 'bio', 'body']) delete changes[long]; // long text: the summary is enough
      await row.update(data);
      await activityLog.record({ user: actor, entityType: entity, entityId: row.id, action: 'update', summary: `Edited ${label.toLowerCase()} ${describe(row)}`, changes, req });
      return serialize(await find(id));
    },

    remove: async (actor, id, req) => {
      const row = await find(id);
      if (beforeRemove) await beforeRemove(row);
      await row.destroy();
      await activityLog.record({ user: actor, entityType: entity, entityId: id, action: 'delete', summary: `Deleted ${label.toLowerCase()} ${describe(row)}`, req });
    },

    /** Saves the display order: `ids` is the full list in the new order. */
    reorder: async (actor, ids, req) => {
      await Promise.all(ids.map((id, index) => Model.update({ sortOrder: index + 1 }, { where: { id } })));
      await activityLog.record({ user: actor, entityType: entity, action: 'reorder', summary: `Reordered ${label.toLowerCase()}s`, req });
      return { items: (await Model.findAll({ order, ...listOptions() })).map(serialize) };
    },
  };
};

module.exports = createCrud;
