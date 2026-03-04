// Mock BEFORE imports — Jest hoists jest.mock() calls
const mockEmailsSend = jest.fn();

jest.mock('resend', () => ({
  Resend: jest.fn(() => ({ emails: { send: mockEmailsSend } })),
}));

import { sendNewsletter } from '../email-sender.js';
import type { NewsletterEmail } from '../types.js';
import { Resend } from 'resend';

const makeEmail = (): NewsletterEmail => ({
  to: ['cole.robinson@gce.com'],
  subject: 'Krebs on Security: Test Article',
  html: '<h1>Test</h1>',
  text: 'Test plain text',
});

describe('sendNewsletter', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.RESEND_API_KEY = 're_test_key_123';
    delete process.env.NEWSLETTER_FROM;
  });

  afterEach(() => {
    delete process.env.RESEND_API_KEY;
    delete process.env.NEWSLETTER_FROM;
  });

  it('calls resend.emails.send with correct payload', async () => {
    mockEmailsSend.mockResolvedValue({ data: { id: 'email-id-123' }, error: null });

    const email = makeEmail();
    await sendNewsletter(email);

    expect(mockEmailsSend).toHaveBeenCalledWith(
      expect.objectContaining({
        from: expect.any(String),
        to: ['cole.robinson@gce.com'],
        subject: 'Krebs on Security: Test Article',
        html: '<h1>Test</h1>',
        text: 'Test plain text',
      }),
    );
  });

  it('uses onboarding@resend.dev as default from address', async () => {
    mockEmailsSend.mockResolvedValue({ data: { id: 'email-id-456' }, error: null });

    await sendNewsletter(makeEmail());

    const callArg = mockEmailsSend.mock.calls[0][0];
    expect(callArg.from).toBe('onboarding@resend.dev');
  });

  it('uses NEWSLETTER_FROM env var when set', async () => {
    process.env.NEWSLETTER_FROM = 'newsletter@example.com';
    mockEmailsSend.mockResolvedValue({ data: { id: 'email-id-789' }, error: null });

    await sendNewsletter(makeEmail());

    const callArg = mockEmailsSend.mock.calls[0][0];
    expect(callArg.from).toBe('newsletter@example.com');
  });

  it('returns the Resend response ID on success', async () => {
    mockEmailsSend.mockResolvedValue({ data: { id: 'email-id-999' }, error: null });

    const id = await sendNewsletter(makeEmail());
    expect(id).toBe('email-id-999');
  });

  it('throws descriptive error when Resend returns an error', async () => {
    mockEmailsSend.mockResolvedValue({
      data: null,
      error: { name: 'validation_error', message: 'Invalid from address' },
    });

    await expect(sendNewsletter(makeEmail())).rejects.toThrow('Failed to send email');
  });

  it('throws clear error when RESEND_API_KEY is missing', async () => {
    delete process.env.RESEND_API_KEY;
    await expect(sendNewsletter(makeEmail())).rejects.toThrow('RESEND_API_KEY');
  });

  it('instantiates Resend with the provided API key', async () => {
    mockEmailsSend.mockResolvedValue({ data: { id: 'email-id-abc' }, error: null });
    process.env.RESEND_API_KEY = 're_custom_key_xyz';

    await sendNewsletter(makeEmail());

    expect(Resend).toHaveBeenCalledWith('re_custom_key_xyz');
  });
});
