import { AxeBuilder } from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

import { ApiHelper, type TestUser } from './support/api';
import { E2E_ADMIN } from './support/env';
import { selectSlots, startSession, waitUntilLoaded } from './support/flows';
import { testDay } from './support/schedule';

/** RNF01: os tamanhos da issue #32 (celulares pequeno e médio, tablet e notebook). */
const VIEWPORTS = [
  { width: 360, height: 800 },
  { width: 390, height: 844 },
  { width: 768, height: 1024 },
  { width: 1366, height: 768 },
] as const;

/** Design system, seção 12: alvos de toque com 44px ou mais no celular. */
const MIN_TARGET = 44;
const MORNING = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17] as const;
const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

type Session = 'none' | 'student' | 'admin';

interface Fixtures {
  receiptCode: string;
  resourceId: number;
  date: string;
  checkinToken: string;
}

interface Screen {
  name: string;
  session: Session;
  path: (fixtures: Fixtures) => string;
  /** Abre o estado a auditar (diálogo, drawer...) depois que a página carregou. */
  open?: (page: Page, width: number) => Promise<void>;
}

const SCREENS: Screen[] = [
  { name: 'início público', session: 'none', path: () => '/' },
  { name: 'sobre', session: 'none', path: () => '/sobre' },
  { name: 'ajuda', session: 'none', path: () => '/ajuda' },
  { name: 'entrar', session: 'none', path: () => '/login' },
  { name: 'criar conta', session: 'none', path: () => '/cadastro' },
  {
    name: 'criar conta com erros',
    session: 'none',
    path: () => '/cadastro',
    open: async (page) => {
      await page.getByRole('button', { name: 'Criar conta' }).click();
      await expect(page.getByText('Informe o e-mail.')).toBeVisible();
    },
  },
  { name: 'aviso de privacidade', session: 'none', path: () => '/privacidade' },
  { name: 'termos de uso', session: 'none', path: () => '/termos' },
  { name: 'comprovante', session: 'none', path: (f) => `/comprovantes/${f.receiptCode}` },
  { name: 'início', session: 'student', path: () => '/inicio' },
  { name: 'reservar', session: 'student', path: () => '/reservar' },
  {
    name: 'filtros no celular',
    session: 'student',
    path: () => '/reservar',
    open: async (page, width) => {
      if (width >= 900) return;
      await page.getByRole('button', { name: 'Filtrar' }).click();
      // Mede depois da animação de abertura.
      await expect(page.getByRole('dialog', { name: 'Filtros' })).toHaveCSS('transform', 'none');
    },
  },
  { name: 'quadro de horários', session: 'student', path: () => '/quadro' },
  {
    name: 'recurso com horário escolhido',
    session: 'student',
    path: (f) => `/recursos/${f.resourceId}?data=${f.date}`,
    open: (page) => selectSlots(page, '19:00', '20:00'),
  },
  {
    name: 'resumo da reserva',
    session: 'student',
    path: (f) => `/recursos/${f.resourceId}?data=${f.date}`,
    open: async (page) => {
      await selectSlots(page, '19:00', '20:00');
      await page.getByRole('button', { name: 'Reservar este horário' }).click();
      await expect(page.getByRole('dialog', { name: 'Confirmar reserva?' })).toBeVisible();
    },
  },
  { name: 'minhas reservas', session: 'student', path: () => '/minhas-reservas' },
  {
    name: 'cancelar reserva',
    session: 'student',
    path: () => '/minhas-reservas',
    open: async (page) => {
      await page.getByRole('button', { name: 'Cancelar' }).first().click();
      await expect(
        page.getByRole('dialog', { name: 'Deseja cancelar esta reserva?' }),
      ).toBeVisible();
    },
  },
  { name: 'minha conta', session: 'student', path: () => '/conta' },
  { name: 'página não encontrada', session: 'student', path: () => '/nao-existe' },
  { name: 'administração', session: 'admin', path: () => '/admin' },
  { name: 'admin: usuários', session: 'admin', path: () => '/admin/usuarios' },
  { name: 'admin: recursos', session: 'admin', path: () => '/admin/recursos' },
  {
    name: 'admin: novo recurso',
    session: 'admin',
    path: () => '/admin/recursos',
    open: async (page) => {
      await page.getByRole('button', { name: 'Novo recurso' }).click();
      await expect(page.getByRole('dialog', { name: 'Novo recurso' })).toBeVisible();
    },
  },
  {
    name: 'admin: nova conta',
    session: 'admin',
    path: () => '/admin/usuarios',
    open: async (page) => {
      await page.getByRole('button', { name: 'Nova conta' }).click();
      await expect(page.getByRole('dialog', { name: 'Nova conta' })).toBeVisible();
    },
  },
  { name: 'admin: blocos', session: 'admin', path: () => '/admin/blocos' },
  { name: 'admin: agenda do dia', session: 'admin', path: () => '/admin/agenda' },
  { name: 'admin: ocupação', session: 'admin', path: () => '/admin/ocupacao' },
  { name: 'admin: configurações', session: 'admin', path: () => '/admin/configuracoes' },
  {
    name: 'admin: QR da porta',
    session: 'admin',
    path: (f) => `/admin/recursos/${f.resourceId}/qr`,
  },
  {
    name: 'check-in sem reserva agora',
    session: 'student',
    path: (f) => `/checkin/${f.checkinToken}`,
  },
];

/** Elementos interativos menores que o alvo mínimo. Links dentro de texto corrido são exceção (WCAG 2.5.8). */
async function smallTargets(page: Page): Promise<string[]> {
  return page.evaluate((min) => {
    const selector = [
      'a[href]',
      'button',
      'input:not([type="hidden"])',
      'select',
      'textarea',
      '[role="button"]',
      '[role="tab"]',
      '[role="combobox"]',
      '[role="checkbox"]',
      '[role="option"]',
    ].join(',');
    const inText = (element: Element) =>
      element.tagName === 'A' &&
      getComputedStyle(element).display === 'inline' &&
      Array.from(element.parentElement?.childNodes ?? []).some(
        (node) => node.nodeType === Node.TEXT_NODE && (node.textContent ?? '').trim() !== '',
      );
    const found: string[] = [];
    for (const element of document.querySelectorAll(selector)) {
      if (inText(element) || element.closest('[aria-hidden="true"]')) continue;
      // Checkbox e radio do MUI: o input invisível cobre a área clicável do componente.
      const target = element.matches('input[type="checkbox"], input[type="radio"]')
        ? (element.parentElement ?? element)
        : element;
      const box = target.getBoundingClientRect();
      if (box.width === 0 || box.height === 0) continue;
      if (getComputedStyle(target).visibility === 'hidden') continue;
      if (box.width < min || box.height < min) {
        const label =
          element.getAttribute('aria-label') ??
          (element.textContent ?? '').trim().slice(0, 40) ??
          element.tagName;
        found.push(
          `${element.tagName.toLowerCase()} "${label}" ${box.width.toFixed(1)}x${box.height.toFixed(1)}`,
        );
      }
    }
    return found;
  }, MIN_TARGET);
}

async function horizontalOverflow(page: Page): Promise<number> {
  return page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
}

test.describe('responsividade e acessibilidade (#32)', () => {
  // Um worker só: as telas compartilham a mesma conta e a mesma reserva preparadas no beforeAll.
  test.describe.configure({ mode: 'default' });

  const tokens: Partial<Record<Session, string>> = {};
  const fixtures: Fixtures = { receiptCode: '', resourceId: 0, date: '', checkinToken: '' };

  test.beforeAll(async ({ request }, info) => {
    const api = new ApiHelper(request);
    const student: TestUser = await api.signup();
    const admin: TestUser = { ...E2E_ADMIN };
    await api.acceptTerms(admin);
    const room = await api.resourceByName(student, 'Sala de estudo 101', 'Bloco A');
    fixtures.date = testDay(info);
    // Um worker novo (depois de uma falha) refaz o beforeAll: pega o próximo horário livre.
    const reservation = await api.reserveFirstFree(student, room, fixtures.date, MORNING);
    fixtures.receiptCode = reservation.codigo;
    fixtures.resourceId = room.id;
    fixtures.checkinToken = await api.checkinToken(admin, room.id);
    tokens.student = await api.token(student);
    tokens.admin = await api.token(admin);
  });

  for (const screen of SCREENS) {
    test(screen.name, async ({ page }) => {
      const token = screen.session === 'none' ? undefined : tokens[screen.session];
      if (token) await startSession(page, token);
      const problems: string[] = [];

      for (const viewport of VIEWPORTS) {
        await page.setViewportSize(viewport);
        await page.goto(screen.path(fixtures));
        await waitUntilLoaded(page);
        await screen.open?.(page, viewport.width);
        const at = `${viewport.width}px`;

        const overflow = await horizontalOverflow(page);
        if (overflow > 0) problems.push(`${at}: rolagem horizontal de ${overflow}px`);

        if (viewport.width < 900) {
          for (const small of await smallTargets(page))
            problems.push(`${at}: alvo pequeno ${small}`);
        }

        if (viewport.width === 360 || viewport.width === 1366) {
          const { violations } = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();
          for (const violation of violations) {
            const nodes = violation.nodes.map((node) => node.target.join(' ')).join(' | ');
            problems.push(`${at}: axe ${violation.id} (${violation.impact}) em ${nodes}`);
          }
        }
      }

      expect(problems).toEqual([]);
    });
  }
});
