import nodemailer from 'nodemailer';

const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });
};

export const sendAdminInvitation = async ({ name, email, inviteUrl, invitedBy }) => {
  if (!process.env.EMAIL_USER) return;
  const transporter = createTransporter();
  await transporter.sendMail({
    from: `"St. John's Carol Union" <${process.env.EMAIL_FROM}>`,
    to: email,
    subject: `You've been invited to join St. John's Carol Union Admin`,
    html: `
      <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:600px;margin:0 auto;background:#0a0a1a;color:#fff;border-radius:16px;overflow:hidden;border:1px solid rgba(139,92,246,0.25);">
        <div style="background:linear-gradient(135deg,#6d28d9,#4c1d95);padding:36px 32px;text-align:center;">
          <p style="margin:0;color:#d8b4fe;font-size:11px;letter-spacing:3px;text-transform:uppercase;">St. John's Carol Union</p>
          <h1 style="margin:12px 0 0;color:#fff;font-size:26px;font-weight:700;">You're Invited!</h1>
          <p style="margin:8px 0 0;color:#e9d5ff;font-size:14px;">Admin Portal Access</p>
        </div>
        <div style="padding:36px 32px;">
          <p style="color:#d1d5db;font-size:15px;line-height:1.7;">Hi <strong style="color:#fff;">${name}</strong>,</p>
          <p style="color:#d1d5db;font-size:15px;line-height:1.7;">
            <strong style="color:#c4b5fd;">${invitedBy}</strong> has invited you to join the
            <strong style="color:#fff;">St. John's Carol Union</strong> website as an Admin.
            You'll be able to manage productions, events, members, and more.
          </p>
          <div style="text-align:center;margin:36px 0;">
            <a href="${inviteUrl}" style="display:inline-block;background:linear-gradient(135deg,#7c3aed,#6d28d9);color:#fff;text-decoration:none;padding:14px 36px;border-radius:10px;font-size:15px;font-weight:600;letter-spacing:0.3px;">
              Accept Invitation
            </a>
          </div>
          <p style="color:#9ca3af;font-size:13px;line-height:1.6;">
            This invitation link will expire in <strong style="color:#e9d5ff;">48 hours</strong>.
            If you did not expect this invitation, you can safely ignore this email.
          </p>
          <div style="margin-top:32px;padding-top:24px;border-top:1px solid rgba(255,255,255,0.08);">
            <p style="color:#6b7280;font-size:12px;margin:0;">— The St. John's Carol Union Team</p>
          </div>
        </div>
      </div>
    `,
  });
};

export const sendEnquiryNotification = async (enquiry, toEmails) => {
  const recipients = toEmails?.length ? toEmails : process.env.ADMIN_EMAIL ? [process.env.ADMIN_EMAIL] : [];
  if (!process.env.EMAIL_USER || !recipients.length) return;

  const transporter = createTransporter();

  await transporter.sendMail({
    from: `"SJCU Website" <${process.env.EMAIL_FROM}>`,
    to: recipients.join(','),
    subject: `New Contact Enquiry from ${enquiry.name}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0a0a1a; color: #fff; padding: 32px; border-radius: 12px;">
        <h2 style="color: #8b5cf6; margin-bottom: 24px;">New Contact Enquiry</h2>
        <table style="width: 100%; border-collapse: collapse;">
          <tr><td style="padding: 8px 0; color: #a0aec0; width: 140px;">Name</td><td style="padding: 8px 0;">${enquiry.name}</td></tr>
          <tr><td style="padding: 8px 0; color: #a0aec0;">Email</td><td style="padding: 8px 0;">${enquiry.email}</td></tr>
          <tr><td style="padding: 8px 0; color: #a0aec0;">Phone</td><td style="padding: 8px 0;">${enquiry.phone}</td></tr>
          <tr><td style="padding: 8px 0; color: #a0aec0; vertical-align: top;">Message</td><td style="padding: 8px 0;">${enquiry.message}</td></tr>
        </table>
        <p style="margin-top: 24px; color: #6b7280; font-size: 12px;">Submitted at ${new Date().toLocaleString()}</p>
      </div>
    `,
  });
};

// Sends a CSS-styled "application form" style notification to every admin/super_admin
// when a new audition application is submitted.
export const sendAuditionApplicationNotification = async (application, audition, toEmails) => {
  if (!process.env.EMAIL_USER || !toEmails?.length) return;

  const transporter = createTransporter();

  const row = (label, value) => `
    <tr>
      <td style="padding: 10px 16px; color: #a0aec0; font-size: 13px; width: 160px; border-bottom: 1px solid rgba(255,255,255,0.08);">${label}</td>
      <td style="padding: 10px 16px; color: #f3f4f6; font-size: 14px; border-bottom: 1px solid rgba(255,255,255,0.08);">${value}</td>
    </tr>`;

  await transporter.sendMail({
    from: `"SJCU Auditions" <${process.env.EMAIL_FROM}>`,
    to: toEmails.join(','),
    subject: `New Audition Application — ${audition.title} (${application.applicationId})`,
    html: `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 640px; margin: 0 auto; background: #0a0a1a; color: #fff; border-radius: 16px; overflow: hidden; border: 1px solid rgba(139,92,246,0.25);">
        <div style="background: linear-gradient(135deg, #6d28d9, #4c1d95); padding: 28px 32px;">
          <p style="margin: 0; color: #d8b4fe; font-size: 12px; letter-spacing: 2px; text-transform: uppercase;">St. John's Carol Union</p>
          <h2 style="margin: 6px 0 0; color: #fff; font-size: 22px;">New Audition Application</h2>
          <p style="margin: 6px 0 0; color: #e9d5ff; font-size: 13px;">${audition.title} &middot; ${audition.auditionId}</p>
        </div>

        <div style="padding: 28px 32px;">
          <div style="text-align: center; margin-bottom: 24px;">
            <img src="${application.photo}" alt="${application.name}" width="120" height="120" style="border-radius: 12px; object-fit: cover; border: 2px solid #8b5cf6;" />
          </div>

          <table style="width: 100%; border-collapse: collapse; background: rgba(255,255,255,0.03); border-radius: 12px; overflow: hidden;">
            ${row('Application ID', application.applicationId)}
            ${row('Full Name', application.name)}
            ${row('Mobile Number', application.mobile)}
            ${row('Age', application.age)}
            ${row('Date of Birth', new Date(application.dob).toLocaleDateString())}
            ${row("Father's Name", application.fatherName)}
            ${row("Mother's Name", application.motherName)}
            ${row('Email', application.email || 'Not provided')}
            ${row('Audition Date', new Date(audition.date).toLocaleDateString())}
            ${row('Venue', audition.venue)}
          </table>

          <p style="margin-top: 24px; color: #6b7280; font-size: 12px;">Submitted at ${new Date(application.createdAt || Date.now()).toLocaleString()}</p>
        </div>
      </div>
    `,
  });
};

// Sent to the applicant right after they submit an audition application (only if they gave an email).
export const sendApplicantConfirmation = async (application, audition) => {
  if (!process.env.EMAIL_USER || !application.email) return;

  const transporter = createTransporter();

  return transporter.sendMail({
    from: `"St. John's Carol Union" <${process.env.EMAIL_FROM}>`,
    to: application.email,
    subject: `Thank you for applying — ${audition.title}`,
    html: `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0a0a1a; color: #fff; border-radius: 16px; overflow: hidden; border: 1px solid rgba(139,92,246,0.25);">
        <div style="background: linear-gradient(135deg, #6d28d9, #4c1d95); padding: 28px 32px;">
          <p style="margin: 0; color: #d8b4fe; font-size: 12px; letter-spacing: 2px; text-transform: uppercase;">St. John's Carol Union</p>
          <h2 style="margin: 6px 0 0; color: #fff; font-size: 22px;">Application Received!</h2>
        </div>
        <div style="padding: 28px 32px;">
          <p style="color: #d1d5db; line-height: 1.6;">Dear ${application.name},</p>
          <p style="color: #d1d5db; line-height: 1.6;">
            Thank you for applying for <strong style="color:#fff;">${audition.title}</strong>. We've successfully received your application
            (<span style="color:#c4b5fd;">${application.applicationId}</span>) and our team will review it shortly.
          </p>
          <p style="color: #d1d5db; line-height: 1.6;">
            If you qualify and are shortlisted for the next round, you will receive an email from us with further details.
            Please keep an eye on your inbox (and spam folder, just in case) over the coming days.
          </p>
          <p style="color: #d1d5db; line-height: 1.6;">
            Audition Date: <strong style="color:#fff;">${new Date(audition.date).toLocaleDateString()}</strong><br />
            Venue: <strong style="color:#fff;">${audition.venue}</strong>
          </p>
          <p style="color: #6b7280; font-size: 12px; margin-top: 32px;">— The St. John's Carol Union Team</p>
        </div>
      </div>
    `,
  });
};

// Sent to the applicant whenever the admin updates their application status.
export const sendApplicantStatusUpdate = async (application, audition, status) => {
  if (!process.env.EMAIL_USER || !application.email) return;

  const copy = {
    Shortlisted: {
      subject: `Congratulations! You've been shortlisted — ${audition.title}`,
      heading: "You've Been Shortlisted! 🎉",
      message: `Congratulations, ${application.name}! You've moved to the <strong style="color:#fff;">Shortlisted</strong> stage for ${audition.title}. Our team will reach out to you soon with the next steps.`,
    },
    Selected: {
      subject: `Congratulations! You've been selected — ${audition.title}`,
      heading: "You've Been Selected! 🎉",
      message: `Congratulations, ${application.name}! You've moved to the <strong style="color:#fff;">Selected</strong> stage for ${audition.title}. Welcome aboard — our team will be in touch with further details shortly.`,
    },
    Rejected: {
      subject: `Update on your application — ${audition.title}`,
      heading: 'Application Update',
      message: `Dear ${application.name}, thank you for taking the time to apply for ${audition.title}. After careful review, we will not be moving forward with your application this time. We truly appreciate your interest and encourage you to apply for future auditions.`,
    },
    Pending: {
      subject: `Update on your application — ${audition.title}`,
      heading: 'Application Update',
      message: `Dear ${application.name}, your application for ${audition.title} has been moved back to the <strong style="color:#fff;">Pending</strong> stage. We'll notify you again once there's an update.`,
    },
  }[status];

  if (!copy) return;

  const transporter = createTransporter();

  return transporter.sendMail({
    from: `"St. John's Carol Union" <${process.env.EMAIL_FROM}>`,
    to: application.email,
    subject: copy.subject,
    html: `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0a0a1a; color: #fff; border-radius: 16px; overflow: hidden; border: 1px solid rgba(139,92,246,0.25);">
        <div style="background: linear-gradient(135deg, #6d28d9, #4c1d95); padding: 28px 32px;">
          <p style="margin: 0; color: #d8b4fe; font-size: 12px; letter-spacing: 2px; text-transform: uppercase;">St. John's Carol Union</p>
          <h2 style="margin: 6px 0 0; color: #fff; font-size: 22px;">${copy.heading}</h2>
          <p style="margin: 6px 0 0; color: #e9d5ff; font-size: 13px;">${audition.title} &middot; ${application.applicationId}</p>
        </div>
        <div style="padding: 28px 32px;">
          <p style="color: #d1d5db; line-height: 1.6;">${copy.message}</p>
          <p style="color: #6b7280; font-size: 12px; margin-top: 32px;">— The St. John's Carol Union Team</p>
        </div>
      </div>
    `,
  });
};

export const sendEnquiryStatusUpdate = async (enquiry, status) => {
  if (!process.env.EMAIL_USER || !enquiry.email) return;

  const copy = {
    Contacted: {
      subject: `We've received your enquiry — St. John's Carol Union`,
      heading: "We'll Be in Touch Soon!",
      message: `Dear ${enquiry.name}, we've reviewed your message and our team will be reaching out to you shortly. Please keep an eye on your inbox.`,
    },
    Completed: {
      subject: `Your enquiry has been resolved — St. John's Carol Union`,
      heading: 'Enquiry Completed',
      message: `Dear ${enquiry.name}, we're happy to let you know that your enquiry has been successfully handled. Thank you for reaching out to St. John's Carol Union — it was a pleasure connecting with you!`,
    },
  }[status];

  if (!copy) return;

  const transporter = createTransporter();

  return transporter.sendMail({
    from: `"St. John's Carol Union" <${process.env.EMAIL_FROM}>`,
    to: enquiry.email,
    subject: copy.subject,
    html: `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0a0a1a; color: #fff; border-radius: 16px; overflow: hidden; border: 1px solid rgba(139,92,246,0.25);">
        <div style="background: linear-gradient(135deg, #6d28d9, #4c1d95); padding: 28px 32px;">
          <p style="margin: 0; color: #d8b4fe; font-size: 12px; letter-spacing: 2px; text-transform: uppercase;">St. John's Carol Union</p>
          <h2 style="margin: 6px 0 0; color: #fff; font-size: 22px;">${copy.heading}</h2>
        </div>
        <div style="padding: 28px 32px;">
          <p style="color: #d1d5db; line-height: 1.7;">${copy.message}</p>
          <p style="color: #d1d5db; line-height: 1.7; margin-top: 16px;">
            If you have any questions in the meantime, feel free to reply to this email or reach us at
            <a href="mailto:${process.env.EMAIL_FROM}" style="color: #c4b5fd;">${process.env.EMAIL_FROM}</a>.
          </p>
          <p style="color: #6b7280; font-size: 12px; margin-top: 32px;">— The St. John's Carol Union Team</p>
        </div>
      </div>
    `,
  });
};

export const sendEnquiryConfirmation = async (enquiry) => {
  if (!process.env.EMAIL_USER) return;

  const transporter = createTransporter();

  await transporter.sendMail({
    from: `"St. John's Carol Union" <${process.env.EMAIL_FROM}>`,
    to: enquiry.email,
    subject: 'We received your enquiry — St. John\'s Carol Union',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0a0a1a; color: #fff; padding: 32px; border-radius: 12px;">
        <h2 style="color: #8b5cf6;">Thank you, ${enquiry.name}!</h2>
        <p style="color: #d1d5db; line-height: 1.6;">We've received your production enquiry and will get back to you within 24–48 hours.</p>
        <p style="color: #d1d5db; line-height: 1.6;">In the meantime, explore our latest productions and events on our website.</p>
        <p style="color: #6b7280; font-size: 12px; margin-top: 32px;">— The St. John's Carol Union Team</p>
      </div>
    `,
  });
};

export const sendTestimonialAdminNotification = async (testimonial, toEmails) => {
  if (!process.env.EMAIL_USER || !toEmails?.length) return;

  const transporter = createTransporter();
  const stars = '⭐'.repeat(testimonial.rating);

  const row = (label, value) => `
    <tr>
      <td style="padding: 10px 16px; color: #a0aec0; font-size: 13px; width: 140px; border-bottom: 1px solid rgba(255,255,255,0.08);">${label}</td>
      <td style="padding: 10px 16px; color: #f3f4f6; font-size: 14px; border-bottom: 1px solid rgba(255,255,255,0.08);">${value}</td>
    </tr>`;

  await transporter.sendMail({
    from: `"SJCU Website" <${process.env.EMAIL_FROM}>`,
    to: toEmails.join(','),
    subject: `New Review Submitted — ${testimonial.name}`,
    html: `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 640px; margin: 0 auto; background: #0a0a1a; color: #fff; border-radius: 16px; overflow: hidden; border: 1px solid rgba(139,92,246,0.25);">
        <div style="background: linear-gradient(135deg, #6d28d9, #4c1d95); padding: 28px 32px;">
          <p style="margin: 0; color: #d8b4fe; font-size: 12px; letter-spacing: 2px; text-transform: uppercase;">St. John's Carol Union</p>
          <h2 style="margin: 6px 0 0; color: #fff; font-size: 22px;">New Review Received</h2>
          <p style="margin: 6px 0 0; color: #e9d5ff; font-size: 13px;">Awaiting your approval to publish</p>
        </div>
        <div style="padding: 28px 32px;">
          <table style="width: 100%; border-collapse: collapse; background: rgba(255,255,255,0.03); border-radius: 12px; overflow: hidden;">
            ${row('Reviewer', testimonial.name)}
            ${testimonial.designation ? row('Designation', testimonial.designation) : ''}
            ${testimonial.email ? row('Email', testimonial.email) : ''}
            ${row('Rating', stars + ` (${testimonial.rating}/5)`)}
            ${row('Message', `<em style="color:#d1d5db;">"${testimonial.message}"</em>`)}
            ${row('Submitted', new Date(testimonial.createdAt || Date.now()).toLocaleString())}
          </table>
          <p style="margin-top: 24px; color: #9ca3af; font-size: 13px; line-height: 1.6;">Log in to the admin panel to review and publish this testimonial.</p>
          <p style="color: #6b7280; font-size: 12px; margin-top: 32px;">— The St. John's Carol Union Website</p>
        </div>
      </div>
    `,
  });
};

export const sendTestimonialReviewerConfirmation = async (testimonial) => {
  if (!process.env.EMAIL_USER || !testimonial.email) return;

  const transporter = createTransporter();

  await transporter.sendMail({
    from: `"St. John's Carol Union" <${process.env.EMAIL_FROM}>`,
    to: testimonial.email,
    subject: `Thank you for your review — St. John's Carol Union`,
    html: `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0a0a1a; color: #fff; border-radius: 16px; overflow: hidden; border: 1px solid rgba(139,92,246,0.25);">
        <div style="background: linear-gradient(135deg, #6d28d9, #4c1d95); padding: 28px 32px;">
          <p style="margin: 0; color: #d8b4fe; font-size: 12px; letter-spacing: 2px; text-transform: uppercase;">St. John's Carol Union</p>
          <h2 style="margin: 6px 0 0; color: #fff; font-size: 22px;">Review Received!</h2>
        </div>
        <div style="padding: 28px 32px;">
          <p style="color: #d1d5db; line-height: 1.6;">Dear <strong style="color: #fff;">${testimonial.name}</strong>,</p>
          <p style="color: #d1d5db; line-height: 1.6;">
            Thank you so much for taking the time to share your experience with <strong style="color: #fff;">St. John's Carol Union</strong>.
            We've received your review and our team will verify it shortly.
          </p>
          <p style="color: #d1d5db; line-height: 1.6;">
            Once approved, your testimonial will appear on our website for others to see. We truly appreciate your kind words and support!
          </p>
          <p style="color: #6b7280; font-size: 12px; margin-top: 32px;">— The St. John's Carol Union Team</p>
        </div>
      </div>
    `,
  });
};
