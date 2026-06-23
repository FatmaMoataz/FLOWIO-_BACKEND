import nodemailer from 'nodemailer';

// -------------------------------------------------------------------
// Transport — swap the env vars in .env / Vercel dashboard
// Supports any SMTP provider (Gmail, Resend, Brevo, Mailgun, etc.)
// For Gmail: use an App Password, not your real password.
// -------------------------------------------------------------------
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,       // e.g. smtp.gmail.com
  port: Number(process.env.SMTP_PORT) || 587,
  secure: process.env.SMTP_SECURE === 'true', // true = 465, false = STARTTLS
  auth: {
    user: process.env.SMTP_USER,     // your sending address
    pass: process.env.SMTP_PASS,     // app password / API key
  },
});

// -------------------------------------------------------------------
// Shared HTML wrapper — keeps every email on-brand
// -------------------------------------------------------------------
const emailWrapper = (bodyHtml) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Flowio</title>
</head>
<body style="margin:0;padding:0;background:#020617;font-family:Inter,Arial,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#020617;padding:40px 16px">
    <tr>
      <td align="center">
        <table width="520" cellpadding="0" cellspacing="0"
          style="background:#060b24;border:1px solid rgba(100,207,255,.18);
                 border-radius:20px;overflow:hidden;max-width:100%">

          <!-- Header -->
          <tr>
            <td align="center" style="padding:32px 40px 24px">
              <span style="font-size:28px;font-weight:800;
                           background:linear-gradient(180deg,#4F8FE8,#64CFFF);
                           -webkit-background-clip:text;-webkit-text-fill-color:transparent;
                           display:inline-block">
                Flowio
              </span>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:0 40px 40px;color:#e0e6f0">
              ${bodyHtml}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:20px 40px;border-top:1px solid rgba(255,255,255,.07);
                       text-align:center;color:rgba(255,255,255,.35);font-size:12px">
              Flowio · Project management for modern teams<br/>
              If you did not request this email, you can safely ignore it.
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

// -------------------------------------------------------------------
// sendInvitationEmail
// Called after createInvitationService succeeds.
// inviteUrl  — full frontend URL e.g. https://flowio.app/invite/accept/<token>
// companyName — optional, shown in the email subject/body
// -------------------------------------------------------------------
export const sendInvitationEmail = async (toEmail, inviteUrl, companyName = 'a team') => {
  const subject = `You've been invited to join ${companyName} on Flowio`;

  const html = emailWrapper(`
    <h2 style="margin:0 0 12px;font-size:22px;font-weight:700;color:#fff">
      You're invited 🎉
    </h2>
    <p style="margin:0 0 20px;font-size:15px;line-height:1.6;color:rgba(255,255,255,.7)">
      Someone at <strong style="color:#fff">${companyName}</strong> has invited you to
      collaborate on Flowio. Click the button below to accept your invitation — the link
      is valid for <strong style="color:#fff">24 hours</strong>.
    </p>

    <a href="${inviteUrl}"
       style="display:inline-block;padding:14px 32px;background:#245df5;
              color:#fff;font-weight:700;font-size:15px;border-radius:12px;
              text-decoration:none;margin-bottom:24px">
      Accept invitation →
    </a>

    <p style="margin:0;font-size:13px;color:rgba(255,255,255,.4)">
      Or paste this link in your browser:<br/>
      <span style="color:rgba(100,207,255,.8);word-break:break-all">${inviteUrl}</span>
    </p>
  `);

  await transporter.sendMail({
    from: `"Flowio" <${process.env.SMTP_USER}>`,
    to: toEmail,
    subject,
    html,
  });
};

// -------------------------------------------------------------------
// sendWelcomeEmail (optional — call from auth signup controller)
// -------------------------------------------------------------------
export const sendWelcomeEmail = async (toEmail, userName) => {
  const html = emailWrapper(`
    <h2 style="margin:0 0 12px;font-size:22px;font-weight:700;color:#fff">
      Welcome to Flowio, ${userName}! 🚀
    </h2>
    <p style="margin:0 0 20px;font-size:15px;line-height:1.6;color:rgba(255,255,255,.7)">
      Your account is ready. Start by setting up your workspace or invite your teammates
      to get things flowing.
    </p>
    <a href="${process.env.FRONTEND_URL}/dashboard"
       style="display:inline-block;padding:14px 32px;background:#245df5;
              color:#fff;font-weight:700;font-size:15px;border-radius:12px;
              text-decoration:none">
      Go to dashboard →
    </a>
  `);

  await transporter.sendMail({
    from: `"Flowio" <${process.env.SMTP_USER}>`,
    to: toEmail,
    subject: 'Welcome to Flowio 🚀',
    html,
  });
};

export default { sendInvitationEmail, sendWelcomeEmail };