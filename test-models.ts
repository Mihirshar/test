import { Sequelize } from 'sequelize-typescript';
import dotenv from 'dotenv';
import User from './src/models/User';
import VisitorPass from './src/models/VisitorPass';
import Notice from './src/models/Notice';
import Emergency from './src/models/Emergency';
import RefreshToken from './src/models/RefreshToken';
import NoticeReadStatus from './src/models/NoticeReadStatus';
import Society from './src/models/Society';
import Flat from './src/models/Flat';
import MaintenanceBill from './src/models/MaintenanceBill';
import Payment from './src/models/Payment';

dotenv.config();

async function testModels() {
  console.log('🔍 Testing database models initialization...\n');
  
  const sequelize = new Sequelize({
    dialect: 'postgres',
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '5432', 10),
    database: process.env.DB_NAME,
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    logging: console.log,
    models: [
      User,
      VisitorPass,
      Notice,
      Emergency,
      RefreshToken,
      NoticeReadStatus,
      Society,
      Flat,
      MaintenanceBill,
      Payment
    ]
  });

  try {
    console.log('1️⃣ Testing database connection...');
    await sequelize.authenticate();
    console.log('✅ Database connection successful!\n');

    console.log('2️⃣ Recreating database tables...');
    await sequelize.sync({ force: true });
    console.log('✅ Database tables recreated successfully!');

    await sequelize.close();
    console.log('\n✨ All tests completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Test failed:', error);
    if (error instanceof Error) {
      console.error('Error details:', {
        message: error.message,
        stack: error.stack
      });
    }
    process.exit(1);
  }
}

testModels(); 