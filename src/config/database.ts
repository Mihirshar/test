import { Sequelize, Options } from 'sequelize';
import { config } from './env';
import logger from '../utils/logger';

// Import models
import User from '../models/User';
import VisitorPass from '../models/VisitorPass';
import Notice from '../models/Notice';
import Emergency from '../models/Emergency';
import RefreshToken from '../models/RefreshToken';
import NoticeReadStatus from '../models/NoticeReadStatus';
import Society from '../models/Society';
import Flat from '../models/Flat';
import MaintenanceBill from '../models/MaintenanceBill';
import Payment from '../models/Payment';

// Log database configuration (without password)
logger.info('Database Config:', {
  host: config.DB_HOST,
  port: config.DB_PORT,
  database: config.DB_NAME,
  username: config.DB_USER,
  dialect: 'postgres',
  ssl: config.DB_SSL
});

// Create Sequelize instance with explicit configuration
const sequelizeConfig: Options = {
  dialect: 'postgres',
  host: config.DB_HOST,
  port: parseInt(config.DB_PORT, 10),
  database: config.DB_NAME,
  username: config.DB_USER,
  password: config.DB_PASSWORD,
  logging: (msg: string) => logger.debug(msg),
  define: {
    timestamps: true,
    underscored: true,
  },
  dialectOptions: config.DB_SSL ? {
    ssl: {
      require: true,
      rejectUnauthorized: false
    }
  } : {},
  pool: {
    max: 10,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
};

const sequelize = new Sequelize(sequelizeConfig);

// Add models to Sequelize instance
[
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
].forEach(model => {
  try {
    model.initialize({}, { sequelize });
  } catch (error) {
    logger.error(`Failed to initialize model ${model.name}:`, error);
  }
});

// Initialize database connection
export const initDatabase = async (): Promise<void> => {
  try {
    logger.info('Starting database initialization...');
    
    // Test the connection
    logger.info('Testing database connection...');
    try {
      await sequelize.authenticate();
      logger.info('✅ Database connection established successfully');
    } catch (error) {
      logger.error('Failed to authenticate database connection:', {
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined,
        config: {
          host: config.DB_HOST,
          port: config.DB_PORT,
          database: config.DB_NAME,
          username: config.DB_USER
        }
      });
      throw error;
    }
    
    // In development, sync the database
    if (config.NODE_ENV === 'development') {
      logger.info('Syncing database models...');
      try {
        // First try with alter: true
        await sequelize.sync({ alter: true });
        logger.info('✅ Database synchronized successfully');
      } catch (error) {
        const syncError = error as Error;
        logger.error('Database sync error (alter mode):', {
          message: syncError.message,
          stack: syncError.stack,
          code: (error as any).code,
          original: (error as any).original
        });
        
        // If alter fails, try with force: true
        logger.info('Attempting force sync...');
        try {
          await sequelize.sync({ force: true });
          logger.info('✅ Database force synchronized successfully');
        } catch (error) {
          const forceError = error as Error;
          logger.error('Database force sync error:', {
            message: forceError.message,
            stack: forceError.stack,
            code: (error as any).code,
            original: (error as any).original
          });
          throw forceError;
        }
      }
    }
  } catch (error) {
    const dbError = error as Error;
    logger.error('Database initialization error:', {
      message: dbError.message,
      stack: dbError.stack,
      code: (error as any).code,
      original: (error as any).original,
      config: {
        host: config.DB_HOST,
        port: config.DB_PORT,
        database: config.DB_NAME,
        username: config.DB_USER,
        ssl: config.DB_SSL
      }
    });
    
    if (config.NODE_ENV === 'development') {
      logger.warn('⚠️ Database initialization failed in development mode');
      return; // Don't throw error in development
    }
    throw error;
  }
};

export { sequelize };
export default sequelize; 