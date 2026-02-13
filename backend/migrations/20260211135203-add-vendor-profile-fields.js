'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('Users', 'companyName', {
      type: Sequelize.STRING,
      allowNull: true,
    });

    await queryInterface.addColumn('Users', 'contactName', {
      type: Sequelize.STRING,
      allowNull: true,
    });

    await queryInterface.addColumn('Users', 'phone', {
      type: Sequelize.STRING,
      allowNull: true,
    });

    await queryInterface.addColumn('Users', 'certifications', {
      type: Sequelize.JSON,
      defaultValue: [],
    });

    await queryInterface.addColumn('Users', 'categories', {
      type: Sequelize.JSON,
      defaultValue: [],
    });

    await queryInterface.addColumn('Users', 'rating', {
      type: Sequelize.DECIMAL(3, 2),
      defaultValue: 4.8,
    });

    await queryInterface.addColumn('Users', 'ordersCount', {
      type: Sequelize.INTEGER,
      defaultValue: 0,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('Users', 'ordersCount');
    await queryInterface.removeColumn('Users', 'rating');
    await queryInterface.removeColumn('Users', 'categories');
    await queryInterface.removeColumn('Users', 'certifications');
    await queryInterface.removeColumn('Users', 'phone');
    await queryInterface.removeColumn('Users', 'contactName');
    await queryInterface.removeColumn('Users', 'companyName');
  }
};
