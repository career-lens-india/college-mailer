import type { CSSProperties, ReactNode } from "react";
import { brand, engagements } from "../../brand/facts.ts";
import { FONT, MUTED, NAVY, ORANGE, TEAL } from "./styles.ts";
import { EmailLogo } from "./layout.tsx";

const reset: CSSProperties = { borderCollapse: "collapse", width: "100%" };

export type IconItem = {
  symbol: string;
  label: string;
  color: string;
};

export function BrandBar({ trail }: { trail: string }) {
  return (
    <tr>
      <td style={{ padding: "16px 22px", backgroundColor: "#ffffff" }}>
        <table role="presentation" width="100%" cellPadding={0} cellSpacing={0} border={0} style={reset}>
          <tbody>
            <tr>
              <td width="210" valign="middle" style={{ width: 210 }}>
                <EmailLogo width={188} />
              </td>
              <td
                valign="middle"
                align="right"
                style={{
                  fontFamily: FONT,
                  fontSize: 11,
                  lineHeight: "16px",
                  color: MUTED,
                  textAlign: "right",
                }}
              >
                {trail}
              </td>
            </tr>
          </tbody>
        </table>
      </td>
    </tr>
  );
}

export function SplitHero({
  panel,
  kicker,
  title,
  subtitle,
  imageUrl,
  imageAlt,
  textColor = "#ffffff",
}: {
  panel: string;
  kicker: string;
  title: string;
  subtitle: string;
  imageUrl: string;
  imageAlt: string;
  textColor?: string;
}) {
  return (
    <tr>
      <td style={{ padding: 0, backgroundColor: panel }}>
        <table role="presentation" width="100%" cellPadding={0} cellSpacing={0} border={0} style={reset}>
          <tbody>
            <tr>
              <td
                className="stack"
                width="54%"
                valign="middle"
                bgcolor={panel}
                style={{ width: "54%", backgroundColor: panel, padding: "28px 24px" }}
              >
                {kicker ? (
                  <p
                    style={{
                      margin: "0 0 10px",
                      fontFamily: FONT,
                      fontSize: 12,
                      lineHeight: "18px",
                      fontWeight: 700,
                      letterSpacing: "0.04em",
                      textTransform: "uppercase",
                      color: textColor,
                      opacity: 0.9,
                    }}
                  >
                    {kicker}
                  </p>
                ) : null}
                {title ? (
                  <h1
                    className="h1"
                    style={{
                      margin: 0,
                      fontFamily: FONT,
                      fontSize: 30,
                      lineHeight: "36px",
                      fontWeight: 700,
                      color: textColor,
                    }}
                  >
                    {title}
                  </h1>
                ) : null}
                {subtitle ? (
                  <p
                    style={{
                      margin: "12px 0 0",
                      fontFamily: FONT,
                      fontSize: 14,
                      lineHeight: "21px",
                      color: textColor,
                    }}
                  >
                    {subtitle}
                  </p>
                ) : null}
              </td>
              <td className="stack" width="46%" valign="middle" style={{ width: "46%", fontSize: 0, lineHeight: 0 }}>
                <img
                  src={imageUrl}
                  alt={imageAlt}
                  width={300}
                  style={{ display: "block", width: "100%", maxWidth: "100%", height: "auto", border: 0 }}
                />
              </td>
            </tr>
          </tbody>
        </table>
      </td>
    </tr>
  );
}

export function PhotoHero({
  imageUrl,
  imageAlt,
  kicker,
  title,
  subtitle,
  band = NAVY,
}: {
  imageUrl: string;
  imageAlt: string;
  kicker?: string;
  title: string;
  subtitle: string;
  band?: string;
}) {
  return (
    <>
      <tr>
        <td style={{ padding: 0, fontSize: 0, lineHeight: 0, backgroundColor: band }}>
          <img
            src={imageUrl}
            alt={imageAlt}
            width={640}
            style={{ display: "block", width: "100%", maxWidth: "640px", height: "auto", border: 0 }}
          />
        </td>
      </tr>
      <tr>
        <td bgcolor={band} style={{ backgroundColor: band, padding: "22px 26px 24px" }}>
          {kicker ? (
            <p
              style={{
                margin: "0 0 8px",
                fontFamily: FONT,
                fontSize: 12,
                lineHeight: "16px",
                fontWeight: 700,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: "#9fd4ff",
              }}
            >
              {kicker}
            </p>
          ) : null}
          {title ? (
            <h1
              className="h1"
              style={{
                margin: 0,
                fontFamily: FONT,
                fontSize: 30,
                lineHeight: "36px",
                fontWeight: 700,
                color: "#ffffff",
              }}
            >
              {title}
            </h1>
          ) : null}
          {subtitle ? (
            <p
              style={{
                margin: "10px 0 0",
                fontFamily: FONT,
                fontSize: 14,
                lineHeight: "21px",
                color: "#d6e4f5",
              }}
            >
              {subtitle}
            </p>
          ) : null}
        </td>
      </tr>
    </>
  );
}

export function IconRow({ items, background = "#ffffff" }: { items: readonly IconItem[]; background?: string }) {
  const width = `${Math.floor(100 / items.length)}%`;
  return (
    <tr>
      <td bgcolor={background} style={{ backgroundColor: background, padding: "18px 14px 8px" }}>
        <table role="presentation" width="100%" cellPadding={0} cellSpacing={0} border={0} style={reset}>
          <tbody>
            <tr>
              {items.map((item) => (
                <td
                  key={item.label}
                  className="stack"
                  width={width}
                  valign="top"
                  align="center"
                  style={{ width, padding: "6px 4px 12px", textAlign: "center" }}
                >
                  <IconMark symbol={item.symbol} color={item.color} />
                  <p
                    style={{
                      margin: "8px 0 0",
                      fontFamily: FONT,
                      fontSize: 12,
                      lineHeight: "16px",
                      fontWeight: 700,
                      color: NAVY,
                    }}
                  >
                    {item.label}
                  </p>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </td>
    </tr>
  );
}

export function PillRow({ labels }: { labels: readonly string[] }) {
  return (
    <tr>
      <td bgcolor={NAVY} style={{ backgroundColor: NAVY, padding: "0 22px 22px" }}>
        <table role="presentation" cellPadding={0} cellSpacing={0} border={0}>
          <tbody>
            <tr>
              {labels.map((label) => (
                <td key={label} style={{ padding: "0 8px 8px 0" }}>
                  <span
                    style={{
                      display: "inline-block",
                      padding: "7px 12px",
                      borderRadius: 999,
                      backgroundColor: "rgba(255,255,255,0.14)",
                      border: "1px solid rgba(255,255,255,0.28)",
                      fontFamily: FONT,
                      fontSize: 12,
                      lineHeight: "16px",
                      fontWeight: 700,
                      color: "#ffffff",
                    }}
                  >
                    {label}
                  </span>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </td>
    </tr>
  );
}

function IconMark({ symbol, color }: { symbol: string; color: string }) {
  return (
    <table role="presentation" cellPadding={0} cellSpacing={0} border={0} align="center">
      <tbody>
        <tr>
          <td
            width="42"
            height="42"
            align="center"
            valign="middle"
            bgcolor={color}
            style={{
              width: 42,
              height: 42,
              backgroundColor: color,
              borderRadius: 21,
              color: "#ffffff",
              fontFamily: FONT,
              fontSize: 18,
              lineHeight: "42px",
              fontWeight: 700,
              textAlign: "center",
            }}
          >
            {symbol}
          </td>
        </tr>
      </tbody>
    </table>
  );
}

export function SectionHeading({ children }: { children: ReactNode }) {
  return (
    <h2
      style={{
        margin: "0 0 14px",
        fontFamily: FONT,
        fontSize: 20,
        lineHeight: "26px",
        fontWeight: 700,
        color: NAVY,
      }}
    >
      {children}
    </h2>
  );
}

export function TopicGrid({
  items,
}: {
  items: readonly { title: string; body?: string; color: string; symbol: string }[];
}) {
  const rows: (typeof items)[number][][] = [];
  for (let index = 0; index < items.length; index += 2) rows.push(items.slice(index, index + 2));

  return (
    <table role="presentation" width="100%" cellPadding={0} cellSpacing={0} border={0} style={reset}>
      <tbody>
        {rows.map((row) => (
          <tr key={row.map((item) => item.title).join()}>
            {row.map((item) => (
              <td key={item.title} className="stack" width="50%" valign="top" style={{ width: "50%", padding: 6 }}>
                <table role="presentation" width="100%" cellPadding={0} cellSpacing={0} border={0} style={reset}>
                  <tbody>
                    <tr>
                      <td
                        bgcolor="#f4f7fb"
                        style={{
                          backgroundColor: "#f4f7fb",
                          borderRadius: 12,
                          padding: "14px 12px",
                        }}
                      >
                        <table role="presentation" cellPadding={0} cellSpacing={0} border={0}>
                          <tbody>
                            <tr>
                              <td valign="middle" style={{ paddingRight: 10 }}>
                                <IconMark symbol={item.symbol} color={item.color} />
                              </td>
                              <td valign="middle">
                                <p
                                  style={{
                                    margin: 0,
                                    fontFamily: FONT,
                                    fontSize: 13,
                                    lineHeight: "18px",
                                    fontWeight: 700,
                                    color: NAVY,
                                  }}
                                >
                                  {item.title}
                                </p>
                                {item.body ? (
                                  <p
                                    style={{
                                      margin: "4px 0 0",
                                      fontFamily: FONT,
                                      fontSize: 12,
                                      lineHeight: "17px",
                                      color: MUTED,
                                    }}
                                  >
                                    {item.body}
                                  </p>
                                ) : null}
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export function EngagementCards() {
  return (
    <table role="presentation" width="100%" cellPadding={0} cellSpacing={0} border={0} style={reset}>
      <tbody>
        <tr>
          {engagements.map((engagement) => (
            <td
              key={engagement.institution}
              className="stack"
              width="50%"
              valign="top"
              style={{ width: "50%", padding: 6 }}
            >
              <table
                role="presentation"
                width="100%"
                cellPadding={0}
                cellSpacing={0}
                border={0}
                style={{ ...reset, backgroundColor: "#f7f9fb", borderRadius: 12 }}
              >
                <tbody>
                  <tr>
                    <td style={{ padding: "16px 16px 18px", borderTop: `3px solid ${TEAL}` }}>
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
                        {engagement.institution}
                      </p>
                      <p
                        style={{
                          margin: "8px 0 0",
                          fontFamily: FONT,
                          fontSize: 13,
                          lineHeight: "18px",
                          fontWeight: 700,
                          color: TEAL,
                        }}
                      >
                        {engagement.title}
                      </p>
                      <p
                        style={{
                          margin: "6px 0 0",
                          fontFamily: FONT,
                          fontSize: 12,
                          lineHeight: "18px",
                          color: MUTED,
                        }}
                      >
                        {engagement.detail}
                      </p>
                    </td>
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

export function CtaBand({
  title,
  body,
  label,
  href,
  background = NAVY,
}: {
  title: string;
  body: string;
  label: string;
  href: string;
  background?: string;
}) {
  if (!title && !body && !label) return null;
  return (
    <tr>
      <td bgcolor={background} style={{ backgroundColor: background, padding: "26px 26px 28px" }}>
        {title ? (
          <h2
            style={{
              margin: 0,
              fontFamily: FONT,
              fontSize: 20,
              lineHeight: "26px",
              fontWeight: 700,
              color: "#ffffff",
            }}
          >
            {title}
          </h2>
        ) : null}
        {body ? (
          <p
            style={{
              margin: title ? "8px 0 16px" : "0 0 16px",
              fontFamily: FONT,
              fontSize: 14,
              lineHeight: "21px",
              color: "#d6e4f5",
            }}
          >
            {body}
          </p>
        ) : null}
        {label ? (
          <table role="presentation" cellPadding={0} cellSpacing={0} border={0}>
            <tbody>
              <tr>
                <td bgcolor={ORANGE} style={{ backgroundColor: ORANGE, borderRadius: 8 }}>
                  <a
                    href={href}
                    style={{
                      display: "inline-block",
                      padding: "12px 18px",
                      fontFamily: FONT,
                      fontSize: 14,
                      lineHeight: "18px",
                      fontWeight: 700,
                      color: "#ffffff",
                      textDecoration: "none",
                    }}
                  >
                    {label}
                  </a>
                </td>
              </tr>
            </tbody>
          </table>
        ) : null}
      </td>
    </tr>
  );
}

export function MailFooter({ accent = TEAL, showFounder = true }: { accent?: string; showFounder?: boolean }) {
  return (
    <tr>
      <td bgcolor="#f7f9fb" style={{ backgroundColor: "#f7f9fb", padding: "22px 22px 26px" }}>
        <EmailLogo width={168} />
        <p
          style={{
            margin: "12px 0 4px",
            fontFamily: FONT,
            fontSize: 13,
            lineHeight: "20px",
            fontWeight: 700,
            color: NAVY,
          }}
        >
          {brand.name}
        </p>
        <p style={{ margin: "0 0 10px", fontFamily: FONT, fontSize: 13, lineHeight: "20px", color: MUTED }}>
          {brand.focus}
        </p>
        {showFounder ? (
          <>
            <p
              style={{
                margin: "0 0 2px",
                fontFamily: FONT,
                fontSize: 13,
                lineHeight: "20px",
                fontWeight: 700,
                color: NAVY,
              }}
            >
              {brand.contactName}
            </p>
            <p style={{ margin: "0 0 10px", fontFamily: FONT, fontSize: 13, lineHeight: "20px", color: MUTED }}>
              Founder
            </p>
          </>
        ) : null}
        <p style={{ margin: "0 0 4px", fontFamily: FONT, fontSize: 13, lineHeight: "20px" }}>
          <a href={brand.phoneHref} style={{ color: accent, textDecoration: "none", fontWeight: 700 }}>
            {brand.phoneDisplay}
          </a>
        </p>
        <p style={{ margin: "0 0 4px", fontFamily: FONT, fontSize: 13, lineHeight: "20px" }}>
          <a href={brand.emailHref} style={{ color: accent, textDecoration: "none" }}>
            {brand.email}
          </a>
        </p>
        <p style={{ margin: 0, fontFamily: FONT, fontSize: 13, lineHeight: "20px" }}>
          <a href={brand.websiteUrl} style={{ color: accent, textDecoration: "none" }}>
            {brand.websiteLabel}
          </a>
        </p>
      </td>
    </tr>
  );
}
