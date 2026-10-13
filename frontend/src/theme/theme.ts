import { createTheme, type Shadows } from '@mui/material/styles';

import { colors, fonts, zIndex } from '@/theme/tokens';

const focusRing = {
  outline: `2px solid ${colors.focus}`,
  outlineOffset: 2,
} as const;

/** Tema do EduSpace: sem sombras, raio de 2px, hover sem animação, foco sempre visível. */
export function createAppTheme() {
  return createTheme({
    palette: {
      mode: 'light',
      primary: { main: colors.primary, dark: colors.primaryHover, contrastText: colors.surface },
      error: { main: colors.error, contrastText: colors.surface },
      warning: { main: colors.warning, contrastText: colors.surface },
      success: { main: colors.success, contrastText: colors.surface },
      info: { main: colors.brandAccent, contrastText: colors.ink },
      background: { default: colors.paper, paper: colors.surface },
      text: { primary: colors.ink, secondary: colors.inkMuted, disabled: colors.inkDisabled },
      divider: colors.line,
      eduspace: {
        sunken: colors.sunken,
        hatch: colors.hatch,
        lineStrong: colors.lineStrong,
        primaryTint: colors.primaryTint,
        focus: colors.focus,
        inkDisabled: colors.inkDisabled,
      },
    },
    shape: { borderRadius: 2 },
    shadows: Array<string>(25).fill('none') as Shadows,
    zIndex: {
      appBar: zIndex.navigation,
      drawer: zIndex.navigation,
      modal: zIndex.dialog,
      snackbar: zIndex.snackbar,
      tooltip: zIndex.snackbar,
    },
    typography: {
      fontFamily: fonts.ui,
      fontSize: 16,
      htmlFontSize: 16,
      h1: { fontFamily: fonts.display, fontWeight: 500, fontSize: '2rem', lineHeight: 1.25 },
      h2: { fontFamily: fonts.display, fontWeight: 500, fontSize: '1.5rem', lineHeight: 1.33 },
      h3: { fontFamily: fonts.ui, fontWeight: 700, fontSize: '1.125rem', lineHeight: 1.44 },
      body1: { fontSize: '1rem', lineHeight: 1.625 },
      body2: { fontSize: '0.875rem', lineHeight: 1.57 },
      button: { fontWeight: 700, textTransform: 'none', fontSize: '0.9375rem' },
      overline: {
        fontWeight: 700,
        fontSize: '0.75rem',
        lineHeight: 1.33,
        letterSpacing: '0.08em',
        color: colors.inkMuted,
      },
      data: {
        fontFamily: fonts.data,
        fontWeight: 500,
        fontSize: '0.875rem',
        lineHeight: 1.43,
        fontVariantNumeric: 'tabular-nums',
      },
    },
    transitions: {
      // Hover e mudanças de estado são imediatos; só diálogos e avisos se movem (150ms).
      duration: {
        shortest: 0,
        shorter: 0,
        short: 0,
        standard: 150,
        complex: 150,
        enteringScreen: 150,
        leavingScreen: 150,
      },
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: { backgroundColor: colors.paper, color: colors.ink },
          ':focus-visible': focusRing,
          '@media (prefers-reduced-motion: reduce)': {
            '*, *::before, *::after': { animationDuration: '0s !important' },
          },
        },
      },
      MuiButtonBase: {
        defaultProps: { disableRipple: true, disableTouchRipple: true },
        styleOverrides: { root: { '&.Mui-focusVisible': focusRing } },
      },
      MuiButton: {
        defaultProps: { disableElevation: true },
        styleOverrides: {
          root: { minHeight: 44, paddingInline: 18, transition: 'none' },
          outlined: {
            borderColor: colors.lineStrong,
            color: colors.ink,
            '&:hover': { backgroundColor: colors.sunken, borderColor: colors.lineStrong },
          },
          text: { '&:hover': { backgroundColor: 'transparent', textDecoration: 'underline' } },
        },
      },
      MuiIconButton: {
        styleOverrides: {
          root: {
            borderRadius: 2,
            transition: 'none',
            '&:hover': { backgroundColor: colors.sunken },
          },
        },
      },
      MuiPaper: {
        defaultProps: { elevation: 0 },
        styleOverrides: { root: { backgroundImage: 'none' } },
      },
      MuiAppBar: {
        defaultProps: { elevation: 0, color: 'inherit' },
        styleOverrides: {
          root: { backgroundColor: colors.surface, borderBottom: `1px solid ${colors.line}` },
        },
      },
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            backgroundColor: colors.surface,
            '& .MuiOutlinedInput-notchedOutline': { borderColor: colors.lineStrong },
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderWidth: 2 },
          },
        },
      },
      MuiLink: {
        defaultProps: { underline: 'always' },
        styleOverrides: { root: { textUnderlineOffset: 3 } },
      },
      MuiSkeleton: {
        defaultProps: { animation: 'pulse' },
        styleOverrides: { root: { backgroundColor: colors.sunken, borderRadius: 0 } },
      },
      MuiDialog: {
        styleOverrides: {
          paper: { border: `1px solid ${colors.lineStrong}` },
        },
      },
      MuiBackdrop: {
        styleOverrides: {
          root: { '&:not(.MuiBackdrop-invisible)': { backgroundColor: colors.scrim } },
        },
      },
    },
  });
}
