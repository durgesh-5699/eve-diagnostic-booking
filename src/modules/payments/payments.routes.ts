import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate.middleware';
import { createPaymentSchema, webhookSchema } from './payments.schema';
import { createPaymentHandler, webhookHandler } from './payments.controller';

const router = Router();

router.post('/', requireAuth, validate(createPaymentSchema), createPaymentHandler);
router.post('/webhook', validate(webhookSchema), webhookHandler);

export default router;