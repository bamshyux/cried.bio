import { getSiteUrl } from "@/lib/site";

type EmailLayoutOptions = {
  preheader?: string;
  bodyHtml: string;
};

export function renderEmailLayout({ preheader, bodyHtml }: EmailLayoutOptions): string {
  const siteUrl = getSiteUrl();

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>BioForge</title>
</head>
<body style="margin:0;padding:0;background:#090909;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  ${preheader ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(preheader)}</div>` : ""}
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#090909;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#111111;border:1px solid #222222;border-radius:12px;">
          <tr>
            <td style="padding:28px 32px 8px;">
              <a href="${siteUrl}" style="font-size:18px;font-weight:700;color:#00e5cc;text-decoration:none;">BioForge</a>
            </td>
          </tr>
          <tr>
            <td style="padding:8px 32px 32px;color:#e5e5e5;font-size:15px;line-height:1.6;">
              ${bodyHtml}
            </td>
          </tr>
        </table>
        <p style="margin:20px 0 0;font-size:12px;color:#737373;line-height:1.5;">
          You received this email from BioForge. If you did not expect it, you can ignore this message.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function emailButton(href: string, label: string): string {
  return `<p style="margin:24px 0 0;">
    <a href="${href}" style="display:inline-block;background:#00e5cc;color:#090909;font-weight:600;text-decoration:none;padding:12px 20px;border-radius:8px;font-size:14px;">${escapeHtml(label)}</a>
  </p>`;
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
