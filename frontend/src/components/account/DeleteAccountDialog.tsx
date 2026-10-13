import { zodResolver } from '@hookform/resolvers/zod';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Stack from '@mui/material/Stack';
import { useId, useState } from 'react';
import { useForm } from 'react-hook-form';

import { FormError } from '@/components/form/FormError';
import { PasswordField } from '@/components/form/PasswordField';
import { useDeleteAccount } from '@/hooks/useAccount';
import { useAuth } from '@/hooks/useAuth';
import { useFeedback } from '@/hooks/useFeedback';
import { applyApiError } from '@/lib/form-errors';
import { accountDeletionSchema, type AccountDeletionForm } from '@/schemas/forms/user';

/** Exclusão pelo titular (LGPD, Art. 18, VI): confirma com a senha e encerra a sessão. */
export function DeleteAccountDialog({ onClose }: { onClose: () => void }) {
  const id = useId();
  const { logout } = useAuth();
  const { notify } = useFeedback();
  const deletion = useDeleteAccount();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<AccountDeletionForm>({
    resolver: zodResolver(accountDeletionSchema),
    defaultValues: { senha: '' },
  });

  const submit = ({ senha }: AccountDeletionForm) => {
    setFormError(null);
    deletion.mutate(senha, {
      onSuccess: () => {
        logout();
        notify({ message: 'Sua conta foi excluída.', severity: 'success' });
      },
      onError: (error) =>
        applyApiError(error, {
          setError,
          fields: ['senha'],
          fieldByCode: { SENHA_INCORRETA: 'senha' },
          setFormError,
        }),
    });
  };

  return (
    <Dialog
      open
      onClose={deletion.isPending ? undefined : onClose}
      fullWidth
      maxWidth="xs"
      aria-labelledby={`${id}-titulo`}
    >
      <DialogTitle id={`${id}-titulo`} sx={{ fontFamily: 'h2.fontFamily', fontWeight: 500 }}>
        Excluir a sua conta?
      </DialogTitle>
      <form noValidate onSubmit={handleSubmit(submit)}>
        <DialogContent>
          <Stack spacing={2.5}>
            <FormError message={formError} />
            <Alert severity="warning" variant="outlined">
              Seu nome, e-mail e matrícula são apagados e você sai na hora. As reservas futuras são
              canceladas; as antigas ficam no histórico do espaço sem identificar você. Não dá para
              desfazer.
            </Alert>
            <PasswordField
              id={`${id}-senha`}
              label="Senha atual"
              autoComplete="current-password"
              registration={register('senha')}
              error={errors.senha?.message}
              required
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, gap: 1, flexWrap: 'wrap' }}>
          <Button variant="outlined" onClick={onClose} disabled={deletion.isPending}>
            Manter conta
          </Button>
          <Button type="submit" variant="contained" color="error" disabled={deletion.isPending}>
            {deletion.isPending ? 'Excluindo…' : 'Excluir conta'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
