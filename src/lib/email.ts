/**
 * Simple email helper.
 * Configure via env:
 *   SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, EMAIL_FROM
 * If not configured, emails are logged to console (dev-friendly).
 */

type SendEmailOpts = {
  to: string;
  subject: string;
  html: string;
  text?: string;
};

export async function sendEmail({ to, subject, html, text }: SendEmailOpts) {
  const host = process.env.SMTP_HOST;
  const from = process.env.EMAIL_FROM || "Bookme <noreply@bookme.app>";

  if (!host) {
    console.log("📧 [email not configured – logged only]");
    console.log(`   To: ${to}`);
    console.log(`   Subject: ${subject}`);
    console.log(`   Body:\n${text || html.replace(/<[^>]+>/g, " ")}`);
    return { ok: true, logged: true };
  }

  // Dynamic import so the app still builds without nodemailer installed
  try {
    const nodemailer = await import("nodemailer");
    const transporter = nodemailer.createTransport({
      host,
      port: Number(process.env.SMTP_PORT || 587),
      secure: process.env.SMTP_SECURE === "true",
      auth: process.env.SMTP_USER
        ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
        : undefined,
    });

    await transporter.sendMail({
      from,
      to,
      subject,
      html,
      text: text || html.replace(/<[^>]+>/g, " "),
    });

    return { ok: true };
  } catch (err: any) {
    console.error("Failed to send email:", err.message);
    // Fallback: still log so credentials aren't lost
    console.log(`📧 FALLBACK LOG → ${to}: ${subject}`);
    console.log(text || html);
    return { ok: false, error: err.message };
  }
}

export async function sendWelcomeEmail(opts: {
  to: string;
  restaurantName: string;
  slug: string;
  tempPassword: string;
  loginUrl: string;
}) {
  const { to, restaurantName, slug, tempPassword, loginUrl } = opts;

  const subject = `Welcome to Bookme – ${restaurantName} is ready`;
  const text = `
Welcome to Bookme!

Your restaurant "${restaurantName}" has been created.

Login URL: ${loginUrl}
Email: ${to}
Temporary password: ${tempPassword}

Please sign in and change your password as soon as possible.
Then configure your logo, colors, sections and tables under Settings.

Public booking page: ${loginUrl.replace("/login", "/book")}

— The Bookme team
`.trim();

  const html = `
<!DOCTYPE html>
<html>
<body style="font-family: Inter, system-ui, sans-serif; color: #0f172a; line-height: 1.5;">
  <h1 style="color: #0f766e;">Welcome to Bookme</h1>
  <p>Your restaurant <strong>${restaurantName}</strong> has been created.</p>
  <table style="margin: 24px 0; border-collapse: collapse;">
    <tr><td style="padding: 4px 12px 4px 0; color: #64748b;">Login</td><td><a href="${loginUrl}">${loginUrl}</a></td></tr>
    <tr><td style="padding: 4px 12px 4px 0; color: #64748b;">Email</td><td>${to}</td></tr>
    <tr><td style="padding: 4px 12px 4px 0; color: #64748b;">Temp password</td><td><code style="background:#f1f5f9;padding:2px 6px;border-radius:4px;">${tempPassword}</code></td></tr>
  </table>
  <p>Please sign in and change your password. Then set up your logo, colors, sections and tables.</p>
  <p style="color:#64748b;font-size:14px;">Slug: <code>${slug}</code></p>
</body>
</html>
`.trim();

  return sendEmail({ to, subject, html, text });
}
