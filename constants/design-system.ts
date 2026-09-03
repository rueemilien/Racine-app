// Palette + type scale from the Claude Design handoff ("iKnow Onboarding.dc.html").
// Extended screen by screen as each mockup is implemented.

export function inkAlpha(opacity: number) {
  return `rgba(38, 32, 25, ${opacity})`;
}

export const DesignColors = {
  background: '#F7F3EC',
  surface: '#FFFFFF',
  surfaceAlt: '#F3E9DC',
  dialogSurface: '#FFFDF9',
  cream: '#FBEFE2',
  ink: '#262019',
  border: inkAlpha(0.14),
  cardBorder: inkAlpha(0.1),
  overlay: inkAlpha(0.45),
  accent: '#C1662F',
  accentPressed: '#A9552A',
  onAccent: '#FFF9F2',
  progressTrack: '#F0E7D8',
  success: '#3F7A4E',
  danger: '#B23B2E',
};

export const DesignFonts = {
  bold: 'Sora_700Bold',
  semiBold: 'Sora_600SemiBold',
  medium: 'Sora_500Medium',
};

// Light → dark ramp so the category badge doubles as a difficulty indicator,
// from "Débutant" (lightest) to "Érudit" (darkest) — keyed on the exact
// `categories.name` values seeded for Racine's 5 vocabulary tiers.
const DIFFICULTY_BADGE_COLORS: Record<string, { background: string; text: string }> = {
  'Débutant': { background: '#EDE0C8', text: DesignColors.ink },
  'Intermédiaire': { background: '#E3B98A', text: DesignColors.ink },
  'Avancé': { background: DesignColors.accent, text: DesignColors.onAccent },
  'Expert': { background: '#8C3A22', text: DesignColors.onAccent },
  'Érudit': { background: DesignColors.ink, text: DesignColors.onAccent },
};

export function getDifficultyBadgeColors(categoryName: string): { background: string; text: string } {
  return DIFFICULTY_BADGE_COLORS[categoryName] ?? { background: DesignColors.accent, text: DesignColors.onAccent };
}
