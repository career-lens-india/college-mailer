import { createElement, type ComponentType } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { brand } from "../brand/facts.ts";
import type { ComposerMode, EmailTemplateData, TemplateId } from "../types/outreach.ts";
import { CustomEmail } from "./custom/CustomEmail.tsx";
import { MinimalEmail } from "./minimal/MinimalEmail.tsx";
import { ModernEmail } from "./modern/ModernEmail.tsx";
import { NewsletterEmail } from "./newsletter/NewsletterEmail.tsx";
import { ProfessionalEmail } from "./professional/ProfessionalEmail.tsx";

export type EmailRenderOptions = {
  assetBaseUrl?: string;
  websiteUrl?: string;
  campusImpactUrl?: string;
};

const renderers: Record<TemplateId, ComponentType<{ data: EmailTemplateData }>> = {
  professional: ProfessionalEmail,
  modern: ModernEmail,
  minimal: MinimalEmail,
  newsletter: NewsletterEmail,
};

export function renderEmailHtml(
  templateId: ComposerMode,
  data: EmailTemplateData,
  options: EmailRenderOptions = {},
): string {
  const view =
    templateId === "custom"
      ? createElement(CustomEmail, { data })
      : createElement(renderers[templateId], { data });
  const markup = renderToStaticMarkup(view)
    .replaceAll("<meta charSet=", "<meta charset=")
    .replaceAll(/<link rel="preload" as="image"[^>]*>/g, "");
  return applyRenderOptions(`<!DOCTYPE html>${markup}`, options);
}

function applyRenderOptions(html: string, options: EmailRenderOptions): string {
  let next = html;
  const assetBase = options.assetBaseUrl?.trim().replace(/\/+$/, "");
  if (assetBase) {
    next = next.replaceAll('="/assets/', `="${assetBase}/assets/`);
  }
  if (options.campusImpactUrl) {
    next = next.replaceAll(brand.campusImpactUrl, options.campusImpactUrl);
  }
  if (options.websiteUrl) {
    next = next.replaceAll(brand.websiteUrl, options.websiteUrl);
  }
  return next;
}
