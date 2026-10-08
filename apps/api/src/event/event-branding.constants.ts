export const EVENT_BRANDING_FONTS = [
  'INTER',
  'NUNITO_SANS',
  'PLAYFAIR_DISPLAY',
  'OSWALD',
] as const;

export const DEFAULT_EVENT_BRANDING = {
  primaryColor: '#0F172A',
  secondaryColor: '#334155',
  accentColor: '#0EA5E9',
  backgroundColor: '#FFFFFF',
  surfaceColor: '#F8FAFC',
  textColor: '#0F172A',
  headingFont: 'INTER',
  bodyFont: 'INTER',
} as const;

function relativeLuminance(hex: string) {
  const channels = [1, 3, 5].map((offset) => {
    const channel = Number.parseInt(hex.slice(offset, offset + 2), 16) / 255;
    return channel <= 0.04045
      ? channel / 12.92
      : ((channel + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

export function eventBrandingContrastRatio(foreground: string, background: string) {
  const first = relativeLuminance(foreground);
  const second = relativeLuminance(background);
  const lighter = Math.max(first, second);
  const darker = Math.min(first, second);
  return (lighter + 0.05) / (darker + 0.05);
}

export function unsafeEventBrandingPair(branding: {
  primaryColor: string;
  accentColor: string;
  backgroundColor: string;
  surfaceColor: string;
  textColor: string;
}) {
  const pairs = [
    { label: 'page text and background', foreground: branding.textColor, background: branding.backgroundColor },
    { label: 'card text and surface', foreground: branding.textColor, background: branding.surfaceColor },
    { label: 'hero text and primary colour', foreground: branding.backgroundColor, background: branding.primaryColor },
    { label: 'button text and accent colour', foreground: branding.textColor, background: branding.accentColor },
  ];
  return pairs.find(
    ({ foreground, background }) =>
      eventBrandingContrastRatio(foreground, background) < 4.5,
  )?.label;
}
