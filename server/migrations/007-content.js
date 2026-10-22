const { tableOptions, id, timestamps, ref, dropTables, DataTypes } = require('../utils/migrationHelpers');

module.exports = {
  async up(queryInterface) {
    await queryInterface.createTable(
      'services',
      {
        ...id(),
        name: { type: DataTypes.STRING(150), allowNull: false },
        slug: { type: DataTypes.STRING(191), allowNull: false, unique: true },
        short_description: { type: DataTypes.STRING(500), allowNull: true },
        description: { type: DataTypes.TEXT('long'), allowNull: true },
        icon: { type: DataTypes.STRING(50), allowNull: true },
        image_url: { type: DataTypes.STRING(500), allowNull: true },
        meta_title: { type: DataTypes.STRING(200), allowNull: true },
        meta_description: { type: DataTypes.STRING(400), allowNull: true },
        is_active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
        sort_order: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
        ...timestamps(),
      },
      tableOptions,
    );

    await queryInterface.createTable(
      'specialties',
      {
        ...id(),
        title: { type: DataTypes.STRING(150), allowNull: false },
        description: { type: DataTypes.TEXT, allowNull: true },
        icon: { type: DataTypes.STRING(50), allowNull: true },
        is_active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
        sort_order: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
        ...timestamps(),
      },
      tableOptions,
    );

    await queryInterface.createTable(
      'testimonials',
      {
        ...id(),
        name: { type: DataTypes.STRING(150), allowNull: false },
        label: { type: DataTypes.STRING(150), allowNull: true },
        content: { type: DataTypes.TEXT, allowNull: false },
        rating: { type: DataTypes.TINYINT.UNSIGNED, allowNull: true },
        // pending | approved | rejected
        status: { type: DataTypes.STRING(20), allowNull: false, defaultValue: 'pending' },
        // website | admin
        source: { type: DataTypes.STRING(20), allowNull: false, defaultValue: 'website' },
        consent_at: { type: DataTypes.DATE, allowNull: true },
        sort_order: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
        ...timestamps(),
      },
      tableOptions,
    );
    await queryInterface.addIndex('testimonials', ['status', 'sort_order'], { name: 'idx_testimonials_status' });

    await queryInterface.createTable(
      'gallery_categories',
      {
        ...id(),
        name: { type: DataTypes.STRING(150), allowNull: false },
        slug: { type: DataTypes.STRING(191), allowNull: false, unique: true },
        sort_order: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
        ...timestamps(),
      },
      tableOptions,
    );

    await queryInterface.createTable(
      'gallery_images',
      {
        ...id(),
        category_id: ref('gallery_categories', { allowNull: true }),
        title: { type: DataTypes.STRING(200), allowNull: true },
        alt_text: { type: DataTypes.STRING(300), allowNull: false },
        image_url: { type: DataTypes.STRING(500), allowNull: false },
        is_active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
        sort_order: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
        ...timestamps(),
      },
      tableOptions,
    );
    await queryInterface.addIndex('gallery_images', ['category_id', 'sort_order'], { name: 'idx_gallery_category' });

    await queryInterface.createTable(
      'blog_categories',
      {
        ...id(),
        name: { type: DataTypes.STRING(150), allowNull: false },
        slug: { type: DataTypes.STRING(191), allowNull: false, unique: true },
        ...timestamps(),
      },
      tableOptions,
    );

    await queryInterface.createTable(
      'blog_posts',
      {
        ...id(),
        title: { type: DataTypes.STRING(250), allowNull: false },
        slug: { type: DataTypes.STRING(191), allowNull: false, unique: true },
        excerpt: { type: DataTypes.STRING(600), allowNull: true },
        content: { type: DataTypes.TEXT('long'), allowNull: false },
        cover_image_url: { type: DataTypes.STRING(500), allowNull: true },
        category_id: ref('blog_categories', { allowNull: true }),
        author_name: { type: DataTypes.STRING(150), allowNull: true },
        // draft | published
        status: { type: DataTypes.STRING(20), allowNull: false, defaultValue: 'draft' },
        published_at: { type: DataTypes.DATE, allowNull: true },
        meta_title: { type: DataTypes.STRING(200), allowNull: true },
        meta_description: { type: DataTypes.STRING(400), allowNull: true },
        created_by: ref('users', { allowNull: true }),
        ...timestamps(),
      },
      tableOptions,
    );
    await queryInterface.addIndex('blog_posts', ['status', 'published_at'], { name: 'idx_posts_status_published' });
    await queryInterface.addIndex('blog_posts', ['category_id'], { name: 'idx_posts_category' });

    await queryInterface.createTable(
      'settings',
      {
        ...id(),
        setting_key: { type: DataTypes.STRING(100), allowNull: false, unique: true },
        // JSON-encoded text (see utils/jsonColumn.js)
        setting_value: { type: DataTypes.TEXT('long'), allowNull: true },
        updated_by: ref('users', { allowNull: true }),
        ...timestamps(),
      },
      tableOptions,
    );
  },

  async down(queryInterface) {
    await dropTables(queryInterface, [
      'settings',
      'blog_posts',
      'blog_categories',
      'gallery_images',
      'gallery_categories',
      'testimonials',
      'specialties',
      'services',
    ]);
  },
};
