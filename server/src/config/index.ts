import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

export const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '5000', 10),
  jwtSecret: process.env.JWT_SECRET || 'flowpilot-super-secure-jwt-secret-key-change-in-production-2026',
  cookieSecret: process.env.COOKIE_SECRET || 'flowpilot-cookie-secret-random-hex-string-2026',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  aiProvider: process.env.AI_PROVIDER || 'gemini',
  geminiApiKey: process.env.GEMINI_API_KEY || '',
  aiModel: process.env.AI_MODEL || 'gemini-2.5-flash',
  enableDemoMode: process.env.ENABLE_DEMO_MODE !== 'false',
  logLevel: process.env.LOG_LEVEL || 'info',
};

