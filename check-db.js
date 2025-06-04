const { Sequelize } = require('sequelize');
require('dotenv').config();

async function checkDatabase() {
  console.log('🔍 Checking database configuration...\n');
  
  const sequelize = new Sequelize({
    dialect: 'postgres',
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT, 10),
    database: process.env.DB_NAME,
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    logging: false
  });

  try {
    console.log('Attempting to connect to database...');
    await sequelize.authenticate();
    console.log('✅ Database connection successful!\n');

    console.log('Checking database tables...');
    const tables = await sequelize.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `, { type: Sequelize.QueryTypes.SELECT });

    if (tables.length === 0) {
      console.log('❌ No tables found in the database');
    } else {
      console.log('\n📋 Existing tables:');
      tables.forEach(table => {
        console.log(`- ${table.table_name}`);
      });
    }

    // Check if required tables exist
    const requiredTables = [
      'societies',
      'flats',
      'users',
      'visitor_passes',
      'notices',
      'emergencies',
      'maintenance_bills',
      'payments'
    ];

    const missingTables = requiredTables.filter(
      table => !tables.find(t => t.table_name === table)
    );

    if (missingTables.length > 0) {
      console.log('\n⚠️ Missing required tables:');
      missingTables.forEach(table => {
        console.log(`- ${table}`);
      });
      console.log('\nYou should run the migrations to create these tables.');
    }

    await sequelize.close();
  } catch (error) {
    console.error('\n❌ Database check failed:', error.message);
    if (error.original) {
      console.error('Original error:', error.original.message);
    }
    process.exit(1);
  }
}

checkDatabase(); 