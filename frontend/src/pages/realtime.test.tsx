import { focusManager } from '@tanstack/react-query';
import { act, screen, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { LIVE_REFRESH_MS } from '@/lib/live-query';
import { buildAvailability, buildResource, nextWeekday, serveCatalog } from '@/test/catalog';
import { api, renderRoute } from '@/test/render';
import { server } from '@/test/server';

const sala = buildResource();
const day = nextWeekday();

/** Grade que outra pessoa vai mudando: começa livre e passa a ocupada às 19:00. */
function serveChangingDay() {
  const state = { taken: false, requests: 0 };
  server.use(
    http.get(api('/recursos/:id/disponibilidade'), () => {
      state.requests += 1;
      return HttpResponse.json(
        buildAvailability(sala.id, day, state.taken ? { '19:00': { status: 'OCUPADO' } } : {}),
      );
    }),
  );
  return state;
}

async function slot(name: string) {
  const grid = await screen.findByRole('list', { name: 'Horários do dia' });
  return within(grid).findByRole('button', { name });
}

beforeEach(() => {
  serveCatalog([sala]);
  vi.useFakeTimers({ shouldAdvanceTime: true });
});

afterEach(() => {
  vi.useRealTimers();
  focusManager.setFocused(undefined);
});

describe('real time availability', () => {
  it('shows a reservation made elsewhere without reloading', async () => {
    const state = serveChangingDay();
    renderRoute(`/recursos/204?data=${day}`);
    expect(await slot('19:00 às 19:30, livre')).toBeEnabled();

    state.taken = true;
    await act(() => vi.advanceTimersByTimeAsync(LIVE_REFRESH_MS));

    expect(await slot('19:00 às 19:30, ocupado')).toBeDisabled();
  });

  it('frees the slot when it is cancelled elsewhere', async () => {
    const state = serveChangingDay();
    state.taken = true;
    renderRoute(`/recursos/204?data=${day}`);
    expect(await slot('19:00 às 19:30, ocupado')).toBeDisabled();

    state.taken = false;
    await act(() => vi.advanceTimersByTimeAsync(LIVE_REFRESH_MS));

    expect(await slot('19:00 às 19:30, livre')).toBeEnabled();
  });

  it('asks nothing while the tab is hidden and catches up when it comes back', async () => {
    const state = serveChangingDay();
    renderRoute(`/recursos/204?data=${day}`);
    await slot('19:00 às 19:30, livre');
    const before = state.requests;

    act(() => focusManager.setFocused(false));
    await act(() => vi.advanceTimersByTimeAsync(LIVE_REFRESH_MS * 3));
    expect(state.requests).toBe(before);

    state.taken = true;
    act(() => focusManager.setFocused(true));
    expect(await slot('19:00 às 19:30, ocupado')).toBeDisabled();
  });
});
