const { mapsSearchUrl, mapsEmbedUrl } = require('./maps');

/**
 * Creates a row only if none matches `where`. Existing rows are never touched,
 * so re-running seeders cannot overwrite edits made in the admin panel.
 */
const createOnce = (Model, where, values = {}, options = {}) =>
  Model.findOrCreate({ where, defaults: { ...where, ...values }, ...options });

/**
 * Replaces a doctor's timetable at the given locations. `timetable` maps a location slug to blocks of
 * { days: [weekday numbers, 0 = Sunday], start: 'HH:MM:SS', end: 'HH:MM:SS' }. Other locations are left alone.
 * Used by seeders that set a doctor's own timings, which run once, before anyone edits them in the admin panel.
 */
const replaceTimetable = async ({ Doctor, DoctorSchedule, Location }, doctorSlug, timetable) => {
  const doctor = await Doctor.findOne({ where: { slug: doctorSlug } });
  if (!doctor) return;

  await DoctorSchedule.sequelize.transaction(async (transaction) => {
    for (const [slug, blocks] of Object.entries(timetable)) {
      const location = await Location.findOne({ where: { slug }, transaction });
      if (!location) continue;

      await DoctorSchedule.destroy({ where: { doctorId: doctor.id, locationId: location.id }, transaction });
      await DoctorSchedule.bulkCreate(
        blocks.flatMap(({ days, start, end }) =>
          days.map((weekday) => ({ doctorId: doctor.id, locationId: location.id, weekday, startTime: start, endTime: end })),
        ),
        { transaction },
      );
    }
  });
};

module.exports = { createOnce, replaceTimetable, mapsSearchUrl, mapsEmbedUrl };
