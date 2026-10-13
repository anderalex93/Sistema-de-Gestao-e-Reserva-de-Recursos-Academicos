import Button from '@mui/material/Button';
import { renderHook, screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { useFeedback } from '@/hooks/useFeedback';
import { renderWithProviders } from '@/test/render';

function Trigger({ severity }: { severity: 'success' | 'error' }) {
  const { notify } = useFeedback();
  return (
    <Button onClick={() => notify({ message: `Aviso ${severity}`, severity })}>Disparar</Button>
  );
}

describe('FeedbackProvider', () => {
  it('announces success as a status message', async () => {
    const { user } = renderWithProviders(<Trigger severity="success" />);

    await user.click(screen.getByRole('button', { name: 'Disparar' }));

    expect(await screen.findByRole('status')).toHaveTextContent('Aviso success');
  });

  it('announces errors as alerts that the user can dismiss', async () => {
    const { user } = renderWithProviders(<Trigger severity="error" />);

    await user.click(screen.getByRole('button', { name: 'Disparar' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Aviso error');

    await user.click(screen.getByRole('button', { name: 'Fechar aviso' }));
    await waitFor(() => expect(screen.queryByRole('alert')).toBeNull());
  });

  it('requires the provider', () => {
    expect(() => renderHook(() => useFeedback())).toThrow(/FeedbackProvider/);
  });
});
