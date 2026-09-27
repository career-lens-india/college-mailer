import type { EmailTemplateData } from "../../types/outreach.ts";
import { emailImages } from "../../brand/assets.ts";
import { brand } from "../../brand/facts.ts";
import { buildPersonalization } from "../../lib/personalization.ts";
import { minimalContent, visibleText } from "../../lib/templateContent.ts";
import { AdditionalMessage, FilledParagraphs } from "../email/filled.tsx";
import { EmailContainer, EmailDocument, Salutation, Section } from "../email/layout.tsx";
import {
  BrandBar,
  CtaBand,
  EngagementCards,
  IconRow,
  MailFooter,
  SectionHeading,
  SplitHero,
  TopicGrid,
} from "../email/rich.tsx";

const features = [
  { symbol: "👥", label: "Industry Professionals", color: "#1d6fdb" },
  { symbol: "🛠️", label: "Hands-on Learning", color: "#0e7c84" },
  { symbol: "🎯", label: "Career Guidance", color: "#7c3aed" },
  { symbol: "💡", label: "Real-world Exposure", color: "#e8872d" },
] as const;

const topics = [
  { symbol: "🤖", title: "Generative AI & Artificial Intelligence", color: "#7c3aed" },
  { symbol: "📊", title: "Big Data & Data Engineering", color: "#1d6fdb" },
  { symbol: "✨", title: "Prompt Engineering & AI Applications", color: "#e8872d" },
  { symbol: "🚀", title: "Emerging Technologies & Industry Trends", color: "#0e7c84" },
  { symbol: "💻", title: "Full Stack Development & Modern Web Technologies", color: "#2457c5" },
  { symbol: "🎯", title: "Career & Industry Readiness", color: "#0c2340" },
] as const;

export function MinimalEmail({ data, embedded = false }: { data: EmailTemplateData; embedded?: boolean }) {
  const copy = buildPersonalization(data);
  const content = minimalContent(data.content);
  const greeting = visibleText(content.greeting, data);
  const offerHeading = visibleText(content.offerHeading, data);
  const ctaText = visibleText(content.ctaText, data);
  const closingText = visibleText(content.closingText, data);

  return (
    <EmailDocument preheader={copy.preheader} background="#eef3f8" embedded={embedded}>
      <EmailContainer>
        <BrandBar trail="See the career before you choose it." />
        <SplitHero
          panel="#ffffff"
          textColor="#0c2340"
          kicker="CareerLens India | Industry · Innovation · Careers"
          title={visibleText(content.heading, data)}
          subtitle="Collaborating with colleges to bridge the gap between academics and industry."
          imageUrl={emailImages.heroMinimal}
          imageAlt="Students in an industry mentoring session"
        />
        <IconRow items={features} />
        {greeting ? (
          <Section padding="8px 28px 4px">
            <Salutation greeting={greeting} designation={copy.designation} />
          </Section>
        ) : null}
        <Section padding="12px 28px 8px">
          <FilledParagraphs text={content.introduction} data={data} />
        </Section>
        <Section padding="8px 28px 8px">
          <FilledParagraphs text={content.offerText} data={data} />
        </Section>
        <Section padding="18px 22px 8px">
          {offerHeading ? <SectionHeading>{offerHeading}</SectionHeading> : null}
          <TopicGrid items={topics} />
        </Section>
        <Section padding="18px 22px 8px">
          <SectionHeading>Recent Campus Engagements</SectionHeading>
          <EngagementCards />
        </Section>
        {ctaText ? (
        <tr>
          <td align="center" style={{ padding: "6px 22px 18px" }}>
            <a
              href={brand.campusImpactUrl}
              style={{
                fontFamily: "Arial, Helvetica, sans-serif",
                fontSize: 14,
                lineHeight: "20px",
                fontWeight: 700,
                color: "#1d6fdb",
              }}
            >
              {ctaText}
            </a>
          </td>
        </tr>
        ) : null}
        <CtaBand
          title="Interested in a Session or Workshop?"
          body={closingText}
          label="Discuss a Campus Session"
          href={brand.campusImpactUrl}
        />
        <AdditionalMessage text={content.additionalMessage} data={data} />
        <MailFooter />
      </EmailContainer>
    </EmailDocument>
  );
}
