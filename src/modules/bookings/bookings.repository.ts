import { pool } from '../../db/pool';
import type { Db } from '../../db/transaction';

export type BookingStatus = 'PENDING' | 'CONFIRMED' | 'FAILED' | 'CANCELLED';

export interface BookingRow {
  id: string;
  user_id: string;
  test_id: string;
  centre_id: string;
  appointment_at: Date;
  amount: string;
  status: BookingStatus;
  created_at: Date;
  updated_at: Date;
}

export async function createBooking(params: {
  userId: string;
  testId: string;
  centreId: string;
  appointmentAt: Date;
  amount: number;
}): Promise<BookingRow> {
  const result = await pool.query<BookingRow>(
    `INSERT INTO bookings (user_id, test_id, centre_id, appointment_at, amount, status)
     VALUES ($1, $2, $3, $4, $5, 'PENDING')
     RETURNING *`,
    [params.userId, params.testId, params.centreId, params.appointmentAt, params.amount],
  );
  return result.rows[0];
}

export async function findBookingById(id: string): Promise<BookingRow | null> {
  const result = await pool.query<BookingRow>('SELECT * FROM bookings WHERE id = $1', [id]);
  return result.rows[0] ?? null;
}

export async function findBookingsByUserId(userId: string): Promise<BookingRow[]> {
  const result = await pool.query<BookingRow>(
    'SELECT * FROM bookings WHERE user_id = $1 ORDER BY created_at DESC',
    [userId],
  );
  return result.rows;
}

export async function findBookingByIdForUpdate(id: string, db: Db): Promise<BookingRow | null> {
  const result = await db.query<BookingRow>(
    'SELECT * FROM bookings WHERE id = $1 FOR UPDATE',
    [id],
  );
  return result.rows[0] ?? null;
}

export async function updateBookingStatus(
  id: string,
  status: BookingStatus,
  db: Db = pool,
): Promise<BookingRow | null> {
  const result = await db.query<BookingRow>(
    `UPDATE bookings SET status = $2, updated_at = now() WHERE id = $1 RETURNING *`,
    [id, status],
  );
  return result.rows[0] ?? null;
}