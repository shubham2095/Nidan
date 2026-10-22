const { tableOptions, id, timestamps, createdAtOnly, ref, dropTables, DataTypes } = require('../utils/migrationHelpers');

module.exports = {
  async up(queryInterface) {
    await queryInterface.createTable(
      'users',
      {
        ...id(),
        name: { type: DataTypes.STRING(150), allowNull: false },
        email: { type: DataTypes.STRING(191), allowNull: false, unique: true },
        password_hash: { type: DataTypes.STRING(255), allowNull: false },
        // super_admin | doctor | receptionist (validated in the model)
        role: { type: DataTypes.STRING(30), allowNull: false },
        doctor_id: ref('doctors', { allowNull: true }),
        is_active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
        last_login_at: { type: DataTypes.DATE, allowNull: true },
        password_changed_at: { type: DataTypes.DATE, allowNull: true },
        reset_token_hash: { type: DataTypes.STRING(64), allowNull: true },
        reset_token_expires_at: { type: DataTypes.DATE, allowNull: true },
        ...timestamps(),
      },
      tableOptions,
    );
    await queryInterface.addIndex('users', ['reset_token_hash'], { name: 'idx_users_reset_token' });

    await queryInterface.createTable(
      'activity_logs',
      {
        ...id(),
        user_id: ref('users', { allowNull: true }),
        user_name: { type: DataTypes.STRING(150), allowNull: true },
        entity_type: { type: DataTypes.STRING(50), allowNull: false },
        entity_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
        action: { type: DataTypes.STRING(50), allowNull: false },
        summary: { type: DataTypes.STRING(500), allowNull: true },
        changes: { type: DataTypes.TEXT('long'), allowNull: true },
        ip_address: { type: DataTypes.STRING(45), allowNull: true },
        ...createdAtOnly(),
      },
      tableOptions,
    );
    await queryInterface.addIndex('activity_logs', ['entity_type', 'entity_id'], { name: 'idx_activity_entity' });
    await queryInterface.addIndex('activity_logs', ['user_id'], { name: 'idx_activity_user' });
    await queryInterface.addIndex('activity_logs', ['created_at'], { name: 'idx_activity_created' });
  },

  async down(queryInterface) {
    await dropTables(queryInterface, ['activity_logs', 'users']);
  },
};
