-- Create database
CREATE DATABASE safehood_dev;

-- Create user
CREATE USER safehood WITH PASSWORD 'Mih@83022';

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE safehood_dev TO safehood;

-- Connect to the database and grant schema privileges
\c safehood_dev;
GRANT ALL ON SCHEMA public TO safehood;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO safehood;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO safehood;

-- Set default privileges for future objects
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO safehood;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO safehood;

-- Show databases to confirm
\l 