const { tableOptions, id, timestamps, ref, dropTables, DataTypes } = require('../utils/migrationHelpers');

module.exports = {
  async up(queryInterface) {
    await queryInterface.createTable(
      'locations',
      {
        ...id(),
        name: { type: DataTypes.STRING(150), allowNull: false },
        slug: { type: DataTypes.STRING(191), allowNull: false, unique: true },
        address: { type: DataTypes.STRING(500), allowNull: false },
        city: { type: DataTypes.STRING(100), allowNull: false, defaultValue: 'Noida' },
        state: { type: DataTypes.STRING(100), allowNull: false, defaultValue: 'Uttar Pradesh' },
        postal_code: { type: DataTypes.STRING(10), allowNull: true },
        phone: { type: DataTypes.STRING(50), allowNull: true },
        map_url: { type: DataTypes.STRING(1000), allowNull: true },
        map_embed_url: { type: DataTypes.STRING(1000), allowNull: true },
        is_own_clinic: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
        is_active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
        sort_order: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
        ...timestamps(),
      },
      tableOptions,
    );

    await queryInterface.createTable(
      'doctors',
      {
        ...id(),
        name: { type: DataTypes.STRING(150), allowNull: false },
        slug: { type: DataTypes.STRING(191), allowNull: false, unique: true },
        designation: { type: DataTypes.STRING(200), allowNull: false },
        qualifications: { type: DataTypes.STRING(300), allowNull: false },
        highlights: { type: DataTypes.TEXT('long'), allowNull: true },
        specialities: { type: DataTypes.TEXT('long'), allowNull: true },
        bio: { type: DataTypes.TEXT('long'), allowNull: true },
        quote: { type: DataTypes.TEXT, allowNull: true },
        photo_url: { type: DataTypes.STRING(500), allowNull: true },
        slot_minutes: { type: DataTypes.SMALLINT.UNSIGNED, allowNull: false, defaultValue: 15 },
        booking_window_days: { type: DataTypes.SMALLINT.UNSIGNED, allowNull: false, defaultValue: 30 },
        min_notice_minutes: { type: DataTypes.SMALLINT.UNSIGNED, allowNull: false, defaultValue: 60 },
        meta_title: { type: DataTypes.STRING(200), allowNull: true },
        meta_description: { type: DataTypes.STRING(400), allowNull: true },
        is_active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
        sort_order: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
        ...timestamps(),
      },
      tableOptions,
    );

    // weekday: 0 = Sunday ... 6 = Saturday. Several rows per weekday are allowed (morning + evening).
    await queryInterface.createTable(
      'doctor_schedules',
      {
        ...id(),
        doctor_id: ref('doctors', { onDelete: 'CASCADE' }),
        location_id: ref('locations', { onDelete: 'CASCADE' }),
        weekday: { type: DataTypes.TINYINT.UNSIGNED, allowNull: false },
        start_time: { type: DataTypes.TIME, allowNull: false },
        end_time: { type: DataTypes.TIME, allowNull: false },
        is_active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
        ...timestamps(),
      },
      tableOptions,
    );
    await queryInterface.addIndex('doctor_schedules', ['doctor_id', 'location_id', 'weekday'], {
      name: 'idx_schedules_doctor_location_weekday',
    });
    await queryInterface.addIndex('doctor_schedules', ['location_id'], { name: 'idx_schedules_location' });

    // location_id NULL = leave applies at every location. Times NULL = whole day(s).
    await queryInterface.createTable(
      'doctor_leaves',
      {
        ...id(),
        doctor_id: ref('doctors', { onDelete: 'CASCADE' }),
        location_id: ref('locations', { allowNull: true, onDelete: 'CASCADE' }),
        start_date: { type: DataTypes.DATEONLY, allowNull: false },
        end_date: { type: DataTypes.DATEONLY, allowNull: false },
        start_time: { type: DataTypes.TIME, allowNull: true },
        end_time: { type: DataTypes.TIME, allowNull: true },
        reason: { type: DataTypes.STRING(255), allowNull: true },
        ...timestamps(),
      },
      tableOptions,
    );
    await queryInterface.addIndex('doctor_leaves', ['doctor_id', 'start_date', 'end_date'], {
      name: 'idx_leaves_doctor_dates',
    });
  },

  async down(queryInterface) {
    await dropTables(queryInterface, ['doctor_leaves', 'doctor_schedules', 'doctors', 'locations']);
  },
};
