import { Router } from 'express';
import { validate } from '../../middleware/validate.middleware';
import { validateUuidParam } from '../../middleware/validateUuidParam.middleware';
import { createCentreSchema, createTestSchema } from './centres.schema';
import {
  createCentreHandler,
  listCentresHandler,
  getCentreHandler,
  addTestHandler,
  listTestsHandler,
} from './centres.controller';

const router = Router();

router.post('/', validate(createCentreSchema), createCentreHandler);
router.get('/', listCentresHandler);
router.get('/:id', validateUuidParam('id'), getCentreHandler);
router.post('/:id/tests', validateUuidParam('id'), validate(createTestSchema), addTestHandler);
router.get('/:id/tests', validateUuidParam('id'), listTestsHandler);

export default router;