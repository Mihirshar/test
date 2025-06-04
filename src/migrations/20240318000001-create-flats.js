'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('Flats', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      societyId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Societies',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      flatNumber: {
        type: Sequelize.STRING,
        allowNull: false
      },
      floor: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      block: {
        type: Sequelize.STRING,
        allowNull: false
      },
      type: {
        type: Sequelize.STRING,
        allowNull: false
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });

    // Add unique constraint for society_id and flat_number
    await queryInterface.addConstraint('Flats', {
      fields: ['societyId', 'flatNumber'],
      type: 'unique',
      name: 'unique_flat_number_per_society'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('Flats');
  }
}; 