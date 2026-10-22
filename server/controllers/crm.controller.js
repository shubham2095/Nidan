const leads = require('../services/lead.service');
const followUps = require('../services/followUp.service');
const dashboard = require('../services/dashboard.service');
const respond = require('../utils/respond');
const { User } = require('../models');

const dashboardGet = respond((req) => dashboard.get(req.user));

const leadList = respond((req) => leads.list(req.user, req.valid.query));
const leadGet = respond((req) => leads.get(req.valid.params.id).then((lead) => ({ lead })));
const leadCreate = respond((req) => leads.create(req.user, req.valid.body, req).then((lead) => ({ lead })), 201);
const leadUpdate = respond((req) => leads.update(req.user, req.valid.params.id, req.valid.body, req).then((lead) => ({ lead })));
const leadNote = respond((req) => leads.addNote(req.user, req.valid.params.id, req.valid.body, req).then((note) => ({ note })), 201);
const leadConvert = respond((req) => leads.convert(req.user, req.valid.params.id, req.valid.body, req));
const leadDelete = async (req, res) => {
  await leads.remove(req.user, req.valid.params.id, req);
  res.status(204).end();
};

const followUpList = respond((req) => followUps.list(req.user, req.valid.query));
const followUpCreate = respond((req) => followUps.create(req.user, req.valid.body, req).then((followUp) => ({ followUp })), 201);
const followUpUpdate = respond((req) => followUps.update(req.user, req.valid.params.id, req.valid.body, req).then((followUp) => ({ followUp })));
const followUpDelete = async (req, res) => {
  await followUps.remove(req.user, req.valid.params.id, req);
  res.status(204).end();
};

/** Active staff, for "assigned to" dropdowns. */
const userOptions = respond(async () => {
  const users = await User.findAll({ where: { isActive: true }, attributes: ['id', 'name', 'role'], order: [['name', 'ASC']] });
  return { items: users };
});

module.exports = {
  dashboardGet, leadList, leadGet, leadCreate, leadUpdate, leadNote, leadConvert, leadDelete,
  followUpList, followUpCreate, followUpUpdate, followUpDelete, userOptions,
};
