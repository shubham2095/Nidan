const jsonColumn = require('../utils/jsonColumn');

module.exports = (sequelize, DataTypes) =>
  sequelize.define(
    'Doctor',
    {
      name: { type: DataTypes.STRING(150), allowNull: false },
      slug: { type: DataTypes.STRING(191), allowNull: false, unique: true },
      designation: { type: DataTypes.STRING(200), allowNull: false },
      qualifications: { type: DataTypes.STRING(300), allowNull: false },
      highlights: jsonColumn(DataTypes, 'highlights', []),
      specialities: jsonColumn(DataTypes, 'specialities', []),
      bio: DataTypes.TEXT('long'),
      quote: DataTypes.TEXT,
      photoUrl: DataTypes.STRING(500),
      slotMinutes: { type: DataTypes.SMALLINT.UNSIGNED, allowNull: false, defaultValue: 15 },
      bookingWindowDays: { type: DataTypes.SMALLINT.UNSIGNED, allowNull: false, defaultValue: 30 },
      minNoticeMinutes: { type: DataTypes.SMALLINT.UNSIGNED, allowNull: false, defaultValue: 60 },
      metaTitle: DataTypes.STRING(200),
      metaDescription: DataTypes.STRING(400),
      isActive: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
      sortOrder: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    },
    { tableName: 'doctors' },
  );
