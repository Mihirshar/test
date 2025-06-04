import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import { config } from './config/env';
import routes from './routes';
import { stream } from './utils/logger';
import { generalLimiter } from './middleware/rateLimiter';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';

// Create Express app
const app = express();

// Trust proxy
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false, // Disable for API
}));

// CORS
app.use(cors({
  origin: config.CORS_ORIGIN,
  credentials: true,
  optionsSuccessStatus: 200,
}));

// Compression
app.use(compression());

// Logging
app.use(morgan('combined', { stream }));

// Body parsing
app.use(express.json({ limit: config.MAX_FILE_SIZE }));
app.use(express.urlencoded({ extended: true, limit: config.MAX_FILE_SIZE }));

// Rate limiting
app.use(generalLimiter);

// Static files (if needed)
app.use('/uploads', express.static('uploads'));
app.use(express.static('frontend')); // Serve frontend files

// API routes
app.use(config.API_BASE_URL, routes);

// Error handlers
app.use(notFoundHandler);
app.use(errorHandler);

export default app; 