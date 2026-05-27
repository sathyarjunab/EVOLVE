export function newAccountEmail(
  name: string,
  email: string,
  password: string,
  loginUrl: string,
): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Welcome to Evolve</title>
</head>
<body style="margin:0;padding:0;background-color:#1B1B1F;font-family:'Manrope',Arial,Helvetica,sans-serif;-webkit-font-smoothing:antialiased;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#1B1B1F;">
    <tr>
      <td align="center" style="padding:48px 16px;">

        <!-- Card -->
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:480px;background-color:#232327;border:1px solid #38383F;border-radius:18px;">

          <!-- Top gradient bar -->
          <tr>
            <td style="height:4px;background:linear-gradient(90deg,#7B6EF5 0%,#C8FF4D 100%);border-radius:18px 18px 0 0;font-size:0;line-height:0;">&nbsp;</td>
          </tr>

          <!-- Main content -->
          <tr>
            <td style="padding:40px 40px 32px;">

              <!-- Icon -->
              <table cellpadding="0" cellspacing="0" border="0" style="margin:0 auto 28px;">
                <tr>
                  <td align="center" style="width:56px;height:56px;background-color:#0D0D10;border:1px solid #2A2A2F;border-radius:14px;padding:16px;line-height:0;">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" stroke="#C8FF4D" stroke-width="1.5"/>
                      <path d="M8 12l3 3 5-5" stroke="#C8FF4D" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                  </td>
                </tr>
              </table>

              <!-- Heading -->
              <h1 style="margin:0 0 10px;font-family:'Outfit',Arial,Helvetica,sans-serif;font-size:26px;font-weight:800;color:#FFFFFF;text-align:center;letter-spacing:-0.5px;line-height:1.2;">
                Welcome to Evolve
              </h1>

              <!-- Greeting -->
              <p style="margin:0 0 28px;font-size:14px;color:#9898A5;text-align:center;line-height:1.7;">
                Hey <strong style="color:#FFFFFF;">${name}</strong>, your purchase was successful and your account is ready. Use the credentials below to log in.
              </p>

              <!-- Credentials box -->
              <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom:20px;">
                <tr>
                  <td style="padding:18px 20px;background-color:#2A2A2F;border:1px solid #38383F;border-radius:10px;">
                    <p style="margin:0 0 4px;font-size:11px;color:#55555F;text-transform:uppercase;letter-spacing:1px;">Email</p>
                    <p style="margin:0 0 16px;font-size:14px;color:#FFFFFF;font-weight:600;">${email}</p>
                    <p style="margin:0 0 4px;font-size:11px;color:#55555F;text-transform:uppercase;letter-spacing:1px;">Temporary Password</p>
                    <p style="margin:0;font-size:18px;color:#C8FF4D;font-weight:700;letter-spacing:3px;font-family:'Courier New',monospace;">${password}</p>
                  </td>
                </tr>
              </table>

              <!-- Info box -->
              <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom:28px;">
                <tr>
                  <td style="padding:14px 18px;background-color:#2A2A2F;border:1px solid #38383F;border-radius:10px;font-size:13px;color:#9898A5;text-align:center;line-height:1.7;">
                    For your security, please <strong style="color:#FFFFFF;">change your password</strong> after your first login.
                  </td>
                </tr>
              </table>

              <!-- CTA Button -->
              <table cellpadding="0" cellspacing="0" border="0" style="margin:0 auto 32px;">
                <tr>
                  <td align="center" style="border-radius:10px;background-color:#C8FF4D;box-shadow:0 4px 24px rgba(200,255,77,0.2);">
                    <a href="${loginUrl}" target="_blank" style="display:inline-block;padding:14px 44px;font-family:'Outfit',Arial,Helvetica,sans-serif;font-size:15px;font-weight:700;color:#111117;text-decoration:none;letter-spacing:0.3px;border-radius:10px;white-space:nowrap;">
                      Log In to Evolve &rarr;
                    </a>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:20px 40px 28px;background-color:#1B1B1F;border-top:1px solid #38383F;border-radius:0 0 18px 18px;text-align:center;">
              <p style="margin:0 0 8px;font-family:'Outfit',Arial,Helvetica,sans-serif;font-size:16px;font-weight:700;color:#C8FF4D;letter-spacing:2px;">
                EVOLVE
              </p>
              <p style="margin:0;font-size:11px;color:#55555F;line-height:1.7;">
                &copy; 2026 Evolve. All rights reserved.<br/>
                You received this because you purchased an Evolve plan.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function resetPasswordEmail(name: string, resetUrl: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Reset Your Password — Evolve</title>
</head>
<body style="margin:0;padding:0;background-color:#1B1B1F;font-family:'Manrope',Arial,Helvetica,sans-serif;-webkit-font-smoothing:antialiased;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#1B1B1F;">
    <tr>
      <td align="center" style="padding:48px 16px;">

        <!-- Card -->
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:480px;background-color:#232327;border:1px solid #38383F;border-radius:18px;">

          <!-- Top gradient bar -->
          <tr>
            <td style="height:4px;background:linear-gradient(90deg,#7B6EF5 0%,#C8FF4D 100%);border-radius:18px 18px 0 0;font-size:0;line-height:0;">&nbsp;</td>
          </tr>

          <!-- Main content -->
          <tr>
            <td style="padding:40px 40px 32px;">

              <!-- Icon -->
              <table cellpadding="0" cellspacing="0" border="0" style="margin:0 auto 28px;">
                <tr>
                  <td align="center" style="width:56px;height:56px;background-color:#0D0D10;border:1px solid #2A2A2F;border-radius:14px;padding:16px;line-height:0;">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <rect x="5" y="11" width="14" height="10" rx="2" stroke="#C8FF4D" stroke-width="1.5"/>
                      <path d="M8 11V7a4 4 0 018 0v4" stroke="#C8FF4D" stroke-width="1.5" stroke-linecap="round"/>
                      <circle cx="12" cy="16" r="1.5" fill="#C8FF4D"/>
                    </svg>
                  </td>
                </tr>
              </table>

              <!-- Heading -->
              <h1 style="margin:0 0 10px;font-family:'Outfit',Arial,Helvetica,sans-serif;font-size:26px;font-weight:800;color:#FFFFFF;text-align:center;letter-spacing:-0.5px;line-height:1.2;">
                Reset your password
              </h1>

              <!-- Greeting -->
              <p style="margin:0 0 28px;font-size:14px;color:#9898A5;text-align:center;line-height:1.7;">
                Hey <strong style="color:#FFFFFF;">${name}</strong>, we received a request to reset the password for your Evolve account.
              </p>

              <!-- Info box -->
              <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom:28px;">
                <tr>
                  <td style="padding:14px 18px;background-color:#2A2A2F;border:1px solid #38383F;border-radius:10px;font-size:13px;color:#9898A5;text-align:center;line-height:1.7;">
                    This link will expire in <strong style="color:#C8FF4D;">1 hour</strong>. If you didn&apos;t request this, you can safely ignore this email.
                  </td>
                </tr>
              </table>

              <!-- CTA Button -->
              <table cellpadding="0" cellspacing="0" border="0" style="margin:0 auto 32px;">
                <tr>
                  <td align="center" style="border-radius:10px;background-color:#C8FF4D;box-shadow:0 4px 24px rgba(200,255,77,0.2);">
                    <a href="${resetUrl}" target="_blank" style="display:inline-block;padding:14px 44px;font-family:'Outfit',Arial,Helvetica,sans-serif;font-size:15px;font-weight:700;color:#111117;text-decoration:none;letter-spacing:0.3px;border-radius:10px;white-space:nowrap;">
                      Reset Password &rarr;
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Divider -->
              <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom:20px;">
                <tr>
                  <td style="height:1px;background-color:#38383F;font-size:0;line-height:0;">&nbsp;</td>
                </tr>
              </table>

              <!-- Fallback link -->
              <p style="margin:0;font-size:11px;color:#55555F;text-align:center;line-height:1.8;">
                If the button doesn&apos;t work, paste this URL into your browser:<br/>
                <a href="${resetUrl}" style="color:#7B6EF5;word-break:break-all;text-decoration:none;">${resetUrl}</a>
              </p>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:20px 40px 28px;background-color:#1B1B1F;border-top:1px solid #38383F;border-radius:0 0 18px 18px;text-align:center;">
              <p style="margin:0 0 8px;font-family:'Outfit',Arial,Helvetica,sans-serif;font-size:16px;font-weight:700;color:#C8FF4D;letter-spacing:2px;">
                EVOLVE
              </p>
              <p style="margin:0;font-size:11px;color:#55555F;line-height:1.7;">
                &copy; 2026 Evolve. All rights reserved.<br/>
                You received this because a password reset was requested for your account.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
