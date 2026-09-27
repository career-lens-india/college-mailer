import type { CSSProperties } from "react";
import { visibleText } from "../../lib/templateContent.ts";
import type { EmailTemplateData } from "../../types/outreach.ts";
import { Paragraph, Section } from "./layout.tsx";

export function FilledParagraphs({ text, data }: { text: string; data: EmailTemplateData }) {
  const resolved = visibleText(text, data);
  if (!resolved) return null;
  const blocks = resolved.split(/\n{2,}/).map((block) => block.trim()).filter(Boolean);
  return blocks.map((block, index) => {
    const lines = block.split("\n");
    const style: CSSProperties | undefined = index === blocks.length - 1 ? { marginBottom: 0 } : undefined;
    return (
      <Paragraph key={index} style={style}>
        {lines.map((line, lineIndex) => (
          <span key={lineIndex}>
            {lineIndex > 0 ? <br /> : null}
            {line}
          </span>
        ))}
      </Paragraph>
    );
  });
}

export function AdditionalMessage({ text, data }: { text: string; data: EmailTemplateData }) {
  if (!visibleText(text, data)) return null;
  return (
    <Section padding="4px 28px 8px">
      <FilledParagraphs text={text} data={data} />
    </Section>
  );
}
