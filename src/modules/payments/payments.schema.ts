import { z } from 'zod';

export const createPaymentSchema = z.object({
  bookingId: z.string().uuid('bookingId must be a valid UUID'),
});

export const webhookSchema = z.object({
  eventId: z.string().min(1, 'eventId is required'),
  paymentId: z.string().uuid('paymentId must be a valid UUID'),
  status: z.enum(['SUCCESS', 'FAILED']),
});

export type CreatePaymentInput = z.infer<typeof createPaymentSchema>;
export type WebhookInput = z.infer<typeof webhookSchema>;