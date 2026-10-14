import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

import { E2E_DATABASE_URL } from './env';

const BACKEND_DIR = fileURLToPath(new URL('../../../backend', import.meta.url));

/**
 * Põe a reserva em andamento direto no banco do E2E (`scripts.e2e_start_reservation`): a API não
 * aceita reservas no passado e o E2E não controla o relógio do servidor.
 */
export function startReservationNow(codigo: string): void {
  execFileSync('uv', ['run', 'python', '-m', 'scripts.e2e_start_reservation', codigo], {
    cwd: BACKEND_DIR,
    env: { ...process.env, DATABASE_URL: E2E_DATABASE_URL },
    stdio: 'pipe',
  });
}
