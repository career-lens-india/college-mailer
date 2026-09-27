import type { EmailTemplateData } from "../../types/outreach.ts";
import { emailImages } from "../../brand/assets.ts";
import { brand } from "../../brand/facts.ts";
import { buildPersonalization } from "../../lib/personalization.ts";
import { modernContent, visibleText } from "../../lib/templateContent.ts";
import { FONT, NAVY } from "../email/styles.ts";
import { AdditionalMessage, FilledParagraphs } from "../email/filled.tsx";
import { EmailContainer, EmailDocument, Salutation, Section } from "../email/layout.tsx";
import {
  BrandBar,
  CtaBand,
  EngagementCards,
  MailFooter,
  PhotoHero,
  PillRow,
  SectionHeading,
  TopicGrid,
} from "../email/rich.tsx";

const offers = [
  {
    symbol: "🎤",
    title: "Guest Lectures by Industry Experts",
    body: "Guidance on emerging technologies, with room for questions from the department.",
    color: "#1d6fdb",
  },
  {
    symbol: "🛠️",
    title: "Hands-on Workshops",
    body: "Practical sessions with real tools, projects and use cases.",
    color: "#0e7c84",
  },
  {
    symbol: "🎯",
    title: "Career & Industry Readiness Sessions",
    body: "How students can read roles, interviews and industry trends.",
    color: "#7c3aed",
  },
  {
    symbol: "✏️",
    title: "Customised Content",
    body: "Tailored to the students' year, branch and learning requirements.",
    color: "#e8872d",
  },
] as const;

const domains = [
  { symbol: "🤖", label: "GenAI", color: "#7eb6ff" },
  { symbol: "✨", label: "Prompt Engineering", color: "#8fd3c8" },
  { symbol: "💻", label: "Full Stack Development", color: "#f3c27a" },
  { symbol: "📊", label: "Big Data & Data Engineering", color: "#b7c4ff" },
  { symbol: "🚀", label: "Emerging Technologies", color: "#f0a3c2" },
] as const;

export function ModernEmail({ data, embedded = false }: { data: EmailTemplateData; embedded?: boolean }) {
  const copy = buildPersonalization(data);
  const content = modernContent(data.content);
  const greeting = visibleText(content.greeting, data);
  const topicHeading = visibleText(content.topicHeading, data);
  const engagementHeading = visibleText(content.engagementHeading, data);
  const ctaText = visibleText(content.ctaText, data);
  const closingText = visibleText(content.closingText, data);

  return (
    <EmailDocument preheader={copy.preheader} background="#d9e2ee" embedded={embedded}>
      <EmailContainer>
        <BrandBar trail="Industry · Technology · Careers" />
        <PhotoHero
          imageUrl={emailImages.heroModern}
          imageAlt="Industry session for college students"
          title={visibleText(content.heroTitle, data)}
          subtitle={visibleText(content.heroSupport, data)}
        />
        <PillRow labels={["AI & GenAI", "Full Stack", "Data & Cloud", "Career Readiness"]} />
        {greeting ? (
          <Section padding="22px 28px 4px">
            <Salutation greeting={greeting} designation={copy.designation} />
          </Section>
        ) : null}
        <Section padding="12px 28px 8px">
          <FilledParagraphs text={content.introduction} data={data} />
        </Section>
        <Section padding="8px 22px 8px">
          {topicHeading ? <SectionHeading>{topicHeading}</SectionHeading> : null}
          <TopicGrid items={offers} />
        </Section>
        <tr>
          <td bgcolor={NAVY} style={{ backgroundColor: NAVY, padding: "22px 16px 8px" }}>
            <h2
              style={{
                margin: "0 8px 6px",
                fontFamily: FONT,
                fontSize: 20,
                lineHeight: "26px",
                fontWeight: 700,
                color: "#ffffff",
              }}
            >
              Key Technology Domains
            </h2>
            <table role="presentation" width="100%" cellPadding={0} cellSpacing={0} border={0} style={{ width: "100%", borderCollapse: "collapse" }}>
              <tbody>
                <tr>
                  {domains.map((item) => (
                    <td
                      key={item.label}
                      className="stack"
                      align="center"
                      valign="top"
                      style={{ padding: "8px 4px 14px", textAlign: "center" }}
                    >
                      <p
                        style={{
                          margin: "0 auto 8px",
                          width: 42,
                          height: 42,
                          borderRadius: 21,
                          backgroundColor: item.color,
                          color: NAVY,
                          fontFamily: FONT,
                          fontSize: 16,
                          lineHeight: "42px",
                          fontWeight: 700,
                          textAlign: "center",
                        }}
                      >
                        {item.symbol}
                      </p>
                      <p
                        style={{
                          margin: 0,
                          fontFamily: FONT,
                          fontSize: 11,
                          lineHeight: "15px",
                          fontWeight: 700,
                          color: "#ffffff",
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
        <Section padding="22px 22px 8px">
          {engagementHeading ? <SectionHeading>{engagementHeading}</SectionHeading> : null}
          <EngagementCards />
        </Section>
        {ctaText ? (
        <tr>
          <td align="center" style={{ padding: "8px 22px 22px", textAlign: "center" }}>
            <table role="presentation" cellPadding={0} cellSpacing={0} border={0} align="center">
              <tbody>
                <tr>
                  <td bgcolor={NAVY} style={{ backgroundColor: NAVY, borderRadius: 8 }}>
                    <a
                      href={brand.campusImpactUrl}
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
                      {ctaText}
                    </a>
                  </td>
                </tr>
              </tbody>
            </table>
          </td>
        </tr>
        ) : null}
        <CtaBand
          title={closingText}
          body={`${copy.collegeName} · ${brand.phoneDisplay} · ${brand.email}`}
          label="Get in Touch"
          href={brand.websiteUrl}
        />
        <AdditionalMessage text={content.additionalMessage} data={data} />
        <MailFooter />
      </EmailContainer>
    </EmailDocument>
  );
}
