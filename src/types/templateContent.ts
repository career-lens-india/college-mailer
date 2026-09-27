export type ProfessionalContent = {
  heroTitle: string;
  heroSupport: string;
  greeting: string;
  introduction: string;
  sectionHeading: string;
  ctaText: string;
  closingText: string;
  additionalMessage: string;
};

export type ModernContent = {
  heroTitle: string;
  heroSupport: string;
  greeting: string;
  introduction: string;
  topicHeading: string;
  engagementHeading: string;
  ctaText: string;
  closingText: string;
  additionalMessage: string;
};

export type MinimalContent = {
  heading: string;
  greeting: string;
  introduction: string;
  offerHeading: string;
  offerText: string;
  ctaText: string;
  closingText: string;
  additionalMessage: string;
};

export type NewsletterContent = {
  heading: string;
  introduction: string;
  focusHeading: string;
  campusHeading: string;
  ctaText: string;
  closingText: string;
  additionalMessage: string;
};

export type TemplateContentById = {
  professional: ProfessionalContent;
  modern: ModernContent;
  minimal: MinimalContent;
  newsletter: NewsletterContent;
};
