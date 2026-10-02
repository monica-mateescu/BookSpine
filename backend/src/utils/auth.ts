import { MongoClient } from 'mongodb';
import { admin } from 'better-auth/plugins';
import { dash, sentinel } from '@better-auth/infra';
import { createAuth } from './createAuth.ts';
import { MONGO_URI, DB_NAME, CLIENT_BASE_URL, BETTER_AUTH_SECRET, BETTER_AUTH_URL, BETTER_AUTH_API_KEY } from '#config';
import { mailer } from './mailer.ts';

const client = new MongoClient(MONGO_URI);
const db = client.db(DB_NAME);

export const auth = createAuth({
  db,
  client,
  baseURL: BETTER_AUTH_URL!,
  trustedOrigins: [CLIENT_BASE_URL!],
  secret: BETTER_AUTH_SECRET!,
  isProduction: true,
  mailer,
  plugins: [
    admin(),
    dash({ apiKey: BETTER_AUTH_API_KEY }),
    sentinel({
      apiKey: BETTER_AUTH_API_KEY,
      security: {
        // Core protections
        credentialStuffing: {
          enabled: true,
          thresholds: { challenge: 3, block: 5 }
        },
        compromisedPassword: {
          enabled: true,
          action: 'block'
        },
        emailValidation: {
          enabled: false
        },
        // Location-based
        impossibleTravel: {
          enabled: true,
          action: 'challenge'
        },

        // Abuse prevention
        velocity: {
          enabled: true,
          maxSignupsPerVisitor: 5,
          action: 'challenge'
        },
        // Bot protection
        botBlocking: {
          action: 'challenge' // "log", "challenge", or "block"
        },
        suspiciousIpBlocking: {
          action: 'block'
        }
      }
    })
  ]
});
