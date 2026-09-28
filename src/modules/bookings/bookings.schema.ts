import { z } from 'zod';

export const createBookingSchema = z.object({
  testId: z.string().uuid('testId must be a valid UUID'),
  centreId: z.string().uuid('centreId must be a valid UUID'),
  appointmentAt: z.coerce
    .date()
    .refine((date) => date.getTime() > Date.now(), {
      message: 'appointmentAt must be a future date/time',
    }),
});

export type CreateBookingInput = z.infer<typeof createBookingSchema>;