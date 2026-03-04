import { Resend } from 'resend';
import type { NewsletterEmail } from './types.js';

export async function sendNewsletter(email: NewsletterEmail): Promise<string> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error('Missing RESEND_API_KEY. Set it in .env or GitHub Actions secrets.');
  }

  const from = process.env.NEWSLETTER_FROM ?? 'onboarding@resend.dev';
  const resend = new Resend(apiKey);

  const { data, error } = await resend.emails.send({
    from,
    to: email.to,
    subject: email.subject,
    html: email.html,
    text: email.text,
  });

  if (error) {
    throw new Error(`Failed to send email via Resend: ${error.message}`);
  }

  return data!.id;
}
