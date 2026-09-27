import { brand } from "../../brand/facts.ts";
import { applyPersonalizationTokens } from "../../lib/tokens.ts";
import { defaultBranding, type EmailTemplateData } from "../../types/outreach.ts";
import { EmailBanner, EmailContainer, EmailDocument, EmailLogo } from "../email/layout.tsx";
import { MailFooter } from "../email/rich.tsx";
import { FONT, INK, MUTED, NAVY } from "../email/styles.ts";

function MessageBody({ text }: { text: string }) {
  const blocks = text.split(/\n{2,}/).map((block) => block.trim()).filter(Boolean);
  if (blocks.length === 0) return null;
  return blocks.map((block, index) => {
    const lines = block.split("\n");
    return (
      <p
        key={index}
        style={{
          margin: index === blocks.length - 1 ? 0 : "0 0 16px",
          fontFamily: FONT,
          fontSize: 15,
          lineHeight: "24px",
          color: INK,
        }}
      >
        {lines.map((line, lineIndex) => (
          <span key={lineIndex}>
            {lineIndex > 0 ? <br /> : null}
            {line}
          </span>
        ))}
      </p>
    );
  });
}

export function CustomEmail({ data, embedded = false }: { data: EmailTemplateData; embedded?: boolean }) {
  const branding = data.branding ?? defaultBranding;
  const message = applyPersonalizationTokens(data.customMessage ?? "", data).trim();
  const preheader = message.replace(/\s+/g, " ").slice(0, 140) || "A note from CareerLens India.";

  return (
    <EmailDocument preheader={preheader} background="#eef3f6" embedded={embedded}>
      <EmailContainer>
        {branding.logo ? (
          <tr>
            <td style={{ padding: "18px 28px 8px", backgroundColor: "#ffffff" }}>
              <EmailLogo width={188} />
            </td>
          </tr>
        ) : null}
        {branding.banner ? (
          <tr>
            <td style={{ padding: branding.logo ? "8px 0 0" : 0, backgroundColor: "#ffffff" }}>
              <EmailBanner />
            </td>
          </tr>
        ) : null}
        <tr>
          <td style={{ padding: "28px 28px 8px", backgroundColor: "#ffffff" }}>
            <MessageBody text={message} />
          </td>
        </tr>
        {branding.signature ? (
          <tr>
            <td style={{ padding: "8px 28px 24px", backgroundColor: "#ffffff", fontFamily: FONT }}>
              <p style={{ margin: "0 0 2px", fontSize: 15, lineHeight: "22px", fontWeight: 700, color: NAVY }}>
                {brand.contactName}
              </p>
              <p style={{ margin: "0 0 8px", fontSize: 13, lineHeight: "20px", color: MUTED }}>{brand.contactRole}</p>
              <p style={{ margin: "0 0 2px", fontSize: 13, lineHeight: "20px", color: INK }}>{brand.phoneDisplay}</p>
              <p style={{ margin: 0, fontSize: 13, lineHeight: "20px" }}>
                <a href={brand.emailHref} style={{ color: "#0e7c84", textDecoration: "none" }}>
                  {brand.email}
                </a>
              </p>
            </td>
          </tr>
        ) : null}
        {branding.footer ? <MailFooter showFounder={false} /> : null}
      </EmailContainer>
    </EmailDocument>
  );
}
