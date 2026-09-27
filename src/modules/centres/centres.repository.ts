import { pool } from '../../db/pool';

export interface CentreRow {
  id: string;
  name: string;
  location: string;
  created_at: Date;
  updated_at: Date;
}

export interface TestRow {
  id: string;
  centre_id: string;
  name: string;
  price: string; // pg returns NUMERIC as string to avoid float precision loss
  created_at: Date;
  updated_at: Date;
}

export async function createCentre(name: string, location: string): Promise<CentreRow> {
  const result = await pool.query<CentreRow>(
    `INSERT INTO diagnostic_centres (name, location) VALUES ($1, $2) RETURNING *`,
    [name, location],
  );
  return result.rows[0];
}

export async function findAllCentres(): Promise<CentreRow[]> {
  const result = await pool.query<CentreRow>(
    `SELECT * FROM diagnostic_centres ORDER BY created_at DESC`,
  );
  return result.rows;
}

export async function findCentreById(id: string): Promise<CentreRow | null> {
  const result = await pool.query<CentreRow>(
    `SELECT * FROM diagnostic_centres WHERE id = $1`,
    [id],
  );
  return result.rows[0] ?? null;
}

export async function createTest(
  centreId: string,
  name: string,
  price: number,
): Promise<TestRow> {
  const result = await pool.query<TestRow>(
    `INSERT INTO diagnostic_tests (centre_id, name, price) VALUES ($1, $2, $3) RETURNING *`,
    [centreId, name, price],
  );
  return result.rows[0];
}

export async function findTestsByCentreId(centreId: string): Promise<TestRow[]> {
  const result = await pool.query<TestRow>(
    `SELECT * FROM diagnostic_tests WHERE centre_id = $1 ORDER BY created_at DESC`,
    [centreId],
  );
  return result.rows;
}

export async function findTestById(id: string): Promise<TestRow | null> {
  const result = await pool.query<TestRow>(
    `SELECT * FROM diagnostic_tests WHERE id = $1`,
    [id],
  );
  return result.rows[0] ?? null;
}