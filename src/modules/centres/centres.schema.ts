import { z } from 'zod';

export const createCentreSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  location: z.string().min(1, 'Location is required'),
});

export const createTestSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  price: z.number().positive('Price must be a positive number'),
});

export type CreateCentreInput = z.infer<typeof createCentreSchema>;
export type CreateTestInput = z.infer<typeof createTestSchema>;