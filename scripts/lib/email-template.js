// Pure email template module — no I/O, no imports, no network.
// This is the ONE legitimate inline-style exception: email clients require
// table-based layouts with inline styles (CSS Module rules target the React app).

/**
 * Escape a string for safe inclusion in HTML.
 * Handles & < > " ' — sufficient for display names and URLs in attribute values.
 * @param {string} str
 * @returns {string}
 */
function htmlEscape(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Render a personalized save-the-date invitation email.
 *
 * @param {{ displayName: string, url: string }} opts
 * @returns {{ subject: string, html: string, text: string }}
 */
export function renderInvite({ displayName, url }) {
  const subject = "You're invited — Rina & Aaron";

  const escapedName = htmlEscape(displayName);
  const escapedUrl = htmlEscape(url);

  // ---------------------------------------------------------------------------
  // HTML — email-client-safe table layout with inline styles
  // Palette: bg #0B1610, gold #BF9B5A, gold-light #D4B57A, cream #EAE0CB
  // NO date, NO location (deliberately removed per user decision)
  // ---------------------------------------------------------------------------
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${htmlEscape(subject)}</title>
</head>
<body style="margin:0;padding:0;background-color:#0B1610;font-family:Georgia,serif;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0"
         style="background-color:#0B1610;min-height:100vh;">
    <tr>
      <td align="center" style="padding:48px 16px;">
        <table width="600" cellpadding="0" cellspacing="0" border="0"
               style="max-width:600px;width:100%;">

          <!-- Guest greeting -->
          <tr>
            <td align="center" style="padding-bottom:8px;">
              <p style="margin:0;font-family:Georgia,serif;font-size:13px;
                         letter-spacing:0.15em;text-transform:uppercase;
                         color:#BF9B5A;">For</p>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding-bottom:32px;">
              <p style="margin:0;font-family:Georgia,serif;font-size:22px;
                         color:#D4B57A;font-style:italic;">${escapedName}</p>
            </td>
          </tr>

          <!-- Save the Date label -->
          <tr>
            <td align="center" style="padding-bottom:16px;">
              <p style="margin:0;font-family:Georgia,serif;font-size:11px;
                         letter-spacing:0.25em;text-transform:uppercase;
                         color:#BF9B5A;">Save the Date</p>
            </td>
          </tr>

          <!-- Couple names -->
          <tr>
            <td align="center" style="padding-bottom:32px;">
              <p style="margin:0;font-family:Georgia,serif;font-size:36px;
                         color:#D4B57A;font-style:italic;">Rina &amp; Aaron</p>
            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td align="center" style="padding-bottom:32px;">
              <table width="80" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="border-top:1px solid #BF9B5A;font-size:0;line-height:0;">&nbsp;</td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- CTA button -->
          <tr>
            <td align="center" style="padding-bottom:40px;">
              <a href="${escapedUrl}"
                 style="display:inline-block;padding:14px 32px;
                        background-color:#BF9B5A;color:#0B1610;
                        font-family:Georgia,serif;font-size:13px;
                        letter-spacing:0.12em;text-transform:uppercase;
                        text-decoration:none;font-weight:bold;
                        border-radius:2px;">
                View your Save the Date
              </a>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center">
              <p style="margin:0;font-family:Georgia,serif;font-size:12px;
                         color:#72685A;font-style:italic;">
                A formal invitation to follow.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  // ---------------------------------------------------------------------------
  // Plain text fallback — same content, no HTML
  // ---------------------------------------------------------------------------
  const text = [
    `For ${displayName}`,
    '',
    'SAVE THE DATE',
    '',
    'Rina & Aaron',
    '',
    'View your Save the Date:',
    url,
    '',
    'A formal invitation to follow.',
  ].join('\n');

  return { subject, html, text };
}
