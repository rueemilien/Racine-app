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
};

export const DesignFonts = {
  bold: 'Sora_700Bold',
  semiBold: 'Sora_600SemiBold',
  medium: 'Sora_500Medium',
};
