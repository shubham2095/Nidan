const vaccination = require('../services/vaccination.service');
const respond = require('../utils/respond');

const listVaccines = respond((req) => vaccination.listVaccines({ all: req.valid.query.all }));
const createVaccine = respond((req) => vaccination.createVaccine(req.user, req.valid.body, req).then((vaccine) => ({ vaccine })), 201);
const updateVaccine = respond((req) => vaccination.updateVaccine(req.user, req.valid.params.id, req.valid.body, req).then((vaccine) => ({ vaccine })));
const deleteVaccine = async (req, res) => {
  await vaccination.removeVaccine(req.user, req.valid.params.id, req);
  res.status(204).end();
};

const due = respond((req) => vaccination.dueList(req.user, req.valid.query));
const counts = respond((req) => vaccination.counts(req.user));
const forPatient = respond((req) => vaccination.forPatient(req.user, req.valid.params.id));
const markGiven = respond((req) =>
  vaccination.markGiven(req.user, req.valid.params.id, req.valid.params.recordId, req.valid.body, req).then((record) => ({ record })),
);

module.exports = { listVaccines, createVaccine, updateVaccine, deleteVaccine, due, counts, forPatient, markGiven };
