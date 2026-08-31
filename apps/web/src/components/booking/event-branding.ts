import type { PublicEventSite } from "@/services/public-booking.service";

export type EventBranding = NonNullable<PublicEventSite["branding"]>;

export const defaultEventBranding: EventBranding = {
  primaryColor: "#0F172A",
  secondaryColor: "#334155",
  accentColor: "#0EA5E9",
  backgroundColor: "#FFFFFF",
  surfaceColor: "#F8FAFC",
  textColor: "#0F172A",
  headingFont: "INTER",
  bodyFont: "INTER",
  heroHeadline: null,
  heroDescription: null,
  logoAsset: null,
  heroAsset: null,
};

export const eventFontFamilies: Record<EventBranding["headingFont"], string> = {
  INTER: "var(--glacier-font-sans)",
  NUNITO_SANS: '"Avenir Next", "Trebuchet MS", sans-serif',
  PLAYFAIR_DISPLAY: 'Georgia, "Times New Roman", serif',
  OSWALD: '"Arial Narrow", Impact, sans-serif',
};
