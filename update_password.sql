-- Update password for existing safehood user
ALTER USER safehood WITH PASSWORD 'Mih@83022';

-- Connect to the database and ensure permissions
\c safehood_dev;
GRANT ALL ON SCHEMA public TO safehood;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO safehood;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO safehood;

-- Set default privileges for future objects
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO safehood;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO safehood;

-- Verify the user exists and show permissions
\du safehood 