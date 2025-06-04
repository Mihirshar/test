import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import { config } from './config/env';
import { initDatabase } from './config/database';
import logger from './utils/logger';
import app from './app';

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Initialize server
const startServer = async () => {
  try {
    logger.info('Starting server initialization...');

    // Initialize database (graceful failure in development)
    try {
      await initDatabase();
    } catch (error) {
      logger.warn('Database initialization failed, continuing without database');
    }
    
    // Start server
    const server = app.listen(config.PORT, config.HOST as string, () => {
      logger.info(`🚀 Server running on http://${config.HOST}:${config.PORT}`);
      logger.info(`📊 Environment: ${config.NODE_ENV}`);
      logger.info('🎯 Safehood Backend API is ready!');
    });
    
    // Handle graceful shutdown
    const shutdown = () => {
      logger.info('Received kill signal, shutting down gracefully');
      server.close(() => {
        logger.info('Closed out remaining connections');
        process.exit(0);
      });

      setTimeout(() => {
        logger.error('Could not close connections in time, forcefully shutting down');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
    
  } catch (error) {
    logger.error('❌ Server initialization failed:', error);
    process.exit(1);
  }
};

// Start the server
startServer(); 