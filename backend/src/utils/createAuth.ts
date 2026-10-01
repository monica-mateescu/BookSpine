import { betterAuth } from 'better-auth';
import { mongodbAdapter } from 'better-auth/adapters/mongodb';
import type { Db, MongoClient } from 'mongodb';
import type { BetterAuthPlugin } from 'better-auth';
import { createAuthMiddleware } from 'better-auth/api';
import { APIError } from 'better-auth/api';
import type { Mailer } from '#types';
import { getEmailHtmlTemplate } from './emailTemplate.ts';

type CreateAuthOptions = {
  db: Db;
  client: MongoClient;
  baseURL: string;
  trustedOrigins?: string[];
  secret: string;
  isProduction: boolean;
  mailer: Mailer;
};

export const createAuth = <P extends BetterAuthPlugin[] = []>({
  db,
  client,
  baseURL,
  trustedOrigins,
  secret,
  isProduction,
  mailer,
  plugins = [] as unknown as P
}: CreateAuthOptions & { plugins?: P }) =>
  betterAuth({
    database: mongodbAdapter(db, { client }),
    secret,
    baseURL,
    trustedOrigins,
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: true,
      autoSignIn: false,
      sendResetPassword: async ({ user, url }) => {
        const emailHtml = getEmailHtmlTemplate({
          contentHtml: `
            <h1 style="font-family: Arial, sans-serif; font-size: 18px; margin-bottom: 10px;">Hi ${user.name},</h1>
            <p style="font-family: Arial, sans-serif; font-size: 14px; margin-bottom: 10px;">You requested to reset your password. Please reset your password by clicking the button below. If you did not request a password reset, please ignore this email.</p>`,
          signatureHtml: `
            <p style="font-family: Arial, sans-serif; font-size: 14px; margin-top: 10px; margin-bottom: 10px;">Thank you,<br />Your BookSpine team</p>
          `,
          showButton: true,
          buttonUrl: url,
          buttonText: 'Reset password'
        });
        void mailer.sendEmail({
          to: user.email,
          subject: 'Reset your password',
          html: emailHtml
        });
      }
    },
    session: {
      cookieCache: {
        enabled: true,
        maxAge: 5 * 60
      }
    },
    user: {
      fields: {
        name: 'firstName'
      },
      additionalFields: {
        lastName: {
          type: 'string',
          defaultValue: ''
        },
        role: {
          type: 'string',
          input: false,
          defaultValue: 'user'
        },
        deletedAt: {
          type: 'date',
          input: false,
          defaultValue: null
        }
      },
      changeEmail: {
        enabled: true,
        sendChangeEmailConfirmation: async ({ user, newEmail, url }) => {
          const emailHtml = getEmailHtmlTemplate({
            contentHtml: `
            <h1 style="font-family: Arial, sans-serif; font-size: 18px; margin-bottom: 10px;">Hi ${user.name},</h1>
            <p style="font-family: Arial, sans-serif; font-size: 14px; margin-bottom: 10px;">You requested to change your email address to ${newEmail}. Please change your email address by clicking the link below.</p>`,
            signatureHtml: `
            <p style="font-family: Arial, sans-serif; font-size: 14px; margin-top: 10px; margin-bottom: 10px;">Thank you,<br />Your BookSpine team</p>
          `,
            showButton: true,
            buttonUrl: url,
            buttonText: 'Change email address'
          });
          void mailer.sendEmail({
            to: user.email,
            subject: 'Change your email address',
            html: emailHtml
          });
        }
      }
    },
    emailVerification: {
      sendOnSignUp: true,
      autoSigninAfterVerification: false,
      sendVerificationEmail: async ({ user, url }) => {
        const emailHtml = getEmailHtmlTemplate({
          contentHtml: `
            <h1 style="font-family: Arial, sans-serif; font-size: 18px; margin-bottom: 10px;">Hi ${user.name},</h1>
            <p style="font-family: Arial, sans-serif; font-size: 14px; margin-bottom: 10px;">Thank you for signing up! Please confirm your email address by clicking the link below.</p>`,
          signatureHtml: `
            <p style="font-family: Arial, sans-serif; font-size: 14px; margin-top: 10px; margin-bottom: 10px;">Thank you,<br />Your BookSpine team</p>
          `,
          showButton: true,
          buttonUrl: url,
          buttonText: 'Confirm email address'
        });
        void mailer.sendEmail({
          to: user.email,
          subject: 'Confirm your email address',
          html: emailHtml
        });
      }
    },
    advanced: {
      defaultCookieAttributes: {
        sameSite: 'lax',
        secure: isProduction
      }
    },
    hooks: {
      before: createAuthMiddleware(async context => {
        if (context.path !== '/sign-in/email') {
          return;
        }

        const email = context.body?.email;

        if (typeof email !== 'string' || !email.trim()) {
          return;
        }

        const user = await db
          .collection('user')
          .findOne({ email: email.toLowerCase() }, { projection: { deletedAt: 1 } });

        if (user?.deletedAt) {
          throw APIError.from('FORBIDDEN', {
            message: 'This account has been deleted.',
            code: 'ACCOUNT_DELETED'
          });
        }
      })
    },
    plugins
  });
