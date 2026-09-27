import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as authRepository from './auth.repository';
import * as passwordUtil from '../../utils/password';
import * as jwtUtil from '../../utils/jwt';
import { signup, login } from './auth.service';

vi.mock('./auth.repository');
vi.mock('../../utils/password');
vi.mock('../../utils/jwt');

const fakeUser = {
  id: 'user-1',
  email: 'test@example.com',
  password_hash: 'hashed-password',
  created_at: new Date(),
  updated_at: new Date(),
};

describe('auth.service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('signup', () => {
    it('creates a new user and returns a token when email is not taken', async () => {
      vi.mocked(authRepository.findUserByEmail).mockResolvedValue(null);
      vi.mocked(passwordUtil.hashPassword).mockResolvedValue('hashed-password');
      vi.mocked(authRepository.createUser).mockResolvedValue(fakeUser);
      vi.mocked(jwtUtil.signToken).mockReturnValue('fake-jwt-token');

      const result = await signup({ email: 'test@example.com', password: 'password123' });

      expect(result.token).toBe('fake-jwt-token');
      expect(result.user).toEqual({ id: 'user-1', email: 'test@example.com' });
      expect(authRepository.createUser).toHaveBeenCalledWith('test@example.com', 'hashed-password');
    });

    it('throws a 409 error when email already exists', async () => {
      vi.mocked(authRepository.findUserByEmail).mockResolvedValue(fakeUser);

      await expect(
        signup({ email: 'test@example.com', password: 'password123' }),
      ).rejects.toMatchObject({ statusCode: 409 });
    });
  });

  describe('login', () => {
    it('returns a token when credentials are valid', async () => {
      vi.mocked(authRepository.findUserByEmail).mockResolvedValue(fakeUser);
      vi.mocked(passwordUtil.comparePassword).mockResolvedValue(true);
      vi.mocked(jwtUtil.signToken).mockReturnValue('fake-jwt-token');

      const result = await login({ email: 'test@example.com', password: 'password123' });

      expect(result.token).toBe('fake-jwt-token');
    });

    it('throws a 401 error when user does not exist', async () => {
      vi.mocked(authRepository.findUserByEmail).mockResolvedValue(null);

      await expect(
        login({ email: 'nope@example.com', password: 'password123' }),
      ).rejects.toMatchObject({ statusCode: 401 });
    });

    it('throws a 401 error when password is incorrect', async () => {
      vi.mocked(authRepository.findUserByEmail).mockResolvedValue(fakeUser);
      vi.mocked(passwordUtil.comparePassword).mockResolvedValue(false);

      await expect(
        login({ email: 'test@example.com', password: 'wrong-password' }),
      ).rejects.toMatchObject({ statusCode: 401 });
    });
  });
});