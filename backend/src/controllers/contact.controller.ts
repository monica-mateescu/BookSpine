import { contactInputSchema } from '#schemas';
import { type RequestHandler } from 'express';
import { sendEmail, getEmailHtmlTemplate } from '#utils';
import { z } from 'zod/v4';

import { EMAIL_TO, TURNSTILE_SECRET_KEY } from '#config';

interface TurnstileResult {
  success: boolean;
  'error-codes'?: string[];
}

export type contactDTO = z.infer<typeof contactInputSchema>;

export const sendContactMessage: RequestHandler<{}, { success: boolean } | { message: string }, contactDTO> = async (
  req,
  res,
  next
): Promise<void> => {
  try {
    if (!TURNSTILE_SECRET_KEY) {
      console.error('TURNSTILE_SECRET_KEY is not defined.');
      res.status(500).json({
        message: 'Contact form is unavailable. Please try again.'
      });
      return;
    }

    if (!EMAIL_TO) {
      console.error('EMAIL_TO destination address is not defined.');
      res.status(500).json({
        message: 'Contact form is unavailable. Please try again.'
      });
      return;
    }

    const { name, email, subject, message, turnstileToken } = req.body as contactDTO;

    const verifyUrl = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

    const turnstileResponse = await fetch(verifyUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        response: turnstileToken || '',
        secret: TURNSTILE_SECRET_KEY || ''
      })
    });

    const outcome = (await turnstileResponse.json()) as TurnstileResult;

    if (!outcome.success) {
      console.error('Turnstile verification failed', outcome['error-codes']);
      res.status(400).json({
        message: 'Security check failed. Please try again.'
      });
      return;
    }

    const emailHtml = getEmailHtmlTemplate({
      contentHtml: `
        <h1 style="font-family: Arial, sans-serif; font-size: 18px; margin-bottom: 10px;">
          Contact
        </h1>
        <p style="font-family: Arial, sans-serif; font-size: 14px; margin-bottom: 10px;">
          Name: ${name}
          <br />
          Email: ${email}
          <br />
          Subject: ${subject}
          <br />
          Message: ${message}
        </p>
      `,
      showButton: false
    });

    try {
      await sendEmail({
        from: 'Website <website@bookspine.net>',
        to: EMAIL_TO,
        subject: `New contact message - ${subject}`,
        html: emailHtml
      });
    } catch (error) {
      console.error('Failed to send email', error);
      res.status(500).json({
        message: 'Failed to send email. Please try again.'
      });
      return;
    }
    res.status(200).json({ success: true });
    return;
  } catch (error) {
    console.error('An unexpected error occurred', error);
    next(error);
  }
};
