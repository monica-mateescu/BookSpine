import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';

import { setupTest, teardownTest } from '../setup';

import type { TestHelpers } from 'better-auth/plugins';

describe('auth flow (integration)', () => {
  let auth: Awaited<ReturnType<typeof setupTest>>['auth'];
  let test: TestHelpers;

  const createdUserIds: string[] = [];

  beforeAll(async () => {
    const setup = await setupTest();
    auth = setup.auth;
    test = setup.test;
  });

  afterAll(async () => {
    await teardownTest();
  });

  afterEach(async () => {
    for (const id of createdUserIds) {
      await test.deleteUser(id);
    }
    createdUserIds.length = 0;
  });

  const createTestUser = async (overrides = {}) => {
    const user = test.createUser({
      email: `alice+${crypto.randomUUID()}@example.com`,
      name: 'Alice',
      lastName: 'Smith',
      emailVerified: false,
      role: 'user',
      ...overrides
    });

    await test.saveUser(user);
    createdUserIds.push(user.id);

    return user;
  };

  const loginUser = async (userId: string) => {
    return test.login({ userId });
  };

  it('user can register, login and access protected route', async () => {
    const user = await createTestUser();

    const { headers } = await loginUser(user.id);

    const session = await auth.api.getSession({ headers });

    expect(session).not.toBeNull();
    expect(session?.user.id).toBe(user.id);
  });

  it('should prevent duplicate emails', async () => {
    await createTestUser({ email: 'duplicate@example.com' });

    await expect(createTestUser({ email: 'duplicate@example.com' })).rejects.toThrow();
  });

  it('should create and invalidate session correctly', async () => {
    const user = await createTestUser();

    const { headers } = await loginUser(user.id);

    let session = await auth.api.getSession({ headers });
    expect(session?.user.id).toBe(user.id);

    await auth.api.signOut({ headers });

    session = await auth.api.getSession({ headers });
    expect(session).toBeNull();
  });

  it('should not allow access without session', async () => {
    const session = await auth.api.getSession({ headers: new Headers() });
    expect(session).toBeNull();
  });

  it('should fail login for non-existent user', async () => {
    await expect(loginUser('fake-id')).rejects.toThrow();
  });

  it('should not allow login after user is deleted', async () => {
    const user = await createTestUser();

    await test.deleteUser(user.id);

    await expect(loginUser(user.id)).rejects.toThrow();
  });
});
