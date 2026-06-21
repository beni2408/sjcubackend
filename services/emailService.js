import { Resend } from 'resend';
import { getDecryptedKey } from '../controllers/apiKeysController.js';

async function getResend() {
  // Prefer env var (Vercel/Render secrets), fall back to DB-stored key
  const apiKey = process.env.RESEND_API_KEY || await getDecryptedKey('resendApiKey');
  if (!apiKey) return null;
  return new Resend(apiKey);
}

const FROM = 'St. John\'s Carol Union <noreply@stjohnscarolunion.com>';

const EMAIL_HEADER = `
  <div style="text-align:center;padding:28px 0 20px;border-bottom:1px solid #1e1b4b;">
    <img src="https://sjcunew2.netlify.app/logo.png" alt="St. John's Carol Union" width="64" height="64"
      style="border-radius:50%;border:2px solid #7c3aed;object-fit:contain;background:#fff;" />
    <p style="margin:10px 0 0;color:#a78bfa;font-size:12px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;">
      St. John's Carol Union
    </p>
  </div>
`;

// ── Enquiry notification to admin ────────────────────────────────────────────
export const sendEnquiryNotification = async (enquiry) => {
  const resend = await getResend();
  if (!resend) return;
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail) return;

  await resend.emails.send({
    from: FROM,
    to: adminEmail,
    subject: `New Production Enquiry from ${enquiry.name}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#0a0a1a;color:#fff;padding:32px;border-radius:12px;">
        ${EMAIL_HEADER}
        <h2 style="color:#8b5cf6;margin:24px 0 16px;">New Production Enquiry</h2>
        <table style="width:100%;border-collapse:collapse;">
          <tr><td style="padding:8px 0;color:#a0aec0;width:140px;">Name</td><td style="padding:8px 0;">${enquiry.name}</td></tr>
          <tr><td style="padding:8px 0;color:#a0aec0;">Email</td><td style="padding:8px 0;">${enquiry.email}</td></tr>
          <tr><td style="padding:8px 0;color:#a0aec0;">Phone</td><td style="padding:8px 0;">${enquiry.phone}</td></tr>
          <tr><td style="padding:8px 0;color:#a0aec0;">Event Type</td><td style="padding:8px 0;">${enquiry.eventType}</td></tr>
          <tr><td style="padding:8px 0;color:#a0aec0;">Budget</td><td style="padding:8px 0;">${enquiry.budget || 'Not specified'}</td></tr>
          <tr><td style="padding:8px 0;color:#a0aec0;vertical-align:top;">Message</td><td style="padding:8px 0;">${enquiry.message}</td></tr>
        </table>
        <p style="margin-top:24px;color:#6b7280;font-size:12px;">Submitted at ${new Date().toLocaleString()}</p>
      </div>
    `,
  });
};

// ── Enquiry confirmation to user ─────────────────────────────────────────────
export const sendEnquiryConfirmation = async (enquiry) => {
  const resend = await getResend();
  if (!resend) return;

  await resend.emails.send({
    from: FROM,
    to: enquiry.email,
    subject: "We received your enquiry — St. John's Carol Union",
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#0a0a1a;color:#fff;padding:32px;border-radius:12px;">
        ${EMAIL_HEADER}
        <h2 style="color:#8b5cf6;margin-top:24px;">Thank you, ${enquiry.name}!</h2>
        <p style="color:#d1d5db;line-height:1.6;">We've received your production enquiry and will get back to you within 24–48 hours.</p>
        <p style="color:#d1d5db;line-height:1.6;">In the meantime, explore our latest productions and events on our website.</p>
        <p style="color:#6b7280;font-size:12px;margin-top:32px;">— The St. John's Carol Union Team</p>
      </div>
    `,
  });
};

// ── Testimonial admin notification ───────────────────────────────────────────
export const sendTestimonialAdminNotification = async (testimonial, toEmails) => {
  const resend = await getResend();
  if (!resend || !toEmails?.length) return;

  await resend.emails.send({
    from: FROM,
    to: toEmails,
    subject: `New Review Submitted by ${testimonial.name}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#0a0a1a;color:#fff;padding:32px;border-radius:12px;">
        ${EMAIL_HEADER}
        <h2 style="color:#8b5cf6;margin:24px 0 16px;">New Review Pending Approval</h2>
        <table style="width:100%;border-collapse:collapse;">
          <tr><td style="padding:8px 0;color:#a0aec0;width:140px;">Name</td><td style="padding:8px 0;">${testimonial.name}</td></tr>
          ${testimonial.designation ? `<tr><td style="padding:8px 0;color:#a0aec0;">Designation</td><td style="padding:8px 0;">${testimonial.designation}</td></tr>` : ''}
          <tr><td style="padding:8px 0;color:#a0aec0;">Rating</td><td style="padding:8px 0;">${'★'.repeat(testimonial.rating)}${'☆'.repeat(5 - testimonial.rating)} (${testimonial.rating}/5)</td></tr>
          <tr><td style="padding:8px 0;color:#a0aec0;vertical-align:top;">Message</td><td style="padding:8px 0;">${testimonial.message}</td></tr>
        </table>
        <p style="margin-top:24px;color:#a78bfa;font-size:13px;">Log in to the admin panel to review and approve.</p>
      </div>
    `,
  });
};

// ── Testimonial confirmation to reviewer ─────────────────────────────────────
export const sendTestimonialReviewerConfirmation = async (testimonial) => {
  const resend = await getResend();
  if (!resend || !testimonial.email) return;

  await resend.emails.send({
    from: FROM,
    to: testimonial.email,
    subject: "Thank you for your review — St. John's Carol Union",
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#0a0a1a;color:#fff;padding:32px;border-radius:12px;">
        ${EMAIL_HEADER}
        <h2 style="color:#8b5cf6;margin-top:24px;">Thank you, ${testimonial.name}!</h2>
        <p style="color:#d1d5db;line-height:1.6;">We've received your review and it will appear on our website once approved by our team.</p>
        <div style="margin:24px 0;padding:16px;background:rgba(124,58,237,0.1);border-left:3px solid #8b5cf6;border-radius:4px;">
          <p style="color:#a78bfa;font-style:italic;margin:0;">"${testimonial.message}"</p>
        </div>
        <p style="color:#6b7280;font-size:12px;margin-top:32px;">— The St. John's Carol Union Team</p>
      </div>
    `,
  });
};
