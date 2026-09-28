import express from 'express';
import authRoutes from './modules/auth/auth.routes';
import centresRoutes from './modules/centres/centres.routes';
import bookingsRoutes from './modules/bookings/bookings.routes';
import { errorMiddleware } from './middleware/error.middleware';

export function createApp() {
  const app = express();

  app.use(express.json());

  app.get('/health', (_req, res) => res.json({ status: 'ok' }));

  app.use('/auth', authRoutes);
  app.use('/centres', centresRoutes);
  app.use('/bookings', bookingsRoutes);

  app.use(errorMiddleware);

  return app;
}