const { Client } = require('pg');

async function testConnection() {
  const client = new Client({
    host: 'localhost',
    port: 5432,
    database: 'safehood_dev',
    user: 'postgres',
    password: 'Mih@83022'
  });

  try {
    console.log('Attempting to connect to PostgreSQL...');
    await client.connect();
    console.log('✅ Successfully connected to PostgreSQL!');

    const result = await client.query('SELECT version()');
    console.log('PostgreSQL version:', result.rows[0].version);

    await client.end();
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    if (error.code === '3D000') {
      console.log('Database "safehood_dev" does not exist. Creating it...');
      
      // Connect to default database to create new one
      const adminClient = new Client({
        host: 'localhost',
        port: 5432,
        database: 'postgres',
        user: 'postgres',
        password: 'Mih@83022'
      });

      try {
        await adminClient.connect();
        await adminClient.query('CREATE DATABASE safehood_dev');
        console.log('✅ Database "safehood_dev" created successfully!');
        await adminClient.end();
        return true;
      } catch (createError) {
        console.error('❌ Failed to create database:', createError.message);
        return false;
      }
    }
    return false;
  }
}

testConnection().then(success => {
  if (!success) {
    console.log('Please check your PostgreSQL installation and credentials.');
  }
  process.exit(success ? 0 : 1);
}); 