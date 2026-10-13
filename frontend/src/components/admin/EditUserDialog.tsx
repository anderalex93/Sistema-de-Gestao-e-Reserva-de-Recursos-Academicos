import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import FormControl from '@mui/material/FormControl';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormLabel from '@mui/material/FormLabel';
import MenuItem from '@mui/material/MenuItem';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import Select from '@mui/material/Select';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useId, useRef, useState } from 'react';

import { DetailList } from '@/components/DetailList';
import { FormError } from '@/components/form/FormError';
import { roleLabels, roleOptions } from '@/domain/roles';
import { useFeedback } from '@/hooks/useFeedback';
import { adminUsersApi } from '@/lib/api';
import { ApiError } from '@/lib/api/api-error';
import type { UserAdminUpdate, UserRead, UserRole } from '@/lib/api/types';
import { focusIfIdle } from '@/lib/focus';
import { queryKeys } from '@/lib/query-keys';

const labelSx = { mb: 0.75, fontWeight: 700, fontSize: '0.875rem', color: 'text.primary' };

interface EditUserDialogProps {
  user: UserRead;
  onClose: () => void;
}

/** Só o que mudou vai para a API. */
function changes(user: UserRead, perfil: UserRole, ativo: boolean): UserAdminUpdate {
  return {
    ...(perfil !== user.perfil ? { perfil } : {}),
    ...(ativo !== user.ativo ? { ativo } : {}),
  };
}

/**
 * Perfil e situação de uma conta (#50). Desativar tem um segundo passo de confirmação,
 * porque a pessoa perde o acesso na hora e as reservas futuras dela são canceladas.
 */
export function EditUserDialog({ user, onClose }: EditUserDialogProps) {
  const id = useId();
  const queryClient = useQueryClient();
  const { notify } = useFeedback();
  const [perfil, setPerfil] = useState<UserRole>(user.perfil);
  const [ativo, setAtivo] = useState(user.ativo);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const keepButton = useRef<HTMLButtonElement>(null);

  const mutation = useMutation({
    mutationFn: (data: UserAdminUpdate) => adminUsersApi.update(user.id, data),
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.adminUsers }),
        // Desativar cancela reservas futuras: agenda, grade e quadro mudam.
        queryClient.invalidateQueries({ queryKey: queryKeys.reservations }),
        queryClient.invalidateQueries({ queryKey: queryKeys.resources }),
      ]),
  });

  const data = changes(user, perfil, ativo);
  const deactivating = data.ativo === false;

  const save = () => {
    setError(null);
    mutation.mutate(data, {
      onSuccess: (saved) => {
        notify({
          message: deactivating
            ? `Conta de ${saved.nome} desativada.`
            : `Conta de ${saved.nome} atualizada.`,
          severity: 'success',
        });
        onClose();
      },
      onError: (failure) => {
        setConfirming(false);
        setError(ApiError.from(failure).message);
      },
    });
  };

  const submit = () => {
    if (Object.keys(data).length === 0) {
      onClose();
    } else if (deactivating && !confirming) {
      setConfirming(true);
    } else {
      save();
    }
  };

  return (
    <Dialog
      open
      onClose={mutation.isPending ? undefined : onClose}
      fullWidth
      maxWidth="xs"
      aria-labelledby={`${id}-titulo`}
      slotProps={{ transition: { onEntered: () => focusIfIdle(keepButton) } }}
    >
      <DialogTitle id={`${id}-titulo`} sx={{ fontFamily: 'h2.fontFamily', fontWeight: 500 }}>
        {confirming ? `Desativar a conta de ${user.nome}?` : `Editar ${user.nome}`}
      </DialogTitle>
      <DialogContent>
        <Stack spacing={2.5}>
          <FormError message={error} />
          {confirming ? (
            <>
              <DetailList
                items={[
                  { label: 'E-mail', value: user.email },
                  { label: 'Perfil', value: roleLabels[perfil] },
                ]}
              />
              <Alert severity="warning" variant="outlined">
                A pessoa perde o acesso na hora e as reservas dela que ainda não começaram são
                canceladas. O histórico continua. Dá para reativar depois.
              </Alert>
            </>
          ) : (
            <>
              <FormControl fullWidth>
                <FormLabel id={`${id}-perfil-rotulo`} sx={labelSx}>
                  Perfil
                </FormLabel>
                <Select
                  labelId={`${id}-perfil-rotulo`}
                  id={`${id}-perfil`}
                  value={perfil}
                  onChange={(event) => setPerfil(event.target.value as UserRole)}
                >
                  {roleOptions.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>
                  Vale a partir do próximo acesso da pessoa.
                </Typography>
              </FormControl>
              <FormControl>
                <FormLabel id={`${id}-situacao-rotulo`} sx={labelSx}>
                  Situação
                </FormLabel>
                <RadioGroup
                  aria-labelledby={`${id}-situacao-rotulo`}
                  value={ativo ? 'ativa' : 'desativada'}
                  onChange={(event) => setAtivo(event.target.value === 'ativa')}
                >
                  <FormControlLabel value="ativa" control={<Radio />} label="Ativa" />
                  <FormControlLabel value="desativada" control={<Radio />} label="Desativada" />
                </RadioGroup>
              </FormControl>
            </>
          )}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3, gap: 1, flexWrap: 'wrap' }}>
        <Button
          variant="outlined"
          ref={keepButton}
          disabled={mutation.isPending}
          onClick={confirming ? () => setConfirming(false) : onClose}
        >
          {confirming ? 'Voltar' : 'Cancelar'}
        </Button>
        <Button
          variant="contained"
          color={confirming ? 'error' : 'primary'}
          disabled={mutation.isPending}
          onClick={submit}
        >
          {mutation.isPending ? 'Salvando…' : confirming ? 'Sim, desativar conta' : 'Salvar'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
