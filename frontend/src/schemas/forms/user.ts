import { z } from 'zod';

/** Mesmas regras do backend (app/schemas/user.py), para o erro aparecer antes do envio. */
export const nameField = z
  .string()
  .trim()
  .min(3, 'Informe o nome completo.')
  .max(120, 'Use no máximo 120 caracteres.');

export const emailField = z
  .string()
  .trim()
  .min(1, 'Informe o e-mail.')
  .pipe(z.email('Informe um e-mail válido, como nome@umj.edu.br.'));

export const passwordField = z
  .string()
  .min(8, 'A senha precisa ter pelo menos 8 caracteres.')
  .max(128, 'Use no máximo 128 caracteres.')
  .regex(/[A-Za-z]/, 'A senha precisa ter letras e números.')
  .regex(/\d/, 'A senha precisa ter letras e números.');

export const registrationField = z
  .string()
  .trim()
  .max(20, 'Use no máximo 20 caracteres.')
  .regex(/^\w*$/, 'Use só letras e números, sem espaços.')
  .transform((value) => value || undefined);

export const loginSchema = z.object({
  email: emailField,
  senha: z.string().min(1, 'Informe a senha.'),
});

export const signupSchema = z
  .object({
    nome: nameField,
    email: emailField,
    senha: passwordField,
    confirmacao: z.string().min(1, 'Repita a senha.'),
    matricula: registrationField,
  })
  .refine((data) => data.senha === data.confirmacao, {
    path: ['confirmacao'],
    message: 'As senhas não são iguais.',
  });

export const adminUserSchema = z.object({
  nome: nameField,
  email: emailField,
  senha: passwordField,
  perfil: z.enum(['ALUNO', 'PROFESSOR', 'ADMIN']),
  matricula: registrationField,
});

export type LoginForm = z.input<typeof loginSchema>;
export type SignupFormInput = z.input<typeof signupSchema>;
export type SignupFormOutput = z.output<typeof signupSchema>;
export type AdminUserFormInput = z.input<typeof adminUserSchema>;
export type AdminUserFormOutput = z.output<typeof adminUserSchema>;
