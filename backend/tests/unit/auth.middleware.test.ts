import { describe, it, expect, beforeEach, vi } from 'vitest';

import { authMiddleware } from '../../src/middlewares/auth.ts';
import { userService } from '#services';

import type { Request, Response, NextFunction } from 'express';

vi.mock('#services', () => ({
  userService: { getSessionUser: vi.fn() }
}));

const getSessionUserMock = vi.mocked(userService.getSessionUser);

const next = vi.fn() as NextFunction;
const createRequest = (): Request => ({}) as Request;
const createResponse = (): Response => ({}) as Response;

beforeEach(() => {
  vi.clearAllMocks();
});

describe('Auth Middleware - authMiddleware', () => {
  it('should call next() if session is valid', async () => {
    const req = createRequest();
    const res = createResponse();
    getSessionUserMock.mockResolvedValue({ id: '1', email: 'test@example.com', name: 'Test User' } as any);

    await authMiddleware(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
  });

  it('should call next() with an error if session is invalid', async () => {
    const req = createRequest();
    const res = createResponse();
    getSessionUserMock.mockResolvedValue(null);

    await authMiddleware(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith(new Error('Unauthorized', { cause: { status: 401 } }));
  });
});
