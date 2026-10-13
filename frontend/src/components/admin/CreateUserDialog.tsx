import { zodResolver } from '@hookform/resolvers/zod';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import FormControl from '@mui/material/FormControl';
import FormLabel from '@mui/material/FormLabel';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import Stack from '@mui/material/Stack';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';

import { FormError } from '@/components/form/FormError';
import { FormTextField } from '@/components/form/FormTextField';
import { PasswordField } from '@/components/form/PasswordField';
import { roleOptions } from '@/domain/roles';
import { useFeedback } from '@/hooks/useFeedback';
import { adminUsersApi } from '@/lib/api';
import { ApiError } from '@/lib/api/api-error';
import { queryKeys } from '@/lib/query-keys';
import {
  adminUserSchema,
  type AdminUserFormInput,
  type AdminUserFormOutput,
} from '@/schemas/forms/user';

const EMPTY: AdminUserFormInput = {
  nome: '',
  email: '',
  senha: '',
  perfil: 'ALUNO',
  matricula: '',
};

const FIELD_BY_CODE = {
  EMAIL_JA_CADASTRADO: 'email',
  MATRICULA_JA_CADASTRADA: 'matricula',
} as const;

interface CreateUserDialogProps {
  open: boolean;
  onClose: () => void;
}

export function CreateUserDialog({ open, onClose }: CreateUserDialogProps) {
  const queryClient = useQueryClient();
  const { notify } = useFeedback();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    control,
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<AdminUserFormInput, unknown, AdminUserFormOutput>({
    resolver: zodResolver(adminUserSchema),
    defaultValues: EMPTY,
  });

  const close = () => {
    reset(EMPTY);
    setFormError(null);
    onClose();
  };

  const mutation = useMutation({
    mutationFn: (data: AdminUserFormOutput) => adminUsersApi.create(data),
    onSuccess: async (user) => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.adminUsers });
      notify({ message: `Conta de ${user.nome} criada.` });
      close();
    },
    onError: (error) => {
      const apiError = ApiError.from(error);
      const field = FIELD_BY_CODE[apiError.code as keyof typeof FIELD_BY_CODE];
      if (field) {
        setError(field, { message: apiError.message }, { shouldFocus: true });
      } else {
        setFormError(apiError.message);
      }
    },
  });

  return (
    <Dialog open={open} onClose={close} fullWidth maxWidth="sm" aria-labelledby="nova-conta-titulo">
      <DialogTitle id="nova-conta-titulo" sx={{ fontFamily: 'h2.fontFamily', fontWeight: 500 }}>
        Nova conta
      </DialogTitle>
      <form noValidate onSubmit={handleSubmit((values) => mutation.mutate(values))}>
        <DialogContent>
          <Stack spacing={2.5}>
            <FormError message={formError} />
            <FormTextField
              id="nova-conta-nome"
              label="Nome completo"
              registration={register('nome')}
              error={errors.nome?.message}
              required
            />
            <FormTextField
              id="nova-conta-email"
              label="E-mail"
              type="email"
              registration={register('email')}
              error={errors.email?.message}
              required
            />
            <PasswordField
              id="nova-conta-senha"
              label="Senha inicial"
              autoComplete="new-password"
              helperText="Combine com a pessoa como ela vai receber esta senha."
              registration={register('senha')}
              error={errors.senha?.message}
              required
            />
            <Controller
              control={control}
              name="perfil"
              render={({ field }) => (
                <FormControl fullWidth>
                  <FormLabel
                    id="nova-conta-perfil-rotulo"
                    sx={{ mb: 0.75, fontWeight: 700, fontSize: '0.875rem', color: 'text.primary' }}
                  >
                    Perfil
                  </FormLabel>
                  <Select
                    {...field}
                    labelId="nova-conta-perfil-rotulo"
                    id="nova-conta-perfil"
                    inputRef={field.ref}
                  >
                    {roleOptions.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}
            />
            <FormTextField
              id="nova-conta-matricula"
              label="Matrícula (opcional)"
              registration={register('matricula')}
              error={errors.matricula?.message}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
          <Button variant="outlined" onClick={close}>
            Cancelar
          </Button>
          <Button type="submit" variant="contained" disabled={mutation.isPending}>
            {mutation.isPending ? 'Criando…' : 'Criar conta'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
