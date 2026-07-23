import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.SMTP_EMAIL,
    pass: process.env.SMTP_PASSWORD,
  },
});

function isConfigured(): boolean {
  return !!(process.env.SMTP_EMAIL && process.env.SMTP_PASSWORD && process.env.SMTP_PASSWORD !== "your_gmail_app_password");
}

/**
 * Send a 6-digit verification code for email verification or password reset.
 */
export async function sendVerificationEmail(to: string, code: string, purpose: "verify" | "reset"): Promise<boolean> {
  if (!isConfigured()) {
    console.warn("[Email] SMTP not configured. Code for", to, "is:", code);
    return true; // Dev-mode: log code instead of failing
  }

  const subject = purpose === "verify"
    ? "LifeOS - Verify Your Email"
    : "LifeOS - Your Password Reset Code";

  const text = purpose === "verify"
    ? `Hello,\n\nYour email verification code is: ${code}\n\nThis code will expire in 15 minutes.\n\nIf you did not create an account, please ignore this email.`
    : `Hello,\n\nYou requested to reset your password for LifeOS.\n\nYour verification code is: ${code}\n\nThis code will expire in 15 minutes.\n\nIf you did not request this, please ignore this email.`;

  const html = `
    <!DOCTYPE html>
    <html>
    <body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
      <div style="max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.05); border: 1px solid #e2e8f0;">
        <div style="background: linear-gradient(135deg, #2563eb, #06b6d4); padding: 24px; text-align: center;">
          <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 700;">
            ${purpose === "verify" ? "Verify Your Email" : "Password Reset"}
          </h1>
        </div>
        <div style="padding: 40px 32px; text-align: center;">
          <p style="font-size: 16px; color: #475569; margin-top: 0;">
            ${purpose === "verify" ? "Use the code below to verify your email address." : "Use the code below to reset your password."}
          </p>
          <div style="background: #f1f5f9; border-radius: 12px; padding: 24px; margin: 24px 0; display: inline-block;">
            <span style="font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #0f172a; font-family: monospace;">${code}</span>
          </div>
          <p style="font-size: 14px; color: #94a3b8;">This code expires in 15 minutes.</p>
        </div>
        <div style="background-color: #f1f5f9; padding: 16px; text-align: center; border-top: 1px solid #e2e8f0;">
          <p style="margin: 0; font-size: 12px; color: #94a3b8;">Sent securely via LifeOS</p>
        </div>
      </div>
    </body>
    </html>`;

  try {
    await transporter.sendMail({
      from: `"LifeOS" <${process.env.SMTP_EMAIL}>`,
      to,
      subject,
      text,
      html,
    });
    return true;
  } catch (error) {
    console.error("[Email] Failed to send:", error);
    return false;
  }
}

/**
 * Send a login alert email.
 */
export async function sendLoginAlertEmail(to: string, ip: string, userAgent: string, time: string): Promise<boolean> {
  if (!isConfigured()) {
    console.warn("[Email] SMTP not configured. Skipping login alert for", to);
    return true;
  }

  try {
    await transporter.sendMail({
      from: `"LifeOS Security" <${process.env.SMTP_EMAIL}>`,
      to,
      subject: "LifeOS - New Login Detected",
      text: `New login detected.\n\nTime: ${time}\nIP: ${ip}\nDevice: ${userAgent}\n\nIf this wasn't you, change your password immediately.`,
      html: `
        <div style="max-width: 600px; margin: 40px auto; background: #fff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; font-family: -apple-system, sans-serif;">
          <div style="background: linear-gradient(135deg, #2563eb, #06b6d4); padding: 24px; text-align: center;">
            <h1 style="margin: 0; color: #fff; font-size: 22px;">New Login Alert</h1>
          </div>
          <div style="padding: 32px;">
            <p style="color: #475569;">A new login was detected on your account.</p>
            <div style="background: #f1f5f9; padding: 16px; border-radius: 8px; margin: 16px 0;">
              <p style="margin: 4px 0; font-size: 14px; color: #64748b;"><strong>Time:</strong> ${time}</p>
              <p style="margin: 4px 0; font-size: 14px; color: #64748b;"><strong>IP:</strong> ${ip}</p>
              <p style="margin: 4px 0; font-size: 14px; color: #64748b;"><strong>Device:</strong> ${userAgent}</p>
            </div>
            <p style="color: #dc2626; font-weight: 600;">If you don't recognize this, change your password immediately.</p>
          </div>
        </div>`,
    });
    return true;
  } catch (error) {
    console.error("[Email] Login alert failed:", error);
    return false;
  }
}

/**
 * Generate a random 6-digit code.
 */
export function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}
