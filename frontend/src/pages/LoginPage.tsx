import { zodResolver } from '@hookform/resolvers/zod';
import Button from '@mui/material/Button';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { Link as RouterLink } from 'react-router';

import { FormError } from '@/components/form/FormError';
import { FormTextField } from '@/components/form/FormTextField';
import { PasswordField } from '@/components/form/PasswordField';
import { PageHeader } from '@/components/PageHeader';
import { useAuth } from '@/hooks/useAuth';
import { analytics } from '@/lib/analytics';
import { ApiError } from '@/lib/api/api-error';
import { paths } from '@/router/paths';
import { loginSchema, type LoginForm } from '@/schemas/forms/user';

export default function LoginPage() {
  const { login } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', senha: '' },
  });

  // Após o login, o guarda PublicOnly leva de volta à página de origem.
  const mutation = useMutation({
    mutationFn: login,
    onSuccess: () => analytics.track({ name: 'login' }),
  });

  const formError = mutation.error ? ApiError.from(mutation.error).message : null;

  return (
    <>
      <PageHeader title="Entrar" description="Acesse com o e-mail e a senha da sua conta." />
      <Stack
        component="form"
        noValidate
        spacing={2.5}
        onSubmit={handleSubmit((values) => mutation.mutate(values))}
      >
        <FormError message={formError} />
        <FormTextField
          id="login-email"
          label="E-mail"
          type="email"
          autoComplete="email"
          registration={register('email')}
          error={errors.email?.message}
          required
        />
        <PasswordField
          id="login-senha"
          label="Senha"
          autoComplete="current-password"
          registration={register('senha')}
          error={errors.senha?.message}
          required
        />
        <Button type="submit" variant="contained" disabled={mutation.isPending}>
          {mutation.isPending ? 'Entrando…' : 'Entrar'}
        </Button>
      </Stack>
      <Typography sx={{ mt: 3 }}>
        Ainda não tem conta?{' '}
        <Link component={RouterLink} to={paths.signup}>
          Criar conta
        </Link>
      </Typography>
    </>
  );
}
