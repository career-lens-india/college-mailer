import { Children, type CSSProperties, type ReactNode } from "react";
import { emailImages } from "../../brand/assets.ts";
import { brand } from "../../brand/facts.ts";
import {
  FONT,
  INK,
  LINE,
  MIST,
  MUTED,
  NAVY,
  SERIF,
  TEAL,
  responsiveCss,
} from "./styles.ts";

const tableReset: CSSProperties = {
  borderCollapse: "collapse",
  width: "100%",
};

export function EmailDocument({
  preheader,
  background,
  children,
  embedded = false,
}: {
  preheader: string;
  background: string;
  children: ReactNode;
  embedded?: boolean;
}) {
  const preheaderNode = (
    <div
      style={{
        display: "none",
        maxHeight: 0,
        maxWidth: 0,
        overflow: "hidden",
        opacity: 0,
        color: background,
        fontSize: 1,
        lineHeight: "1px",
      }}
    >
      {preheader}
      {" \u200c ".repeat(12)}
    </div>
  );
  const frame = (
    <table
      role="presentation"
      width="100%"
      cellPadding={0}
      cellSpacing={0}
      border={0}
      bgcolor={background}
      style={{ ...tableReset, backgroundColor: background }}
    >
      <tbody>
        <tr>
          <td align="center" style={{ padding: "24px 12px" }}>
            {children}
          </td>
        </tr>
      </tbody>
    </table>
  );
  if (embedded) {
    return (
      <div
        style={{
          margin: 0,
          padding: 0,
          width: "100%",
          backgroundColor: background,
          fontFamily: FONT,
          color: INK,
        }}
      >
        {preheaderNode}
        {frame}
      </div>
    );
  }
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <title>CareerLens India</title>
        <style>{responsiveCss}</style>
      </head>
      <body
        style={{
          margin: 0,
          padding: 0,
          width: "100%",
          backgroundColor: background,
          fontFamily: FONT,
          color: INK,
        }}
      >
        {preheaderNode}
        {frame}
      </body>
    </html>
  );
}

export function EmailContainer({
  children,
  background = "#ffffff",
}: {
  children: ReactNode;
  background?: string;
}) {
  return (
    <table
      role="presentation"
      className="email-container"
      width="640"
      cellPadding={0}
      cellSpacing={0}
      border={0}
      bgcolor={background}
      style={{
        ...tableReset,
        width: "100%",
        maxWidth: 640,
        backgroundColor: background,
      }}
    >
      <tbody>{children}</tbody>
    </table>
  );
}

export function Section({
  children,
  padding = "8px 32px 24px",
  background,
}: {
  children: ReactNode;
  padding?: string;
  background?: string;
}) {
  return (
    <tr>
      <td
        className="px"
        bgcolor={background}
        style={{
          padding,
          backgroundColor: background,
          fontFamily: FONT,
          color: INK,
        }}
      >
        {children}
      </td>
    </tr>
  );
}

export function StackRow({ children }: { children: ReactNode }) {
  const cells = Children.toArray(children);
  const width = `${Math.floor(100 / Math.max(cells.length, 1))}%`;

  return (
    <table role="presentation" width="100%" cellPadding={0} cellSpacing={0} border={0} style={tableReset}>
      <tbody>
        <tr>
          {cells.map((cell, index) => (
            <td
              key={index}
              className="stack"
              width={width}
              valign="top"
              style={{ width, verticalAlign: "top" }}
            >
              <table role="presentation" width="100%" cellPadding={0} cellSpacing={0} border={0} style={tableReset}>
                <tbody>
                  <tr>
                    <td style={{ padding: 6 }}>{cell}</td>
                  </tr>
                </tbody>
              </table>
            </td>
          ))}
        </tr>
      </tbody>
    </table>
  );
}

export function EmailLogo({ width = 228 }: { width?: number }) {
  const height = Math.round(width * (400 / 920));
  return (
    <img
      src={emailImages.logoUrl}
      alt={emailImages.logoAlt}
      width={width}
      height={height}
      style={{
        display: "block",
        width: `${width}px`,
        maxWidth: "100%",
        height: "auto",
        border: 0,
      }}
    />
  );
}

export function EmailBanner() {
  return (
    <img
      src={emailImages.bannerUrl}
      alt={emailImages.bannerAlt}
      width={640}
      style={{
        display: "block",
        width: "100%",
        maxWidth: "640px",
        height: "auto",
        border: 0,
      }}
    />
  );
}

export function Salutation({
  greeting,
  designation,
  color = NAVY,
}: {
  greeting: string;
  designation: string | null;
  color?: string;
}) {
  return (
    <>
      <p
        style={{
          margin: 0,
          fontFamily: FONT,
          fontSize: 16,
          lineHeight: "24px",
          fontWeight: 700,
          color,
        }}
      >
        {greeting}
      </p>
      {designation ? (
        <p
          style={{
            margin: "4px 0 0",
            fontFamily: FONT,
            fontSize: 14,
            lineHeight: "20px",
            color: MUTED,
          }}
        >
          {designation}
        </p>
      ) : null}
    </>
  );
}

export function Paragraph({
  children,
  style,
}: {
  children: ReactNode;
  style?: CSSProperties;
}) {
  return (
    <p
      style={{
        margin: "0 0 14px",
        fontFamily: FONT,
        fontSize: 16,
        lineHeight: "26px",
        color: INK,
        ...style,
      }}
    >
      {children}
    </p>
  );
}

export function Heading({
  children,
  serif = false,
  color = NAVY,
  size = 30,
}: {
  children: ReactNode;
  serif?: boolean;
  color?: string;
  size?: number;
}) {
  return (
    <h1
      className="h1"
      style={{
        margin: 0,
        fontFamily: serif ? SERIF : FONT,
        fontSize: size,
        lineHeight: `${size + 8}px`,
        fontWeight: 700,
        color,
      }}
    >
      {children}
    </h1>
  );
}

export function SectionTitle({ children, color = NAVY }: { children: ReactNode; color?: string }) {
  return (
    <h2
      style={{
        margin: "0 0 12px",
        fontFamily: FONT,
        fontSize: 18,
        lineHeight: "24px",
        fontWeight: 700,
        color,
      }}
    >
      {children}
    </h2>
  );
}

export function EmailButton({
  href,
  label,
  background = NAVY,
  color = "#ffffff",
}: {
  href: string;
  label: string;
  background?: string;
  color?: string;
}) {
  return (
    <table role="presentation" cellPadding={0} cellSpacing={0} border={0} style={{ borderCollapse: "collapse" }}>
      <tbody>
        <tr>
          <td align="center" bgcolor={background} style={{ backgroundColor: background, borderRadius: 8 }}>
            <a
              href={href}
              style={{
                display: "inline-block",
                padding: "14px 26px",
                fontFamily: FONT,
                fontSize: 15,
                lineHeight: "20px",
                fontWeight: 700,
                color,
                textDecoration: "none",
              }}
            >
              {label}
            </a>
          </td>
        </tr>
      </tbody>
    </table>
  );
}

export function TextCard({
  title,
  body,
  accent = TEAL,
  background = MIST,
}: {
  title: string;
  body?: string;
  accent?: string;
  background?: string;
}) {
  return (
    <table role="presentation" width="100%" cellPadding={0} cellSpacing={0} border={0} style={tableReset}>
      <tbody>
        <tr>
          <td
            bgcolor={background}
            style={{
              backgroundColor: background,
              borderTop: `3px solid ${accent}`,
              padding: "14px 14px 16px",
            }}
          >
            <p
              style={{
                margin: 0,
                fontFamily: FONT,
                fontSize: 14,
                lineHeight: "20px",
                fontWeight: 700,
                color: NAVY,
              }}
            >
              {title}
            </p>
            {body ? (
              <p
                style={{
                  margin: "6px 0 0",
                  fontFamily: FONT,
                  fontSize: 13,
                  lineHeight: "19px",
                  color: MUTED,
                }}
              >
                {body}
              </p>
            ) : null}
          </td>
        </tr>
      </tbody>
    </table>
  );
}

export function Hairline({ color = LINE }: { color?: string }) {
  return (
    <table role="presentation" width="100%" cellPadding={0} cellSpacing={0} border={0} style={tableReset}>
      <tbody>
        <tr>
          <td style={{ borderTop: `1px solid ${color}`, fontSize: 0, lineHeight: 0, height: 1 }}>
            &nbsp;
          </td>
        </tr>
      </tbody>
    </table>
  );
}

export function ContactBlock({ color, linkColor }: { color: string; linkColor: string }) {
  const line: CSSProperties = {
    margin: "0 0 6px",
    fontFamily: FONT,
    fontSize: 14,
    lineHeight: "20px",
    color,
  };

  return (
    <>
      <p style={{ ...line, fontWeight: 700, color }}>{brand.contactName}</p>
      <p style={line}>{brand.contactRole}</p>
      <p style={{ ...line, marginBottom: 12 }}>{brand.focus}</p>
      <p style={line}>
        <a href={brand.phoneHref} style={{ color: linkColor, textDecoration: "underline" }}>
          {brand.phoneDisplay}
        </a>
      </p>
      <p style={line}>
        <a href={brand.websiteUrl} style={{ color: linkColor, textDecoration: "underline" }}>
          {brand.websiteLabel}
        </a>
      </p>
      <p style={{ ...line, marginBottom: 0 }}>
        <a href={brand.campusImpactUrl} style={{ color: linkColor, textDecoration: "underline" }}>
          Campus impact
        </a>
      </p>
    </>
  );
}

export function BulletList({ items }: { items: readonly string[] }) {
  return (
    <table role="presentation" width="100%" cellPadding={0} cellSpacing={0} border={0} style={tableReset}>
      <tbody>
        {items.map((item) => (
          <tr key={item}>
            <td width="18" valign="top" style={{ width: 18, padding: "8px 0 0" }}>
              <table role="presentation" cellPadding={0} cellSpacing={0} border={0}>
                <tbody>
                  <tr>
                    <td
                      width="7"
                      height="7"
                      bgcolor={TEAL}
                      style={{
                        width: 7,
                        height: 7,
                        backgroundColor: TEAL,
                        fontSize: 0,
                        lineHeight: 0,
                      }}
                    >
                      &nbsp;
                    </td>
                  </tr>
                </tbody>
              </table>
            </td>
            <td valign="top" style={{ padding: "2px 0 8px", fontFamily: FONT, fontSize: 16, lineHeight: "24px", color: INK }}>
              {item}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export { SERIF };
