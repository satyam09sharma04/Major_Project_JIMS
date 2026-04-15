import { mailerConfig, transporter, verifyMailerTransporter } from "../config/mailer.js";
import logger from "../utils/logger.js";

const getFromAddress = () => {
  if (mailerConfig.emailFrom) {
    return mailerConfig.emailFrom;
  }

  if (mailerConfig.emailUser) {
    return `"PropRegistry" <${mailerConfig.emailUser}>`;
  }

  return "PropRegistry <no-reply@example.com>";
};

const ensureMailerIsReady = async () => {
  const isVerified = await verifyMailerTransporter();
  if (!isVerified) {
    logger.warn("Email dispatch skipped because transporter is not ready");
    return false;
  }

  return true;
};

const sendMailWithLogs = async (mailOptions, context) => {
  logger.info("Sending email", {
    context,
    to: mailOptions.to,
    subject: mailOptions.subject,
  });

  const info = await transporter.sendMail(mailOptions);

  logger.info("Email sent successfully", {
    context,
    messageId: info.messageId,
    accepted: info.accepted,
    rejected: info.rejected,
    response: info.response,
  });

  return info;
};

export const sendWelcomeEmail = async (userName, userEmail) => {
  if (!(await ensureMailerIsReady())) {
    return { sent: false, reason: "mailer_not_ready" };
  }

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff;">
      <h2 style="margin: 0 0 12px; color: #0f172a;">Welcome to PropRegistry, ${userName}!</h2>
      <p style="margin: 0 0 12px; color: #334155; line-height: 1.6;">Thank you for signing up. Your account has been created successfully, and you can now start managing your properties.</p>
      <p style="margin: 0 0 20px; color: #334155; line-height: 1.6;">If you have any questions, reply to this email and our team will help you.</p>
      <p style="margin: 0; color: #64748b; font-size: 12px;">PropRegistry Team</p>
    </div>
  `;

  const text = [
    `Welcome to PropRegistry, ${userName}!`,
    "",
    "Thank you for signing up. Your account has been created successfully.",
    "You can now start managing your properties.",
    "",
    "PropRegistry Team",
  ].join("\n");

  await sendMailWithLogs(
    {
      from: getFromAddress(),
      to: userEmail,
      subject: "Thank you for signing up to PropRegistry",
      text,
      html,
    },
    "user_welcome_email",
  );

  return { sent: true };
};

export const sendAdminNotification = async (userName, userEmail) => {
  if (!mailerConfig.adminEmail) {
    logger.warn("Admin signup notification skipped because ADMIN_EMAIL is missing");
    return { sent: false, reason: "admin_email_missing" };
  }

  if (!(await ensureMailerIsReady())) {
    return { sent: false, reason: "mailer_not_ready" };
  }

  const signupTime = new Date().toISOString();

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff;">
      <h2 style="margin: 0 0 16px; color: #0f172a;">New User Signup</h2>
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0; color: #64748b; width: 120px;">Name</td>
          <td style="padding: 8px 0; color: #0f172a; font-weight: 600;">${userName}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #64748b;">Email</td>
          <td style="padding: 8px 0; color: #0f172a; font-weight: 600;">${userEmail}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #64748b;">Signed Up At</td>
          <td style="padding: 8px 0; color: #0f172a; font-weight: 600;">${signupTime}</td>
        </tr>
      </table>
    </div>
  `;

  const text = [
    "New user signup detected.",
    `Name: ${userName}`,
    `Email: ${userEmail}`,
    `Signed Up At: ${signupTime}`,
  ].join("\n");

  await sendMailWithLogs(
    {
      from: getFromAddress(),
      to: mailerConfig.adminEmail,
      subject: `New signup: ${userName}`,
      text,
      html,
    },
    "admin_signup_notification",
  );

  return { sent: true };
};

export const sendSignupEmails = async ({ userName, userEmail }) => {
  const [adminResult, userResult] = await Promise.allSettled([
    sendAdminNotification(userName, userEmail),
    sendWelcomeEmail(userName, userEmail),
  ]);

  const summary = {
    admin:
      adminResult.status === "fulfilled"
        ? adminResult.value
        : { sent: false, reason: "failed", error: adminResult.reason?.message || "Unknown error" },
    user:
      userResult.status === "fulfilled"
        ? userResult.value
        : { sent: false, reason: "failed", error: userResult.reason?.message || "Unknown error" },
  };

  logger.info("Signup email dispatch completed", {
    userEmail,
    summary,
  });

  return summary;
};