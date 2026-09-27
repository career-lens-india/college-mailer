import type { EmailTemplateData } from "../../types/outreach.ts";
import { emailImages } from "../../brand/assets.ts";
import { brand } from "../../brand/facts.ts";
import { buildPersonalization } from "../../lib/personalization.ts";
import { professionalContent, visibleText } from "../../lib/templateContent.ts";
import { FONT, INK, NAVY } from "../email/styles.ts";
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
  { symbol: "📘", label: "Practical Learning", color: "#0e7c84" },
  { symbol: "🎓", label: "Customised for Students", color: "#e8872d" },
  { symbol: "💡", label: "Real-world Insights", color: "#2457c5" },
] as const;

const topics = [
  { symbol: "🤖", title: "Generative AI & Artificial Intelligence", color: "#1d6fdb" },
  { symbol: "✨", title: "Prompt Engineering & AI Applications", color: "#7c3aed" },
  { symbol: "💻", title: "Full Stack Development & Modern Web Technologies", color: "#0e7c84" },
  { symbol: "📊", title: "Big Data & Data Engineering", color: "#e8872d" },
  { symbol: "🚀", title: "Emerging Technologies & Industry Trends", color: "#0a8f4d" },
  { symbol: "🎯", title: "Career & Industry Readiness", color: "#0c2340" },
] as const;

export function ProfessionalEmail({ data, embedded = false }: { data: EmailTemplateData; embedded?: boolean }) {
  const copy = buildPersonalization(data);
  const content = professionalContent(data.content);
  const greeting = visibleText(content.greeting, data);
  const heroTitle = visibleText(content.heroTitle, data);
  const heroSupport = visibleText(content.heroSupport, data);
  const sectionHeading = visibleText(content.sectionHeading, data);
  const ctaText = visibleText(content.ctaText, data);
  const closingText = visibleText(content.closingText, data);

  return (
    <EmailDocument preheader={copy.preheader} background="#e8eef6" embedded={embedded}>
      <EmailContainer>
        <BrandBar trail="Stream Strategy | Engineering Roadmaps | IT Growth Planning" />
        <SplitHero
          panel="#1d6fdb"
          kicker={heroSupport}
          title={heroTitle}
          subtitle="Career Readiness | Industry Interaction"
          imageUrl={emailImages.heroProfessional}
          imageAlt="CareerLens industry session"
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
        <Section padding="18px 22px 8px">
          {sectionHeading ? <SectionHeading>{sectionHeading}</SectionHeading> : null}
          <TopicGrid items={topics} />
        </Section>
        <Section padding="18px 22px 8px">
          <SectionHeading>Recent Campus Engagements</SectionHeading>
          <EngagementCards />
        </Section>
        <CtaBand
          title="Planning a technical session or workshop for your students?"
          body={closingText}
          label={ctaText}
          href={brand.campusImpactUrl}
        />
        <AdditionalMessage text={content.additionalMessage} data={data} />
        <MailFooter showFounder={false} />
        <tr>
          <td style={{ padding: "0 28px 18px", backgroundColor: "#f7f9fb", fontFamily: FONT, fontSize: 12, color: INK }}>
            <span style={{ color: NAVY }}>{brand.contactName}</span>
            {` · ${brand.contactRole}`}
          </td>
        </tr>
      </EmailContainer>
    </EmailDocument>
  );
}
