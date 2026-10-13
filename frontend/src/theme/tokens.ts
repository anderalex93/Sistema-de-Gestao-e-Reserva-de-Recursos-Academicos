/**
 * Tokens do design system (docs/design/design-system.md), com as cores oficiais da UMJ
 * (kode-design-kit, brands/umj). Nenhuma cor fora daqui.
 */
export const colors = {
  paper: '#F5F7FA',
  surface: '#FCFDFE',
  sunken: '#E6E9EF',
  hatch: '#D5DBE4',
  ink: '#041C40',
  inkMuted: '#596370',
  inkDisabled: '#83929B',
  line: '#D5DBE4',
  lineStrong: '#7A8794',
  primary: '#2F52A0',
  primaryHover: '#24417F',
  primaryTint: '#E3E9F5',
  brandAccent: '#23B9D6',
  focus: '#041C40',
  error: '#B91C1C',
  warning: '#92400E',
  success: '#1A7F37',
  scrim: 'rgba(4, 28, 64, 0.48)',
} as const;

export const fonts = {
  display: '"Literata", Georgia, "Times New Roman", serif',
  ui: '"Atkinson Hyperlegible Next", "Segoe UI", system-ui, sans-serif',
  data: '"Atkinson Hyperlegible Mono", ui-monospace, Consolas, monospace',
} as const;

export const layout = {
  sideNavWidth: 248,
  topBarHeight: 56,
  bottomNavHeight: 64,
  contentMaxWidth: 1200,
} as const;

export const zIndex = {
  stickyBar: 10,
  navigation: 20,
  popover: 30,
  dialog: 40,
  snackbar: 50,
} as const;
