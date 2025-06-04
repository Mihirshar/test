require('dotenv').config();
const { Sequelize } = require('sequelize');

async function testModels() {
  console.log('🔍 Testing database models initialization...\n');
  
  const sequelize = new Sequelize({
    dialect: 'postgres',
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT, 10),
    database: process.env.DB_NAME,
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    logging: console.log
  });

  try {
    console.log('1️⃣ Testing database connection...');
    await sequelize.authenticate();
    console.log('✅ Database connection successful!\n');

    console.log('2️⃣ Importing models...');
    const models = {
      User: require('./src/models/User'),
      VisitorPass: require('./src/models/VisitorPass'),
      Notice: require('./src/models/Notice'),
      Emergency: require('./src/models/Emergency'),
      RefreshToken: require('./src/models/RefreshToken'),
      NoticeReadStatus: require('./src/models/NoticeReadStatus'),
      Society: require('./src/models/Society'),
      Flat: require('./src/models/Flat'),
      MaintenanceBill: require('./src/models/MaintenanceBill'),
      Payment: require('./src/models/Payment')
    };
    console.log('✅ Models imported successfully!\n');

    console.log('3️⃣ Initializing models...');
    Object.values(models).forEach(model => {
      if (typeof model.init === 'function') {
        model.init(sequelize);
        console.log(`✅ Initialized model: ${model.name}`);
      } else {
        console.log(`⚠️ Model ${model.name} doesn't have init method`);
      }
    });

    console.log('\n4️⃣ Setting up model associations...');
    Object.values(models).forEach(model => {
      if (typeof model.associate === 'function') {
        model.associate(models);
        console.log(`✅ Set up associations for: ${model.name}`);
      } else {
        console.log(`⚠️ Model ${model.name} doesn't have associate method`);
      }
    });

    console.log('\n5️⃣ Syncing database...');
    await sequelize.sync({ alter: true });
    console.log('✅ Database synchronized successfully!');

    await sequelize.close();
    console.log('\n✨ All tests completed successfully!');
  } catch (error) {
    console.error('\n❌ Test failed:', error);
    if (error.original) {
      console.error('Original error:', error.original);
    }
    process.exit(1);
  }
}

testModels(); 