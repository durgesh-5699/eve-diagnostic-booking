import { env } from '../../config/env';

export function simulatePaymentOutcome(): 'SUCCESS' | 'FAILED' {
  return Math.random() < env.PAYMENT_SUCCESS_RATE ? 'SUCCESS' : 'FAILED';
}