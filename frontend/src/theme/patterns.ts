import { colors } from '@/theme/tokens';

/** Textura de "ocupado" (design system, seção 8): o estado se lê sem depender de cor. */
export const busyPattern = `repeating-linear-gradient(135deg, ${colors.hatch} 0 2px, transparent 2px 8px)`;

/**
 * Link solto (fora de texto corrido) com área de toque de 44px (design system, seção 12).
 * Altura e largura mínimas de 44px; o texto continua alinhado com o que está ao lado.
 */
export const touchTarget = {
  display: 'inline-flex',
  alignItems: 'center',
  minHeight: 44,
  minWidth: 44,
  justifyContent: 'center',
} as const;
