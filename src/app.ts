import express from 'express';
import authRoutes from './modules/auth/auth.routes';
import centresRoutes from './modules/centres/centres.routes';
import bookingsRoutes from './modules/bookings/bookings.routes';
import { errorMiddleware } from './middleware/error.middleware';
import paymentsRoutes from './modules/payments/payments.routes';
import swaggerUi from 'swagger-ui-express';
import { openApiSpec } from './docs/openapi';

export function createApp() {
  const app = express();

  app.use(express.json());

  app.get('/health', (_req, res) => res.json({ status: 'ok' }));
  app.get('/docs.json', (_req, res) => res.json(openApiSpec));
  app.use('/docs', swaggerUi.serve, swaggerUi.setup(openApiSpec));

  app.use('/auth', authRoutes);
  app.use('/centres', centresRoutes);
  app.use('/bookings', bookingsRoutes);
  app.use('/payments', paymentsRoutes);

  app.use((_req, res) => {
    res.status(404).json({ error: 'Route not found' });
  });

  app.use(errorMiddleware);

  return app;
}