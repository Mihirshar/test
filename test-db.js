const { Client } = require('pg');

async function testDatabaseConnection() {
  const client = new Client({
    host: 'localhost',
    port: 5432,
    database: 'safehood_dev',
    user: 'safehood',
    password: 'Mih@83022',
  });

  try {
    await client.connect();
    console.log('✅ Database connection successful!');
    
    const result = await client.query('SELECT version()');
    console.log('📊 PostgreSQL version:', result.rows[0].version);
    
    await client.end();
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    
    if (error.code === '28P01') {
      console.log('🔑 Authentication failed. Please run the setup_database.sql script first.');
    } else if (error.code === '3D000') {
      console.log('🗃️  Database does not exist. Please run the setup_database.sql script first.');
    }
    
    return false;
  }
}

testDatabaseConnection(); 