import { pool } from '../../db/pool';
import type { Db } from '../../db/transaction';

export type PaymentStatus = 'PENDING' | 'SUCCESS' | 'FAILED';

export interface PaymentRow {
  id: string;
  booking_id: string;
  amount: string;
  status: PaymentStatus;
  created_at: Date;
  updated_at: Date;
}

export async function createPayment(
  params: { bookingId: string; amount: number; status: PaymentStatus },
  db: Db = pool,
): Promise<PaymentRow> {
  const result = await db.query<PaymentRow>(
    `INSERT INTO payments (booking_id, amount, status)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [params.bookingId, params.amount, params.status],
  );
  return result.rows[0];
}

export async function findPaymentById(id: string, db: Db = pool): Promise<PaymentRow | null> {
  const result = await db.query<PaymentRow>('SELECT * FROM payments WHERE id = $1', [id]);
  return result.rows[0] ?? null;
}

export async function updatePaymentStatus(
  id: string,
  status: PaymentStatus,
  db: Db = pool,
): Promise<PaymentRow | null> {
  const result = await db.query<PaymentRow>(
    `UPDATE payments SET status = $2, updated_at = now() WHERE id = $1 RETURNING *`,
    [id, status],
  );
  return result.rows[0] ?? null;
}

// true = naya event (insert hua), false = duplicate (pehle se exist karta tha)
export async function insertWebhookEvent(
  eventId: string,
  payload: unknown,
  db: Db = pool,
): Promise<boolean> {
  const result = await db.query(
    `INSERT INTO webhook_events (event_id, payload)
     VALUES ($1, $2)
     ON CONFLICT (event_id) DO NOTHING
     RETURNING id`,
    [eventId, JSON.stringify(payload)],
  );
  return result.rowCount === 1;
}