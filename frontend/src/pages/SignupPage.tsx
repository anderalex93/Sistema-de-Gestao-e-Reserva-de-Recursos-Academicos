import { zodResolver } from '@hookform/resolvers/zod';
import Button from '@mui/material/Button';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link as RouterLink } from 'react-router';

import { ConsentCheckbox } from '@/components/form/ConsentCheckbox';
import { FormError } from '@/components/form/FormError';
import { FormTextField } from '@/components/form/FormTextField';
import { PasswordField } from '@/components/form/PasswordField';
import { PageHeader } from '@/components/PageHeader';
import { useAuth } from '@/hooks/useAuth';
import { useFeedback } from '@/hooks/useFeedback';
import { analytics } from '@/lib/analytics';
import { authApi } from '@/lib/api';
import { ApiError } from '@/lib/api/api-error';
import { paths } from '@/router/paths';
import { signupSchema, type SignupFormInput, type SignupFormOutput } from '@/schemas/forms/user';

const FIELD_BY_CODE = {
  EMAIL_JA_CADASTRADO: 'email',
  DOMINIO_NAO_PERMITIDO: 'email',
  MATRICULA_JA_CADASTRADA: 'matricula',
} as const;

export default function SignupPage() {
  const { login } = useAuth();
  const { notify } = useFeedback();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<SignupFormInput, unknown, SignupFormOutput>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      nome: '',
      email: '',
      senha: '',
      confirmacao: '',
      matricula: '',
      aceite_termos: false,
    },
  });

  const mutation = useMutation({
    mutationFn: async ({ confirmacao: _confirmacao, ...data }: SignupFormOutput) => {
      await authApi.signup(data);
      return login({ email: data.email, senha: data.senha });
    },
    // Com a sessão aberta, o guarda PublicOnly leva ao início.
    onSuccess: () => {
      analytics.track({ name: 'sign_up' });
      notify({ message: 'Conta criada. Você já está conectado.' });
    },
    onError: (error) => {
      const apiError = ApiError.from(error);
      const field = FIELD_BY_CODE[apiError.code as keyof typeof FIELD_BY_CODE];
      if (field) {
        setError(field, { message: apiError.message }, { shouldFocus: true });
        setFormError(null);
      } else {
        setFormError(apiError.message);
      }
    },
  });

  return (
    <>
      <PageHeader
        title="Criar conta"
        description="Leva um minuto. Com a conta você reserva salas, laboratórios e equipamentos."
      />
      <Stack
        component="form"
        noValidate
        spacing={2.5}
        onSubmit={handleSubmit((values) => mutation.mutate(values))}
      >
        <FormError message={formError} />
        <FormTextField
          id="cadastro-nome"
          label="Nome completo"
          autoComplete="name"
          registration={register('nome')}
          error={errors.nome?.message}
          required
        />
        <FormTextField
          id="cadastro-email"
          label="E-mail"
          type="email"
          autoComplete="email"
          registration={register('email')}
          error={errors.email?.message}
          required
        />
        <PasswordField
          id="cadastro-senha"
          label="Senha"
          autoComplete="new-password"
          helperText="Pelo menos 8 caracteres, com letras e números."
          registration={register('senha')}
          error={errors.senha?.message}
          required
        />
        <PasswordField
          id="cadastro-confirmacao"
          label="Repita a senha"
          autoComplete="new-password"
          registration={register('confirmacao')}
          error={errors.confirmacao?.message}
          required
        />
        <FormTextField
          id="cadastro-matricula"
          label="Matrícula (opcional)"
          registration={register('matricula')}
          error={errors.matricula?.message}
        />
        <ConsentCheckbox
          id="cadastro-aceite"
          registration={register('aceite_termos')}
          error={errors.aceite_termos?.message}
        >
          Li e concordo com o{' '}
          <Link component={RouterLink} to={paths.privacy} target="_blank" rel="noopener">
            Aviso de Privacidade
          </Link>{' '}
          e os{' '}
          <Link component={RouterLink} to={paths.terms} target="_blank" rel="noopener">
            Termos de Uso
          </Link>
          .
        </ConsentCheckbox>
        <Button type="submit" variant="contained" disabled={mutation.isPending}>
          {mutation.isPending ? 'Criando conta…' : 'Criar conta'}
        </Button>
      </Stack>
      <Typography sx={{ mt: 3 }}>
        Já tem conta?{' '}
        <Link component={RouterLink} to={paths.login}>
          Entrar
        </Link>
      </Typography>
    </>
  );
}
