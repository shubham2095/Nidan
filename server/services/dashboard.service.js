const { Op, fn, col } = require('sequelize');
const { Appointment, Patient, Doctor, Location, Lead, FollowUp } = require('../models');
const { nowInIndia, addDays } = require('../utils/datetime');
const { ROLES } = require('../utils/constants');
const { doctorIdFor } = require('./access.service');

const CHART_DAYS_BEFORE = 6;
const CHART_DAYS_AFTER = 7;

/** Numbers and lists for the CRM home screen. Doctors only see their own appointments and tasks. */
const get = async (actor) => {
  const { date: today } = nowInIndia();
  const doctorId = doctorIdFor(actor);
  const isDoctor = actor.role === ROLES.DOCTOR;
  const mine = doctorId ? { doctorId } : {};
  const active = { [Op.ne]: 'cancelled' };
  const taskScope = isDoctor ? { assignedTo: actor.id } : {};

  const chartFrom = addDays(today, -CHART_DAYS_BEFORE);
  const chartTo = addDays(today, CHART_DAYS_AFTER);
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [todayRows, pendingConfirmations, tomorrow, followUpsToday, followUpsOverdue, perDayRows, newLeads, sourceRows] = await Promise.all([
    Appointment.findAll({
      where: { ...mine, appointmentDate: today, status: active },
      include: [
        { model: Patient, as: 'patient', attributes: ['id', 'name', 'type', 'phone'], paranoid: false },
        { model: Doctor, as: 'doctor', attributes: ['id', 'name'] },
        { model: Location, as: 'location', attributes: ['id', 'name'] },
      ],
      order: [['startTime', 'ASC']],
    }),
    Appointment.count({ where: { ...mine, status: 'pending', appointmentDate: { [Op.gte]: today } } }),
    Appointment.count({ where: { ...mine, appointmentDate: addDays(today, 1), status: active } }),
    FollowUp.count({ where: { ...taskScope, status: 'open', dueDate: today } }),
    FollowUp.count({ where: { ...taskScope, status: 'open', dueDate: { [Op.lt]: today } } }),
    Appointment.findAll({
      attributes: ['appointmentDate', [fn('COUNT', col('id')), 'count']],
      where: { ...mine, status: active, appointmentDate: { [Op.between]: [chartFrom, chartTo] } },
      group: ['appointmentDate'],
      raw: true,
    }),
    isDoctor ? null : Lead.count({ where: { status: 'new' } }),
    isDoctor
      ? null
      : Lead.findAll({
          attributes: ['source', [fn('COUNT', col('id')), 'count']],
          where: { createdAt: { [Op.gte]: thirtyDaysAgo } },
          group: ['source'],
          raw: true,
        }),
  ]);

  const countsByDate = new Map(perDayRows.map((row) => [row.appointmentDate, Number(row.count)]));
  const appointmentsPerDay = Array.from({ length: CHART_DAYS_BEFORE + CHART_DAYS_AFTER + 1 }, (_, index) => {
    const date = addDays(chartFrom, index);
    return { date, count: countsByDate.get(date) || 0, isToday: date === today };
  });

  return {
    today,
    counts: {
      appointmentsToday: todayRows.length,
      appointmentsTomorrow: tomorrow,
      pendingConfirmations,
      newLeads,
      followUpsDueToday: followUpsToday,
      followUpsOverdue,
    },
    todaysAppointments: todayRows.map((a) => ({
      id: a.id,
      bookingRef: a.bookingRef,
      status: a.status,
      startTime: a.startTime,
      endTime: a.endTime,
      patient: a.patient,
      doctor: a.doctor,
      location: a.location,
    })),
    appointmentsPerDay,
    leadSources: sourceRows ? sourceRows.map((row) => ({ source: row.source, count: Number(row.count) })).sort((a, b) => b.count - a.count) : null,
  };
};

module.exports = { get };
