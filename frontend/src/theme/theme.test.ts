import { describe, expect, it } from 'vitest';

import { createAppTheme } from '@/theme/theme';
import { colors } from '@/theme/tokens';

/** Guarda as regras do design system que um ajuste distraído no tema poderia quebrar. */
describe('createAppTheme', () => {
  const theme = createAppTheme();

  it('uses the official UMJ brand colors', () => {
    expect(theme.palette.primary.main).toBe('#2F52A0');
    expect(theme.palette.text.primary).toBe('#041C40');
    expect(theme.palette.background.default).toBe('#F5F7FA');
  });

  it('has no shadows', () => {
    expect(new Set(theme.shadows)).toEqual(new Set(['none']));
  });

  it('uses crisp 2px corners', () => {
    expect(theme.shape.borderRadius).toBe(2);
  });

  it('never uses pure white as background', () => {
    expect(theme.palette.background.default).toBe(colors.paper);
    expect(theme.palette.background.paper).toBe(colors.surface);
    expect([colors.paper, colors.surface]).not.toContain('#FFFFFF');
  });

  it('avoids banned typefaces', () => {
    const families = JSON.stringify(theme.typography);

    expect(families).not.toMatch(/Inter|Geist|Space Grotesk/);
    expect(theme.typography.h1.fontFamily).toMatch(/Literata/);
  });

  it('keeps hover changes instant', () => {
    expect(theme.transitions.duration.shortest).toBe(0);
    expect(theme.transitions.duration.short).toBe(0);
  });
});
