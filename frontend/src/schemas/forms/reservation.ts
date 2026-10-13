import { z } from 'zod';

/** Campos opcionais do resumo da reserva. Mesmas regras de app/schemas/reservation.py. */
export function reservationSchema(capacity: number | null) {
  const participants = z
    .string()
    .trim()
    .regex(/^\d*$/, 'Informe só números.')
    .transform((value) => (value ? Number(value) : undefined))
    .refine((value) => value === undefined || value >= 1, 'Informe pelo menos 1 pessoa.')
    .refine(
      (value) => value === undefined || capacity === null || value <= capacity,
      `Este espaço comporta até ${capacity ?? 0} pessoas.`,
    );
  return z.object({
    finalidade: z
      .string()
      .trim()
      .max(200, 'Use no máximo 200 caracteres.')
      .transform((value) => value || undefined),
    qtd_participantes: participants,
  });
}

export type ReservationFormInput = z.input<ReturnType<typeof reservationSchema>>;
export type ReservationFormOutput = z.output<ReturnType<typeof reservationSchema>>;

/** Mesmas regras de `AdminCancellation` no backend. */
export const adminCancellationSchema = z.object({
  motivo: z
    .string()
    .trim()
    .min(5, 'Explique o motivo em pelo menos 5 caracteres.')
    .max(300, 'Use no máximo 300 caracteres.'),
});

export type AdminCancellationForm = z.output<typeof adminCancellationSchema>;
