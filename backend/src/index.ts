import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';

import { apiRouter } from './routes/index.js';
import { errorHandler } from './middleware/errorHandler.middleware.js';
import { logger } from './utils/logger.js';
import { purgeOldAuditLogs } from './utils/audit.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Security Middlewares
app.use(helmet({
  crossOriginResourcePolicy: false,
}));

app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.use(cookieParser());
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Static Uploads
const uploadDir = path.resolve(process.env.UPLOAD_DIR || './uploads');
app.use('/uploads', express.static(uploadDir));

// Swagger Documentation
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Enterprise HRM & Workforce Management Platform API',
      version: '1.0.0',
      description: 'Comprehensive REST API documentation for enterprise HRM web and mobile applications.'
    },
    servers: [
      {
        url: `http://localhost:${PORT}/api/v1`,
        description: 'Development Server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    },
    security: [{ bearerAuth: [] }]
  },
  apis: ['./src/routes/*.ts', './src/controllers/*.ts']
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'HEALTHY',
    service: 'Enterprise HRM & Workforce Management API',
    timestamp: new Date().toISOString()
  });
});

// REST API V1
app.use('/api/v1', apiRouter);

// Central error handler
app.use(errorHandler);

// Start server
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    logger.info(`🚀 Enterprise HRM Server running on port ${PORT}`);
    logger.info(`📚 Swagger OpenAPI Documentation available at http://localhost:${PORT}/api/docs`);

    // Automatic 1-week audit log retention cleanup (7 days)
    purgeOldAuditLogs(undefined, 7).catch(() => {});
    setInterval(() => {
      purgeOldAuditLogs(undefined, 7).catch(() => {});
    }, 24 * 60 * 60 * 1000);
  });
}

export default app;

