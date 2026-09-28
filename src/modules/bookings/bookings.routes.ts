import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate.middleware';
import { validateUuidParam } from '../../middleware/validateUuidParam.middleware';
import { createBookingSchema } from './bookings.schema';
import {
  createBookingHandler,
  getBookingHandler,
  listBookingsHandler,
} from './bookings.controller';

const router = Router();

router.use(requireAuth);

router.post('/', validate(createBookingSchema), createBookingHandler);
router.get('/', listBookingsHandler);
router.get('/:id', validateUuidParam('id'), getBookingHandler);

export default router;