const { Client } = require('pg');
require('dotenv').config();

async function checkTables() {
  const client = new Client({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT, 10),
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD
  });

  try {
    await client.connect();
    console.log('✅ Connected to database\n');

    // Get all tables in the public schema
    const result = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);

    if (result.rows.length === 0) {
      console.log('❌ No tables found in the database');
    } else {
      console.log('📋 Tables in database:');
      result.rows.forEach(row => {
        console.log(`- ${row.table_name}`);
      });
    }

    // Check for required tables
    const requiredTables = [
      'users',
      'societies',
      'flats',
      'visitor_passes',
      'notices',
      'notice_read_status',
      'emergencies',
      'maintenance_bills',
      'payments',
      'refresh_tokens'
    ];

    console.log('\n🔍 Checking required tables:');
    const missingTables = requiredTables.filter(
      table => !result.rows.find(row => row.table_name === table)
    );

    if (missingTables.length > 0) {
      console.log('\n⚠️ Missing tables:');
      missingTables.forEach(table => {
        console.log(`- ${table}`);
      });
    } else {
      console.log('✅ All required tables exist');
    }

    await client.end();
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkTables(); 