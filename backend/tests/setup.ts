import { MongoMemoryServer } from 'mongodb-memory-server';
import { MongoClient } from 'mongodb';
import { testUtils } from 'better-auth/plugins';
import { createAuth } from '../src/utils/createAuth.ts';
import { mailer } from './integration/mailer.ts';

import type { TestHelpers } from 'better-auth/plugins';

let mongodb: MongoMemoryServer | null = null;
let client: MongoClient | null = null;

export async function setupTest() {
  mongodb = await MongoMemoryServer.create();

  client = new MongoClient(mongodb.getUri());
  await client.connect();

  const db = client.db('db-test');
  await db.collection('user').createIndex({ email: 1 }, { unique: true });

  const auth = createAuth({
    db,
    client,
    baseURL: 'http://localhost:3000',
    secret: 'test-secret',
    isProduction: false,
    mailer,
    plugins: [testUtils()]
  });

  const ctx = await auth.$context;

  const test = (ctx as typeof ctx & { test: TestHelpers }).test;

  if (!test) {
    throw new Error('testUtils plugin not initialized');
  }

  return {
    auth,
    test,
    mailer
  };
}

export async function teardownTest() {
  await client?.close();
  await mongodb?.stop();

  client = null;
  mongodb = null;
}
