/** Tokens do design system (docs/design/design-system.md). Nenhuma cor fora daqui. */
export const colors = {
  paper: '#EDF0EC',
  surface: '#F7F8F5',
  sunken: '#E1E6E1',
  hatch: '#D5DCD5',
  ink: '#1A2420',
  inkMuted: '#4E5A54',
  inkDisabled: '#727C76',
  line: '#C9D0C9',
  lineStrong: '#7E8881',
  primary: '#1F4D3F',
  primaryHover: '#173B30',
  primaryTint: '#D6E2DB',
  focus: '#24508F',
  error: '#9E3A26',
  warning: '#845A10',
  scrim: 'rgba(26, 36, 32, 0.48)',
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
