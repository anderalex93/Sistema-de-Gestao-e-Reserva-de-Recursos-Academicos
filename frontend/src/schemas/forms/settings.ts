import { z } from 'zod';

import type { CampusSettingsRead, CampusSettingsUpdate } from '@/lib/api/types';

/** Mesmas regras do backend (app/schemas/campus_settings.py), para o erro aparecer antes do envio. */
const wholeNumber = (min: number, max: number, message: string) =>
  z
    .string()
    .trim()
    .regex(/^\d+$/, 'Use só números.')
    .transform(Number)
    .refine((value) => value >= min && value <= max, { message });

const dayHours = z.object({
  aberto: z.boolean(),
  abertura: z.string(),
  fechamento: z.string(),
});

export const settingsSchema = z
  .object({
    dias: z.array(dayHours).length(7),
    duracao_max_minutos: z.string().transform(Number),
    antecedencia_max_dias: wholeNumber(1, 365, 'De 1 a 365 dias.'),
    limite_ativas_aluno: wholeNumber(1, 100, 'De 1 a 100 reservas.'),
    limite_ativas_professor: wholeNumber(1, 100, 'De 1 a 100 reservas.'),
    checkin_tolerancia_min: z.string().transform(Number),
    checkin_antecedencia_min: z.string().transform(Number),
  })
  .superRefine((data, context) => {
    if (!data.dias.some((day) => day.aberto)) {
      context.addIssue({
        code: 'custom',
        path: ['dias'],
        message: 'Deixe o campus aberto em pelo menos um dia.',
      });
    }
    data.dias.forEach((day, index) => {
      if (day.aberto && day.fechamento <= day.abertura) {
        context.addIssue({
          code: 'custom',
          path: ['dias', index, 'fechamento'],
          message: 'O fechamento precisa ser depois da abertura.',
        });
      }
    });
  });

export type SettingsFormInput = z.input<typeof settingsSchema>;
export type SettingsFormOutput = z.output<typeof settingsSchema>;

const DEFAULT_DAY = { abertura: '08:00', fechamento: '18:00' };

/** Do que a API devolve para os campos do formulário (dia 1 = segunda, como na API). */
export function settingsFormValues(settings: CampusSettingsRead): SettingsFormInput {
  return {
    dias: Array.from({ length: 7 }, (_, index) => {
      const day = settings.horarios.find((item) => item.dia_semana === index + 1);
      return day
        ? {
            aberto: true,
            abertura: day.abertura.slice(0, 5),
            fechamento: day.fechamento.slice(0, 5),
          }
        : { aberto: false, ...DEFAULT_DAY };
    }),
    duracao_max_minutos: String(settings.duracao_max_minutos),
    antecedencia_max_dias: String(settings.antecedencia_max_dias),
    limite_ativas_aluno: String(settings.limite_ativas_aluno),
    limite_ativas_professor: String(settings.limite_ativas_professor),
    checkin_tolerancia_min: String(settings.checkin_tolerancia_min),
    checkin_antecedencia_min: String(settings.checkin_antecedencia_min),
  };
}

export function settingsPayload({ dias, ...rules }: SettingsFormOutput): CampusSettingsUpdate {
  return {
    horarios: dias.flatMap((day, index) =>
      day.aberto
        ? [{ dia_semana: index + 1, abertura: day.abertura, fechamento: day.fechamento }]
        : [],
    ),
    ...rules,
  };
}
