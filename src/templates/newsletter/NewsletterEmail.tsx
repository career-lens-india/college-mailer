import type { EmailTemplateData } from "../../types/outreach.ts";
import { emailImages } from "../../brand/assets.ts";
import { brand } from "../../brand/facts.ts";
import { buildPersonalization } from "../../lib/personalization.ts";
import { newsletterContent, visibleText } from "../../lib/templateContent.ts";
import { AdditionalMessage, FilledParagraphs } from "../email/filled.tsx";
import { EmailContainer, EmailDocument, Salutation, Section } from "../email/layout.tsx";
import {
  BrandBar,
  CtaBand,
  EngagementCards,
  IconRow,
  MailFooter,
  PhotoHero,
  SectionHeading,
  TopicGrid,
} from "../email/rich.tsx";

const features = [
  { symbol: "🎤", label: "Technical Sessions", color: "#1d6fdb" },
  { symbol: "🛠️", label: "Hands-on Workshops", color: "#0e7c84" },
  { symbol: "🎓", label: "Guest Lectures", color: "#e8872d" },
  { symbol: "🎯", label: "Career Readiness", color: "#7c3aed" },
] as const;

const areas = [
  { symbol: "🤖", title: "Generative AI & Artificial Intelligence", color: "#1d6fdb" },
  { symbol: "✨", title: "Prompt Engineering & AI Applications", color: "#7c3aed" },
  { symbol: "💻", title: "Full Stack Development & Modern Web Technologies", color: "#e8872d" },
  { symbol: "🧩", title: "Software Development & Engineering Practices", color: "#0e7c84" },
  { symbol: "📊", title: "Big Data & Data Engineering", color: "#2457c5" },
  { symbol: "🚀", title: "Emerging Technologies & Industry Trends", color: "#0a8f4d" },
  { symbol: "🎯", title: "Career & Industry Readiness", color: "#0c2340" },
] as const;

export function NewsletterEmail({ data, embedded = false }: { data: EmailTemplateData; embedded?: boolean }) {
  const copy = buildPersonalization(data);
  const content = newsletterContent(data.content);
  const heading = visibleText(content.heading, data);
  const focusHeading = visibleText(content.focusHeading, data);
  const campusHeading = visibleText(content.campusHeading, data);
  const ctaText = visibleText(content.ctaText, data);
  const closingText = visibleText(content.closingText, data);

  return (
    <EmailDocument preheader={copy.preheader} background="#e7eef5" embedded={embedded}>
      <EmailContainer>
        <BrandBar trail="See the career before you choose it." />
        <PhotoHero
          imageUrl={emailImages.heroNewsletter}
          imageAlt="College campus"
          band="#0e7c84"
          title={heading}
          subtitle="Industry-led sessions, workshops and career readiness programs for college students."
        />
        <IconRow items={features} />
        <Section padding="8px 28px 4px">
          <Salutation greeting={copy.greeting} designation={copy.designation} />
        </Section>
        <Section padding="12px 28px 8px">
          <FilledParagraphs text={content.introduction} data={data} />
        </Section>
        <Section padding="18px 22px 8px">
          {focusHeading ? <SectionHeading>{focusHeading}</SectionHeading> : null}
          <TopicGrid items={areas} />
        </Section>
        <Section padding="18px 22px 8px">
          {campusHeading ? <SectionHeading>{campusHeading}</SectionHeading> : null}
          <EngagementCards />
        </Section>
        {ctaText ? (
        <tr>
          <td align="center" style={{ padding: "4px 22px 16px" }}>
            <a
              href={brand.campusImpactUrl}
              style={{
                fontFamily: "Arial, Helvetica, sans-serif",
                fontSize: 14,
                lineHeight: "20px",
                fontWeight: 700,
                color: "#0e7c84",
              }}
            >
              {ctaText}
            </a>
          </td>
        </tr>
        ) : null}
        <CtaBand
          title="Planning an Industry Session?"
          body={closingText}
          label="Get in Touch"
          href={brand.websiteUrl}
          background="#e8872d"
        />
        <AdditionalMessage text={content.additionalMessage} data={data} />
        <MailFooter accent="#e8872d" />
      </EmailContainer>
    </EmailDocument>
  );
}
