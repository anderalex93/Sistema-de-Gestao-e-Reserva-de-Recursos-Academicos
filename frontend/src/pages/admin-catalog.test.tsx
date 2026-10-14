import { screen, waitFor, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { afterEach, describe, expect, it } from 'vitest';

import type { BuildingAdminRead, FeatureAdminRead, Page, ResourceAdminRead } from '@/lib/api/types';
import { adminUser, api, renderRoute } from '@/test/render';
import { server } from '@/test/server';

const blocoA: BuildingAdminRead = {
  id: 1,
  nome: 'Bloco A',
  descricao: 'Entrada principal',
  ativo: true,
  total_recursos: 2,
};
const blocoZ: BuildingAdminRead = {
  id: 9,
  nome: 'Bloco Z',
  descricao: null,
  ativo: false,
  total_recursos: 1,
};
const projetor: FeatureAdminRead = { id: 1, nome: 'Projetor', total_recursos: 1 };
const lousa: FeatureAdminRead = { id: 2, nome: 'Lousa digital', total_recursos: 0 };

function buildResource(overrides: Partial<ResourceAdminRead> = {}): ResourceAdminRead {
  return {
    id: 204,
    nome: 'Sala 204',
    tipo: 'SALA_ESTUDO',
    capacidade: 6,
    andar: '1º andar',
    descricao: null,
    ativo: true,
    bloco: { id: 1, nome: 'Bloco A', descricao: 'Entrada principal', ativo: true },
    caracteristicas: [{ id: 1, nome: 'Projetor' }],
    checkin_token: 'qr-sala-204',
    ...overrides,
  };
}

const sala = buildResource();
const reforma = buildResource({ id: 205, nome: 'Sala em reforma', ativo: false });

function page(items: ResourceAdminRead[]): Page<ResourceAdminRead> {
  return { items, total: items.length, page: 1, per_page: 20, total_pages: items.length ? 1 : 0 };
}

function serveCatalog(resources: () => ResourceAdminRead[] = () => [sala, reforma]) {
  server.use(
    http.get(api('/admin/recursos'), () => HttpResponse.json(page(resources()))),
    http.get(api('/admin/blocos'), () => HttpResponse.json([blocoA, blocoZ])),
    http.get(api('/admin/caracteristicas'), () => HttpResponse.json([lousa, projetor])),
  );
}

// O jsdom não tem `matchMedia`: sem ele a tela fica no layout de desktop. Com `isolate: false`
// o `window` é compartilhado entre arquivos, então a emulação de celular sai sempre no fim.
function emulatePhone() {
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    value: (query: string) =>
      ({
        matches: query.includes('max-width'),
        media: query,
        addEventListener: () => undefined,
        removeEventListener: () => undefined,
      }) as unknown as MediaQueryList,
  });
}

afterEach(() => {
  Reflect.deleteProperty(window, 'matchMedia');
});

describe('admin resources', () => {
  it('lists active and deactivated resources with their situation', async () => {
    serveCatalog();
    renderRoute('/admin/recursos', { user: adminUser });

    const table = await screen.findByRole('table', { name: 'Recursos' });
    await within(table).findByText('Sala 204');
    const [, active, inactive] = within(table).getAllByRole('row') as [
      HTMLElement,
      HTMLElement,
      HTMLElement,
    ];
    expect(within(active).getByText('Sala 204')).toBeInTheDocument();
    expect(within(active).getByText('Ativo')).toBeInTheDocument();
    expect(within(inactive).getByText('Desativado')).toBeInTheDocument();
    expect(
      within(inactive).getByRole('button', { name: 'Reativar Sala em reforma' }),
    ).toBeVisible();
  });

  it('filters by situation and name', async () => {
    const requests: URLSearchParams[] = [];
    serveCatalog();
    server.use(
      http.get(api('/admin/recursos'), ({ request }) => {
        requests.push(new URL(request.url).searchParams);
        return HttpResponse.json(page([sala]));
      }),
    );
    const { user } = renderRoute('/admin/recursos', { user: adminUser });
    await screen.findByText('Sala 204');

    await user.click(screen.getByRole('combobox', { name: 'Situação' }));
    await user.click(await screen.findByRole('option', { name: 'Só desativados' }));
    await user.type(screen.getByRole('textbox', { name: 'Nome' }), '204');

    await waitFor(() =>
      expect(
        requests.some((params) => params.get('ativo') === 'false' && params.get('busca') === '204'),
      ).toBe(true),
    );
  });

  it('creates a resource that the list shows right away', async () => {
    let created: unknown = null;
    serveCatalog(() => (created ? [sala, buildResource({ id: 305, nome: 'Sala 305' })] : [sala]));
    server.use(
      http.post(api('/admin/recursos'), async ({ request }) => {
        created = await request.json();
        return HttpResponse.json(buildResource({ id: 305, nome: 'Sala 305' }), { status: 201 });
      }),
    );
    const { user } = renderRoute('/admin/recursos', { user: adminUser });
    await screen.findByText('Sala 204');

    await user.click(screen.getByRole('button', { name: 'Novo recurso' }));
    const dialog = await screen.findByRole('dialog', { name: 'Novo recurso' });
    await user.click(within(dialog).getByRole('combobox', { name: 'Bloco' }));
    const options = await screen.findAllByRole('option');
    // Bloco desativado não recebe recursos novos.
    expect(options.map((option) => option.textContent)).not.toContain('Bloco Z (desativado)');
    await user.click(screen.getByRole('option', { name: 'Bloco A' }));
    await user.type(within(dialog).getByLabelText(/^Nome/), 'Sala 305');
    await user.type(within(dialog).getByLabelText(/^Capacidade/), '8');
    await user.type(within(dialog).getByLabelText(/^Andar/), '3º andar');
    await user.click(within(dialog).getByRole('button', { name: 'Lousa digital' }));
    await user.click(within(dialog).getByRole('button', { name: 'Criar recurso' }));

    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(created).toEqual({
      bloco_id: 1,
      tipo: 'SALA_ESTUDO',
      nome: 'Sala 305',
      capacidade: 8,
      andar: '3º andar',
      descricao: null,
      caracteristica_ids: [2],
    });
    expect(await screen.findByRole('status')).toHaveTextContent(
      'Criamos Sala 305. Já aparece na busca de quem reserva.',
    );
    expect(await screen.findByText('Sala 305')).toBeInTheDocument();
  });

  it('requires capacity for spaces but not for equipment', async () => {
    let posted = false;
    serveCatalog();
    server.use(
      http.post(api('/admin/recursos'), () => {
        posted = true;
        return HttpResponse.json(buildResource(), { status: 201 });
      }),
    );
    const { user } = renderRoute('/admin/recursos', { user: adminUser });
    await screen.findByText('Sala 204');

    await user.click(screen.getByRole('button', { name: 'Novo recurso' }));
    const dialog = await screen.findByRole('dialog', { name: 'Novo recurso' });
    await user.click(within(dialog).getByRole('combobox', { name: 'Bloco' }));
    await user.click(await screen.findByRole('option', { name: 'Bloco A' }));
    await user.type(within(dialog).getByLabelText(/^Nome/), 'Projetor 03');
    await user.click(within(dialog).getByRole('button', { name: 'Criar recurso' }));

    expect(
      await within(dialog).findByText('Informe a capacidade. Só equipamentos ficam sem lotação.'),
    ).toBeInTheDocument();
    expect(posted).toBe(false);

    await user.click(within(dialog).getByRole('combobox', { name: 'Tipo' }));
    await user.click(await screen.findByRole('option', { name: 'Equipamento' }));
    expect(within(dialog).getByLabelText(/^Capacidade \(opcional\)/)).toBeInTheDocument();
    await user.click(within(dialog).getByRole('button', { name: 'Criar recurso' }));

    await waitFor(() => expect(posted).toBe(true));
  });

  it('edits a resource and marks a duplicated name', async () => {
    let sent: unknown = null;
    serveCatalog();
    server.use(
      http.put(api('/admin/recursos/204'), async ({ request }) => {
        sent = await request.json();
        return HttpResponse.json(
          { detail: 'Já existe um recurso com este nome neste bloco.', code: 'RECURSO_JA_EXISTE' },
          { status: 409 },
        );
      }),
    );
    const { user } = renderRoute('/admin/recursos', { user: adminUser });

    await user.click(await screen.findByRole('button', { name: 'Editar Sala 204' }));
    const dialog = await screen.findByRole('dialog', { name: 'Editar Sala 204' });
    const name = within(dialog).getByLabelText(/^Nome/);
    expect(name).toHaveValue('Sala 204');
    expect(within(dialog).getByRole('button', { name: 'Projetor' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await user.clear(name);
    await user.type(name, 'Sala 205');
    await user.click(within(dialog).getByRole('button', { name: 'Salvar alterações' }));

    expect(
      await within(dialog).findByText('Já existe um recurso com este nome neste bloco.'),
    ).toBeInTheDocument();
    expect(sent).toMatchObject({ bloco_id: 1, nome: 'Sala 205', caracteristica_ids: [1] });
    expect(name).toHaveAttribute('aria-invalid', 'true');
  });

  it('asks before cancelling future reservations when removing', async () => {
    const calls: (string | null)[] = [];
    serveCatalog();
    server.use(
      http.delete(api('/admin/recursos/204'), ({ request }) => {
        const forcar = new URL(request.url).searchParams.get('forcar');
        calls.push(forcar);
        return forcar
          ? HttpResponse.json({ resultado: 'DESATIVADO', reservas_canceladas: 2 })
          : HttpResponse.json(
              {
                detail:
                  'Há 2 reservas futuras, que seriam canceladas. Confirme para cancelá-las e desativar.',
                code: 'RESERVAS_FUTURAS',
              },
              { status: 409 },
            );
      }),
    );
    const { user } = renderRoute('/admin/recursos', { user: adminUser });

    await user.click(await screen.findByRole('button', { name: 'Remover Sala 204' }));
    const dialog = await screen.findByRole('dialog', { name: 'Remover Sala 204?' });
    await user.click(within(dialog).getByRole('button', { name: 'Remover recurso' }));

    expect(await within(dialog).findByRole('alert')).toHaveTextContent('Há 2 reservas futuras');
    await user.click(within(dialog).getByRole('button', { name: 'Cancelar reservas e desativar' }));

    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(calls).toEqual([null, 'true']);
    expect(await screen.findByRole('status')).toHaveTextContent(
      'Desativamos Sala 204. Não aparece mais na busca e o histórico continua. Cancelamos 2 reservas futuras.',
    );
  });

  it('reports when a resource without history is deleted', async () => {
    serveCatalog();
    server.use(
      http.delete(api('/admin/recursos/204'), () =>
        HttpResponse.json({ resultado: 'EXCLUIDO', reservas_canceladas: 0 }),
      ),
    );
    const { user } = renderRoute('/admin/recursos', { user: adminUser });

    await user.click(await screen.findByRole('button', { name: 'Remover Sala 204' }));
    const dialog = await screen.findByRole('dialog', { name: 'Remover Sala 204?' });
    await user.click(within(dialog).getByRole('button', { name: 'Remover recurso' }));

    expect(await screen.findByRole('status')).toHaveTextContent('Excluímos Sala 204 do catálogo.');
  });

  it('reactivates a deactivated resource', async () => {
    let reactivated = false;
    serveCatalog(() => [sala, { ...reforma, ativo: reactivated }]);
    server.use(
      http.post(api('/admin/recursos/205/reativar'), () => {
        reactivated = true;
        return HttpResponse.json({ ...reforma, ativo: true });
      }),
    );
    const { user } = renderRoute('/admin/recursos', { user: adminUser });

    await user.click(await screen.findByRole('button', { name: 'Reativar Sala em reforma' }));

    expect(await screen.findByRole('status')).toHaveTextContent(
      'Reativamos Sala em reforma. Voltou para a busca.',
    );
    expect(await screen.findByRole('button', { name: 'Remover Sala em reforma' })).toBeVisible();
  });

  it('stacks resources as a list on small screens', async () => {
    emulatePhone();
    serveCatalog();
    renderRoute('/admin/recursos', { user: adminUser });

    const list = await screen.findByRole('list', { name: 'Recursos' });
    expect(await within(list).findByText('Sala 204')).toBeInTheDocument();
    expect(screen.queryByRole('table')).toBeNull();
  });

  it('blocks non-admin users', async () => {
    renderRoute('/admin/recursos');

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Acesso restrito' }),
    ).toBeInTheDocument();
  });
});

describe('admin buildings and features', () => {
  it('lists buildings with resource counts and creates one', async () => {
    let created: unknown = null;
    serveCatalog();
    server.use(
      http.post(api('/admin/blocos'), async ({ request }) => {
        created = await request.json();
        return HttpResponse.json(
          { id: 3, nome: 'Bloco C', descricao: null, ativo: true, total_recursos: 0 },
          { status: 201 },
        );
      }),
    );
    const { user } = renderRoute('/admin/blocos', { user: adminUser });

    const list = await screen.findByRole('list', { name: 'Blocos' });
    expect(await within(list).findByText('2 recursos')).toBeInTheDocument();
    expect(within(list).getByText('Desativado')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Novo bloco' }));
    const dialog = await screen.findByRole('dialog', { name: 'Novo bloco' });
    await user.type(within(dialog).getByLabelText(/^Nome/), 'Bloco C');
    await user.click(within(dialog).getByRole('button', { name: 'Criar bloco' }));

    await waitFor(() => expect(created).toEqual({ nome: 'Bloco C', descricao: null }));
    expect(await screen.findByRole('status')).toHaveTextContent('Criamos Bloco C.');
  });

  it('explains that a building with resources is deactivated', async () => {
    serveCatalog();
    const { user } = renderRoute('/admin/blocos', { user: adminUser });

    await user.click(await screen.findByRole('button', { name: 'Remover Bloco A' }));
    const dialog = await screen.findByRole('dialog', { name: 'Remover Bloco A?' });

    expect(dialog).toHaveTextContent('O bloco tem 2 recursos e será desativado');
  });

  it('deletes a feature after showing how many resources use it', async () => {
    let deleted = false;
    serveCatalog();
    server.use(
      http.delete(api('/admin/caracteristicas/1'), () => {
        deleted = true;
        return new HttpResponse(null, { status: 204 });
      }),
    );
    const { user } = renderRoute('/admin/blocos?aba=caracteristicas', { user: adminUser });

    expect(
      await screen.findByRole('tab', { name: 'Características', selected: true }),
    ).toBeVisible();
    await user.click(await screen.findByRole('button', { name: 'Excluir Projetor' }));
    const dialog = await screen.findByRole('dialog', { name: 'Excluir Projetor?' });
    expect(dialog).toHaveTextContent('Ela sai de 1 recurso e do filtro da busca.');
    await user.click(within(dialog).getByRole('button', { name: 'Excluir característica' }));

    expect(await screen.findByRole('status')).toHaveTextContent('Excluímos Projetor.');
    expect(deleted).toBe(true);
  });

  it('marks a duplicated feature name', async () => {
    serveCatalog();
    server.use(
      http.post(api('/admin/caracteristicas'), () =>
        HttpResponse.json(
          {
            detail: 'Já existe uma característica com este nome.',
            code: 'CARACTERISTICA_JA_EXISTE',
          },
          { status: 409 },
        ),
      ),
    );
    const { user } = renderRoute('/admin/blocos?aba=caracteristicas', { user: adminUser });

    await user.click(await screen.findByRole('button', { name: 'Nova característica' }));
    const dialog = await screen.findByRole('dialog', { name: 'Nova característica' });
    await user.type(within(dialog).getByLabelText(/^Nome/), 'projetor');
    await user.click(within(dialog).getByRole('button', { name: 'Criar característica' }));

    expect(
      await within(dialog).findByText('Já existe uma característica com este nome.'),
    ).toBeInTheDocument();
  });

  it('links the catalog sections from the admin hub', async () => {
    renderRoute('/admin', { user: adminUser });

    expect(await screen.findByRole('link', { name: /Recursos/ })).toHaveAttribute(
      'href',
      '/admin/recursos',
    );
    expect(screen.getByRole('link', { name: /Blocos e características/ })).toHaveAttribute(
      'href',
      '/admin/blocos',
    );
  });
});
