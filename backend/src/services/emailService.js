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

export const sendWelcomeEmail = async (userName, userEmail, userId) => {
  if (!(await ensureMailerIsReady())) {
    return { sent: false, reason: "mailer_not_ready" };
  }

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff;">
      <h2 style="margin: 0 0 12px; color: #0f172a;">Welcome to PropRegistry, ${userName}!</h2>
      <p style="margin: 0 0 12px; color: #334155; line-height: 1.6;">Thank you for signing up. Your account has been created successfully, and you can now start managing your properties.</p>
      <table style="width:100%; margin: 12px 0;">
        <tr>
          <td style="font-weight:600; color:#64748b; width:120px;">Name</td>
          <td style="color:#0f172a;">${userName}</td>
        </tr>
        <tr>
          <td style="font-weight:600; color:#64748b;">Email</td>
          <td style="color:#0f172a;">${userEmail}</td>
        </tr>
        <tr>
          <td style="font-weight:600; color:#64748b;">Your User ID</td>
          <td style="color:#0f172a; font-family: monospace; word-break: break-all;">${userId}</td>
        </tr>
      </table>
      <p style="margin: 0 0 12px; color: #334155; line-height: 1.6;">Please save this User ID carefully. It will be required for property registration and verification.</p>
      <p style="margin: 0; color: #64748b; font-size: 12px;">PropRegistry Team</p>
    </div>
  `;

  const text = [
    `Welcome to PropRegistry, ${userName}!`,
    "",
    `Name: ${userName}`,
    `Email: ${userEmail}`,
    `Your User ID: ${userId}`,
    "",
    "Please save this User ID carefully because it will be required for future property registration.",
    "",
    "PropRegistry Team",
  ].join("\n");

  try {
    const info = await sendMailWithLogs(
      {
        from: getFromAddress(),
        to: userEmail,
        subject: "Welcome to PropRegistry — your User ID",
        text,
        html,
      },
      "user_welcome_email",
    );

    return { sent: true, info };
  } catch (err) {
    logger.error("Failed to send welcome email", { error: err?.message || err, userEmail, userId });
    return { sent: false, reason: "send_failed", error: err?.message || String(err) };
  }
};

export const sendAdminNotification = async (userName, userEmail, userId) => {
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
        <tr>
          <td style="padding: 8px 0; color: #64748b;">User ID</td>
          <td style="padding: 8px 0; color: #0f172a; font-weight: 600; font-family: monospace;">${userId}</td>
        </tr>
      </table>
    </div>
  `;

  const text = [
    "New user signup detected.",
    `Name: ${userName}`,
    `Email: ${userEmail}`,
    `Signed Up At: ${signupTime}`,
    `User ID: ${userId}`,
  ].join("\n");
  try {
    const info = await sendMailWithLogs(
      {
        from: getFromAddress(),
        to: mailerConfig.adminEmail,
        subject: `New signup: ${userName}`,
        text,
        html,
      },
      "admin_signup_notification",
    );

    return { sent: true, info };
  } catch (err) {
    logger.error("Failed to send admin signup notification", { error: err?.message || err, userEmail, userId });
    return { sent: false, reason: "send_failed", error: err?.message || String(err) };
  }
};

export const sendSignupEmails = async ({ userName, userEmail, userId }) => {
  const [adminResult, userResult] = await Promise.allSettled([
    sendAdminNotification(userName, userEmail, userId),
    sendWelcomeEmail(userName, userEmail, userId),
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