import type { CSSProperties } from 'react';

interface EduspacePalette {
  sunken: string;
  hatch: string;
  lineStrong: string;
  primaryTint: string;
  focus: string;
  inkDisabled: string;
}

declare module '@mui/material/styles' {
  interface Palette {
    eduspace: EduspacePalette;
  }
  interface PaletteOptions {
    eduspace: EduspacePalette;
  }
  interface TypographyVariants {
    data: CSSProperties;
  }
  interface TypographyVariantsOptions {
    data?: CSSProperties;
  }
}

declare module '@mui/material/Typography' {
  interface TypographyPropsVariantOverrides {
    data: true;
  }
}
