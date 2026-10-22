const { RELATION_TYPES } = require('../utils/constants');

module.exports = (sequelize, DataTypes) =>
  sequelize.define(
    'PatientRelation',
    {
      relation: {
        type: DataTypes.STRING(30),
        allowNull: false,
        defaultValue: 'mother_child',
        validate: { isIn: [RELATION_TYPES] },
      },
    },
    { tableName: 'patient_relations' },
  );
