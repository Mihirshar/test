'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.bulkInsert('Societies', [
      {
        name: 'Green Valley Residency',
        address: '123 Green Valley Road, Mumbai',
        totalFlats: 100,
        amenities: JSON.stringify(['Swimming Pool', 'Gym', 'Community Hall']),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Sunshine Heights',
        address: '456 Sunshine Avenue, Mumbai',
        totalFlats: 75,
        amenities: JSON.stringify(['Garden', 'Children\'s Play Area', 'Security']),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Royal Palm Towers',
        address: '789 Palm Street, Mumbai',
        totalFlats: 150,
        amenities: JSON.stringify(['Tennis Court', 'Clubhouse', '24/7 Security', 'Parking']),
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ], {});

    // Add some test flats for each society
    const societies = await queryInterface.sequelize.query(
      'SELECT id from "Societies";'
    );
    const societyRows = societies[0];

    for (const society of societyRows) {
      const flats = [];
      // Add 5 test flats for each society
      for (let i = 1; i <= 5; i++) {
        flats.push({
          societyId: society.id,
          flatNumber: `${i}0${i}`,
          floor: i,
          block: 'A',
          type: i % 2 === 0 ? '2BHK' : '3BHK',
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }
      await queryInterface.bulkInsert('Flats', flats, {});
    }
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('Flats', null, {});
    await queryInterface.bulkDelete('Societies', null, {});
  }
}; 