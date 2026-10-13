import { zodResolver } from '@hookform/resolvers/zod';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Stack from '@mui/material/Stack';
import { useId, useState } from 'react';
import { useForm } from 'react-hook-form';

import { FormError } from '@/components/form/FormError';
import { FormTextField } from '@/components/form/FormTextField';
import { useCatalogMutation } from '@/hooks/useAdminCatalog';
import { useFeedback } from '@/hooks/useFeedback';
import { adminCatalogApi } from '@/lib/api';
import type { BuildingAdminRead } from '@/lib/api/types';
import { applyApiError } from '@/lib/form-errors';
import {
  buildingSchema,
  type BuildingFormInput,
  type BuildingFormOutput,
} from '@/schemas/forms/catalog';

interface BuildingFormDialogProps {
  /** `null` para um bloco novo. */
  building: BuildingAdminRead | null;
  onClose: () => void;
}

export function BuildingFormDialog({ building, onClose }: BuildingFormDialogProps) {
  const id = useId();
  const { notify } = useFeedback();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<BuildingFormInput, unknown, BuildingFormOutput>({
    resolver: zodResolver(buildingSchema),
    defaultValues: { nome: building?.nome ?? '', descricao: building?.descricao ?? '' },
  });

  const mutation = useCatalogMutation((data: BuildingFormOutput) =>
    building
      ? adminCatalogApi.updateBuilding(building.id, data)
      : adminCatalogApi.createBuilding(data),
  );

  const submit = (data: BuildingFormOutput) => {
    setFormError(null);
    mutation.mutate(data, {
      onSuccess: (saved) => {
        notify({
          message: building ? `Salvamos ${saved.nome}.` : `Criamos ${saved.nome}.`,
          severity: 'success',
        });
        onClose();
      },
      onError: (error) =>
        applyApiError(error, {
          setError,
          fields: ['nome', 'descricao'],
          fieldByCode: { BLOCO_JA_EXISTE: 'nome' },
          setFormError,
        }),
    });
  };

  return (
    <Dialog
      open
      onClose={mutation.isPending ? undefined : onClose}
      fullWidth
      maxWidth="sm"
      aria-labelledby={`${id}-titulo`}
    >
      <DialogTitle id={`${id}-titulo`} sx={{ fontFamily: 'h2.fontFamily', fontWeight: 500 }}>
        {building ? `Editar ${building.nome}` : 'Novo bloco'}
      </DialogTitle>
      <form noValidate onSubmit={handleSubmit(submit)}>
        <DialogContent>
          <Stack spacing={2.5}>
            <FormError message={formError} />
            <FormTextField
              id={`${id}-nome`}
              label="Nome"
              placeholder="Ex.: Bloco C"
              registration={register('nome')}
              error={errors.nome?.message}
              required
            />
            <FormTextField
              id={`${id}-descricao`}
              label="Descrição (opcional)"
              helperText="Como chegar ou o que tem no bloco."
              multiline
              minRows={2}
              registration={register('descricao')}
              error={errors.descricao?.message}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
          <Button variant="outlined" onClick={onClose} disabled={mutation.isPending}>
            Cancelar
          </Button>
          <Button type="submit" variant="contained" disabled={mutation.isPending}>
            {mutation.isPending ? 'Salvando…' : building ? 'Salvar alterações' : 'Criar bloco'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
