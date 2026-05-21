// constants/typography.ts
export const typography = {
  fonts: {
    heading: 'SpaceGrotesk',   // Numbers, titles, amounts
    body:    'Nunito',         // Labels, descriptions, UI text
  },
  sizes: {
    hero:    32,    // Balance amounts
    h1:      24,
    h2:      18,
    h3:      14,
    body:    12,
    label:   10,
    caption: 8,
  },
  weights: {
    regular:  '400' as const,
    semibold: '600' as const,
    bold:     '700' as const,
    black:    '900' as const,
  }
};
