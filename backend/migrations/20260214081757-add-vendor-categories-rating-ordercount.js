'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Categories and Rating already exist
    /*
    await queryInterface.addColumn('Users', 'categories', {
      type: Sequelize.JSON,
      allowNull: true,
      comment: 'Equipment categories vendor specializes in'
    });
    
    await queryInterface.addColumn('Users', 'rating', {
      type: Sequelize.DECIMAL(3, 2),
      defaultValue: 0.00,
      allowNull: true,
      comment: 'Average client rating (1-5)'
    });
    */
    
    await queryInterface.addColumn('Users', 'orderCount', {
      type: Sequelize.INTEGER,
      defaultValue: 0,
      allowNull: true,
      comment: 'Total completed orders'
    });
  },
  
  async down(queryInterface, Sequelize) {
    // await queryInterface.removeColumn('Users', 'categories');
    // await queryInterface.removeColumn('Users', 'rating');
    await queryInterface.removeColumn('Users', 'orderCount');
  }
};
