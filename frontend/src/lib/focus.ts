import type { RefObject } from 'react';

/**
 * Foco inicial na ação segura de um diálogo, aplicado quando a abertura termina.
 * Se a pessoa já estiver num campo ou botão, o foco fica onde está: roubar o foco no meio da
 * digitação mandaria as próximas teclas (espaço, Enter) para o botão.
 */
export function focusIfIdle(target: RefObject<HTMLElement | null>): void {
  const active = document.activeElement;
  if (active instanceof HTMLElement && active.matches('input, textarea, select, button')) return;
  target.current?.focus();
}
