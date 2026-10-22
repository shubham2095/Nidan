const { TESTIMONIAL_STATUSES } = require('../utils/constants');

module.exports = (sequelize, DataTypes) =>
  sequelize.define(
    'Testimonial',
    {
      name: { type: DataTypes.STRING(150), allowNull: false },
      label: DataTypes.STRING(150),
      content: { type: DataTypes.TEXT, allowNull: false },
      rating: { type: DataTypes.TINYINT.UNSIGNED, validate: { min: 1, max: 5 } },
      status: {
        type: DataTypes.STRING(20),
        allowNull: false,
        defaultValue: 'pending',
        validate: { isIn: [TESTIMONIAL_STATUSES] },
      },
      source: { type: DataTypes.STRING(20), allowNull: false, defaultValue: 'website' },
      consentAt: DataTypes.DATE,
      sortOrder: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    },
    { tableName: 'testimonials' },
  );
