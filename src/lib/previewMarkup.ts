import type { ComposerMode, EmailTemplateData } from "../types/outreach.ts";
import { renderEmailHtml } from "../templates/renderEmail.tsx";

const SCRIPT_TAG = /<script\b[^>]*>[\s\S]*?<\/script>/gi;
const STYLE_TAG = /<style\b[^>]*>[\s\S]*?<\/style>/gi;

const mobileLayout = `
  .stack { display: block !important; width: 100% !important; max-width: 100% !important; }
  .email-container { width: 100% !important; }
  .px { padding-left: 20px !important; padding-right: 20px !important; }
  .h1 { font-size: 26px !important; line-height: 32px !important; }
`;

export type PreviewCommit = {
  html: string | null;
  failed: boolean;
};

export function toPreviewFragment(html: string): string {
  const withoutScripts = html.replace(SCRIPT_TAG, "");
  const styles = [...withoutScripts.matchAll(STYLE_TAG)].map((match) => match[0]).join("");
  const body = withoutScripts.match(/<body\b[^>]*>([\s\S]*)<\/body>/i);
  const content = body
    ? body[1]
    : withoutScripts
        .replace(/<!DOCTYPE[^>]*>/gi, "")
        .replace(/<\/?(?:html|head|body)\b[^>]*>/gi, "");
  return `${styles}${content}`;
}

export function renderPreviewFragment(template: ComposerMode, data: EmailTemplateData, mobile = false): string {
  const fragment = toPreviewFragment(renderEmailHtml(template, data));
  return mobile ? `${fragment}<style>${mobileLayout}</style>` : fragment;
}

export function commitPreview(previous: string | null, rendered: string | null): PreviewCommit {
  if (rendered && rendered.trim()) return { html: rendered, failed: false };
  if (previous) return { html: previous, failed: true };
  return { html: null, failed: true };
}
