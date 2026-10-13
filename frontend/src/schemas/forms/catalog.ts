import { z } from 'zod';

/** Mesmas regras do backend (app/schemas/catalog_admin.py), para o erro aparecer antes do envio. */
const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `Use no máximo ${max} caracteres.`)
    .transform((value) => value || null);

export const resourceSchema = z
  .object({
    bloco_id: z
      .string()
      .min(1, 'Escolha o bloco.')
      .transform((value) => Number(value)),
    tipo: z.enum(['SALA_ESTUDO', 'LABORATORIO', 'AUDITORIO', 'EQUIPAMENTO']),
    nome: z
      .string()
      .trim()
      .min(2, 'Informe o nome, com pelo menos 2 caracteres.')
      .max(80, 'Use no máximo 80 caracteres.'),
    capacidade: z
      .string()
      .trim()
      .regex(/^\d*$/, 'Use só números.')
      .transform((value) => (value ? Number(value) : null))
      .refine((value) => value === null || (value >= 1 && value <= 1000), {
        message: 'A capacidade vai de 1 a 1000 pessoas.',
      }),
    andar: optionalText(20),
    descricao: optionalText(1000),
    caracteristica_ids: z.array(z.number()),
  })
  .superRefine((data, context) => {
    if (data.tipo !== 'EQUIPAMENTO' && data.capacidade === null) {
      context.addIssue({
        code: 'custom',
        path: ['capacidade'],
        message: 'Informe a capacidade. Só equipamentos ficam sem lotação.',
      });
    }
  });

export const buildingSchema = z.object({
  nome: z
    .string()
    .trim()
    .min(1, 'Informe o nome do bloco.')
    .max(60, 'Use no máximo 60 caracteres.'),
  descricao: optionalText(1000),
});

export const featureSchema = z.object({
  nome: z
    .string()
    .trim()
    .min(2, 'Informe o nome, com pelo menos 2 caracteres.')
    .max(60, 'Use no máximo 60 caracteres.'),
});

export type ResourceFormInput = z.input<typeof resourceSchema>;
export type ResourceFormOutput = z.output<typeof resourceSchema>;
export type BuildingFormInput = z.input<typeof buildingSchema>;
export type BuildingFormOutput = z.output<typeof buildingSchema>;
export type FeatureForm = z.output<typeof featureSchema>;
