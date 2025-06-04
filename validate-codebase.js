const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const { Sequelize } = require('sequelize');
require('dotenv').config();

async function validateCodebase() {
  const results = {
    typescript: { status: 'pending', details: [] },
    dependencies: { status: 'pending', details: [] },
    database: { status: 'pending', details: [] },
    routes: { status: 'pending', details: [] },
    controllers: { status: 'pending', details: [] },
    models: { status: 'pending', details: [] },
    security: { status: 'pending', details: [] }
  };

  console.log('🔍 Starting Codebase Validation\n');

  // 1. TypeScript Validation
  try {
    console.log('Checking TypeScript compilation...');
    execSync('npx tsc --noEmit', { stdio: 'inherit' });
    results.typescript.status = 'passed';
    results.typescript.details.push('✅ TypeScript compilation successful');
  } catch (error) {
    results.typescript.status = 'failed';
    results.typescript.details.push('❌ TypeScript compilation failed');
  }

  // 2. Dependencies Check
  try {
    console.log('\nChecking dependencies...');
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    const requiredDeps = [
      'express',
      'sequelize',
      'sequelize-typescript',
      'pg',
      'ioredis',
      'jsonwebtoken',
      'bcryptjs'
    ];

    const missingDeps = requiredDeps.filter(dep => !packageJson.dependencies[dep]);
    
    if (missingDeps.length === 0) {
      results.dependencies.status = 'passed';
      results.dependencies.details.push('✅ All required dependencies present');
    } else {
      results.dependencies.status = 'failed';
      results.dependencies.details.push(`❌ Missing dependencies: ${missingDeps.join(', ')}`);
    }
  } catch (error) {
    results.dependencies.status = 'failed';
    results.dependencies.details.push(`❌ Error checking dependencies: ${error.message}`);
  }

  // 3. Database Connection
  try {
    console.log('\nChecking database connection...');
    const sequelize = new Sequelize({
      dialect: 'postgres',
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT, 10),
      database: process.env.DB_NAME,
      username: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      logging: false
    });

    await sequelize.authenticate();
    results.database.status = 'passed';
    results.database.details.push('✅ Database connection successful');

    // Check tables
    const tables = await sequelize.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `, { type: Sequelize.QueryTypes.SELECT });

    const requiredTables = [
      'users',
      'societies',
      'flats',
      'visitor_passes',
      'notices',
      'notice_read_statuses',
      'emergencies',
      'maintenance_bills',
      'payments',
      'refresh_tokens'
    ];

    const missingTables = requiredTables.filter(
      table => !tables.find(t => t.table_name === table)
    );

    if (missingTables.length === 0) {
      results.database.details.push('✅ All required tables present');
    } else {
      results.database.details.push(`⚠️ Missing tables: ${missingTables.join(', ')}`);
    }

    await sequelize.close();
  } catch (error) {
    results.database.status = 'failed';
    results.database.details.push(`❌ Database check failed: ${error.message}`);
  }

  // 4. Routes Check
  try {
    console.log('\nChecking routes...');
    const routesDir = path.join(__dirname, 'src', 'routes');
    const routeFiles = fs.readdirSync(routesDir);
    
    const requiredRoutes = [
      'auth.ts',
      'user.ts',
      'notice.ts',
      'visitor.ts',
      'emergency.ts',
      'billing.ts'
    ];

    const missingRoutes = requiredRoutes.filter(
      route => !routeFiles.includes(route)
    );

    if (missingRoutes.length === 0) {
      results.routes.status = 'passed';
      results.routes.details.push('✅ All required routes present');
    } else {
      results.routes.status = 'failed';
      results.routes.details.push(`❌ Missing routes: ${missingRoutes.join(', ')}`);
    }
  } catch (error) {
    results.routes.status = 'failed';
    results.routes.details.push(`❌ Error checking routes: ${error.message}`);
  }

  // 5. Controllers Check
  try {
    console.log('\nChecking controllers...');
    const controllersDir = path.join(__dirname, 'src', 'controllers');
    const controllerFiles = fs.readdirSync(controllersDir);
    
    const requiredControllers = [
      'AuthController.ts',
      'UserController.ts',
      'NoticeController.ts',
      'VisitorController.ts',
      'EmergencyController.ts',
      'BillingController.ts'
    ];

    const missingControllers = requiredControllers.filter(
      controller => !controllerFiles.includes(controller)
    );

    if (missingControllers.length === 0) {
      results.controllers.status = 'passed';
      results.controllers.details.push('✅ All required controllers present');
    } else {
      results.controllers.status = 'failed';
      results.controllers.details.push(`❌ Missing controllers: ${missingControllers.join(', ')}`);
    }
  } catch (error) {
    results.controllers.status = 'failed';
    results.controllers.details.push(`❌ Error checking controllers: ${error.message}`);
  }

  // 6. Models Check
  try {
    console.log('\nChecking models...');
    const modelsDir = path.join(__dirname, 'src', 'models');
    const modelFiles = fs.readdirSync(modelsDir);
    
    const requiredModels = [
      'User.ts',
      'Society.ts',
      'Flat.ts',
      'VisitorPass.ts',
      'Notice.ts',
      'NoticeReadStatus.ts',
      'Emergency.ts',
      'MaintenanceBill.ts',
      'Payment.ts',
      'RefreshToken.ts'
    ];

    const missingModels = requiredModels.filter(
      model => !modelFiles.includes(model)
    );

    if (missingModels.length === 0) {
      results.models.status = 'passed';
      results.models.details.push('✅ All required models present');
    } else {
      results.models.status = 'failed';
      results.models.details.push(`❌ Missing models: ${missingModels.join(', ')}`);
    }
  } catch (error) {
    results.models.status = 'failed';
    results.models.details.push(`❌ Error checking models: ${error.message}`);
  }

  // 7. Security Check
  try {
    console.log('\nChecking security configuration...');
    const checks = [];

    // Check .env file
    if (fs.existsSync('.env')) {
      const envContent = fs.readFileSync('.env', 'utf8');
      checks.push('✅ .env file exists');

      // Check required environment variables
      const requiredEnvVars = [
        'JWT_SECRET',
        'JWT_EXPIRES_IN',
        'DB_PASSWORD',
        'REDIS_PASSWORD'
      ];

      const missingEnvVars = requiredEnvVars.filter(
        variable => !envContent.includes(variable)
      );

      if (missingEnvVars.length === 0) {
        checks.push('✅ All required environment variables present');
      } else {
        checks.push(`⚠️ Missing environment variables: ${missingEnvVars.join(', ')}`);
      }
    } else {
      checks.push('❌ .env file missing');
    }

    // Check auth middleware
    const authMiddlewarePath = path.join(__dirname, 'src', 'middleware', 'auth.ts');
    if (fs.existsSync(authMiddlewarePath)) {
      checks.push('✅ Authentication middleware present');
    } else {
      checks.push('❌ Authentication middleware missing');
    }

    // Check rate limiting
    const rateLimiterPath = path.join(__dirname, 'src', 'middleware', 'rateLimiter.ts');
    if (fs.existsSync(rateLimiterPath)) {
      checks.push('✅ Rate limiting middleware present');
    } else {
      checks.push('❌ Rate limiting middleware missing');
    }

    results.security.status = checks.every(check => check.includes('✅')) ? 'passed' : 'warning';
    results.security.details = checks;
  } catch (error) {
    results.security.status = 'failed';
    results.security.details.push(`❌ Error checking security: ${error.message}`);
  }

  // Generate Report
  console.log('\n📋 Validation Report');
  console.log('==================');

  Object.entries(results).forEach(([category, result]) => {
    console.log(`\n${category.toUpperCase()}`);
    console.log('-'.repeat(category.length));
    console.log(`Status: ${result.status.toUpperCase()}`);
    result.details.forEach(detail => console.log(detail));
  });

  // Save results to file
  const report = {
    timestamp: new Date().toISOString(),
    results
  };

  fs.writeFileSync('validation-results.json', JSON.stringify(report, null, 2));
  console.log('\n✨ Validation complete! Results saved to validation-results.json');
}

validateCodebase().catch(error => {
  console.error('Validation failed:', error);
  process.exit(1);
}); 