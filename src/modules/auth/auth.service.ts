import { AppError } from '../../utils/AppError';
import { hashPassword, comparePassword } from '../../utils/password';
import { signToken } from '../../utils/jwt';
import { createUser, findUserByEmail } from './auth.repository';
import type { SignupInput, LoginInput } from './auth.schema.ts';

export async function signup(input: SignupInput) {
  const existing = await findUserByEmail(input.email);
  if (existing) {
    throw new AppError(409, 'Email already registered');
  }

  const passwordHash = await hashPassword(input.password);
  const user = await createUser(input.email, passwordHash);
  const token = signToken({ userId: user.id, email: user.email });

  return { user: { id: user.id, email: user.email }, token };
}

export async function login(input: LoginInput) {
  const user = await findUserByEmail(input.email);
  if (!user) {
    throw new AppError(401, 'Invalid email or password');
  }

  const isValid = await comparePassword(input.password, user.password_hash);
  if (!isValid) {
    throw new AppError(401, 'Invalid email or password');
  }

  const token = signToken({ userId: user.id, email: user.email });
  return { user: { id: user.id, email: user.email }, token };
}