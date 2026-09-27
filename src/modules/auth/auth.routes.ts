import { Router } from 'express';
import { validate } from '../../middleware/validate.middleware';
import { signupSchema, loginSchema } from './auth.schema';
import { signupHandler, loginHandler } from './auth.controller';

const router = Router();

router.post('/signup', validate(signupSchema), signupHandler);
router.post('/login', validate(loginSchema), loginHandler);

export default router;