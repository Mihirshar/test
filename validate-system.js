const axios = require('axios');
const { Sequelize } = require('sequelize');
const Redis = require('ioredis');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function validateSystem() {
    const results = {
        server: { status: 'pending', details: [] },
        database: { status: 'pending', details: [] },
        redis: { status: 'pending', details: [] },
        api: { status: 'pending', details: [] },
        files: { status: 'pending', details: [] }
    };

    console.log('🚀 Starting System Validation...\n');

    // 1. Server Health Check
    try {
        console.log('📡 Checking Server Health...');
        const response = await axios.get('http://localhost:3000/api/v1/health');
        if (response.data.status === 'ok') {
            results.server.status = 'passed';
            results.server.details.push('✅ Server is running');
        }
    } catch (error) {
        results.server.status = 'failed';
        results.server.details.push(`❌ Server check failed: ${error.message}`);
    }

    // 2. Database Connection
    try {
        console.log('\n🗄️ Checking Database Connection...');
        const sequelize = new Sequelize({
            dialect: process.env.NODE_ENV === 'development' ? 'sqlite' : 'postgres',
            storage: process.env.NODE_ENV === 'development' ? './database.sqlite' : undefined,
            host: process.env.DB_HOST,
            port: process.env.DB_PORT,
            database: process.env.DB_NAME,
            username: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            logging: false
        });

        await sequelize.authenticate();
        results.database.status = 'passed';
        results.database.details.push('✅ Database connection successful');
    } catch (error) {
        results.database.status = 'failed';
        results.database.details.push(`❌ Database check failed: ${error.message}`);
    }

    // 3. Redis Connection
    try {
        console.log('\n📦 Checking Redis Connection...');
        const redis = new Redis({
            host: process.env.REDIS_HOST,
            port: process.env.REDIS_PORT,
            password: process.env.REDIS_PASSWORD
        });

        await redis.ping();
        results.redis.status = 'passed';
        results.redis.details.push('✅ Redis connection successful');
        redis.disconnect();
    } catch (error) {
        results.redis.status = 'failed';
        results.redis.details.push(`❌ Redis check failed: ${error.message}`);
    }

    // 4. API Endpoints
    try {
        console.log('\n🔌 Checking API Endpoints...');
        const endpoints = [
            '/api/v1/auth/status',
            '/api/v1/users',
            '/api/v1/visitors',
            '/api/v1/notices',
            '/api/v1/emergencies'
        ];

        for (const endpoint of endpoints) {
            try {
                await axios.get(`http://localhost:3000${endpoint}`);
                results.api.details.push(`✅ Endpoint ${endpoint} accessible`);
            } catch (error) {
                if (error.response && error.response.status === 401) {
                    results.api.details.push(`✅ Endpoint ${endpoint} secured (401 expected)`);
                } else {
                    results.api.details.push(`❌ Endpoint ${endpoint} error: ${error.message}`);
                }
            }
        }
        results.api.status = 'passed';
    } catch (error) {
        results.api.status = 'failed';
        results.api.details.push(`❌ API check failed: ${error.message}`);
    }

    // 5. File System Checks
    try {
        console.log('\n📁 Checking File System...');
        const requiredDirs = ['uploads', 'logs', 'nginx/ssl', 'nginx/logs'];
        const requiredFiles = [
            '.env.production',
            'docker-compose.yml',
            'Dockerfile',
            'nginx/conf.d/default.conf'
        ];

        for (const dir of requiredDirs) {
            if (fs.existsSync(dir)) {
                results.files.details.push(`✅ Directory ${dir} exists`);
            } else {
                results.files.details.push(`❌ Directory ${dir} missing`);
            }
        }

        for (const file of requiredFiles) {
            if (fs.existsSync(file)) {
                results.files.details.push(`✅ File ${file} exists`);
            } else {
                results.files.details.push(`❌ File ${file} missing`);
            }
        }
        results.files.status = 'passed';
    } catch (error) {
        results.files.status = 'failed';
        results.files.details.push(`❌ File system check failed: ${error.message}`);
    }

    // Generate Report
    console.log('\n📊 Validation Results:\n');
    for (const [system, result] of Object.entries(results)) {
        console.log(`${system.toUpperCase()} Status: ${result.status.toUpperCase()}`);
        result.details.forEach(detail => console.log(detail));
        console.log('');
    }

    // Save results to file
    const report = {
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV,
        results
    };

    fs.writeFileSync(
        'validation-results.json',
        JSON.stringify(report, null, 2)
    );

    console.log('📝 Detailed results saved to validation-results.json');
}

validateSystem().catch(console.error); 