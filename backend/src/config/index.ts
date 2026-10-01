import { z } from 'zod';

const envSchema = z.object({
  MONGO_URI: z.url({ protocol: /mongodb/ }),
  DB_NAME: z.string(),
  CLIENT_BASE_URL: z.url(),
  BETTER_AUTH_SECRET: z.string(),
  BETTER_AUTH_API_KEY: z.string(),
  BETTER_AUTH_URL: z.url(),
  DOMAIN: z.string(),
  RESEND_API_KEY: z.string(),
  EMAIL_FROM: z.string(),
  EMAIL_TO: z.string().optional(),
  TURNSTILE_SECRET_KEY: z.string().optional()
});

const { data, error, success } = envSchema.safeParse(process.env);

if (!success) {
  console.error('Invalid environment variables:', z.prettifyError(error));
  process.exit(1);
}

export const {
  MONGO_URI,
  DB_NAME,
  CLIENT_BASE_URL,
  BETTER_AUTH_SECRET,
  BETTER_AUTH_API_KEY,
  BETTER_AUTH_URL,
  DOMAIN,
  RESEND_API_KEY,
  EMAIL_FROM,
  EMAIL_TO,
  TURNSTILE_SECRET_KEY
} = data;
