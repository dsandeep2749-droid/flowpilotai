import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { apiRouter } from './routes/api.js';
import { errorHandler } from './middleware/errorHandler.js';
import { config } from './config/index.js';

export const app = express();

// Middlewares
app.use(
  cors({
    origin: config.frontendUrl || 'http://localhost:5173',
    credentials: true,
  })
);
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));
app.use(cookieParser(config.cookieSecret));

// Request logging in development
if (config.env === 'development') {
  app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
      const duration = Date.now() - start;
      console.log(`[HTTP] ${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms`);
    });
    next();
  });
}

// API Routes
app.use('/api', apiRouter);

// Central Error Handler
app.use(errorHandler);

