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
import type { FeatureAdminRead } from '@/lib/api/types';
import { applyApiError } from '@/lib/form-errors';
import { featureSchema, type FeatureForm } from '@/schemas/forms/catalog';

interface FeatureFormDialogProps {
  /** `null` para uma característica nova. */
  feature: FeatureAdminRead | null;
  onClose: () => void;
}

export function FeatureFormDialog({ feature, onClose }: FeatureFormDialogProps) {
  const id = useId();
  const { notify } = useFeedback();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<FeatureForm>({
    resolver: zodResolver(featureSchema),
    defaultValues: { nome: feature?.nome ?? '' },
  });

  const mutation = useCatalogMutation((data: FeatureForm) =>
    feature ? adminCatalogApi.updateFeature(feature.id, data) : adminCatalogApi.createFeature(data),
  );

  const submit = (data: FeatureForm) => {
    setFormError(null);
    mutation.mutate(data, {
      onSuccess: (saved) => {
        notify({
          message: feature ? `Renomeamos para ${saved.nome}.` : `Criamos ${saved.nome}.`,
          severity: 'success',
        });
        onClose();
      },
      onError: (error) =>
        applyApiError(error, {
          setError,
          fields: ['nome'],
          fieldByCode: { CARACTERISTICA_JA_EXISTE: 'nome' },
          setFormError,
        }),
    });
  };

  return (
    <Dialog
      open
      onClose={mutation.isPending ? undefined : onClose}
      fullWidth
      maxWidth="xs"
      aria-labelledby={`${id}-titulo`}
    >
      <DialogTitle id={`${id}-titulo`} sx={{ fontFamily: 'h2.fontFamily', fontWeight: 500 }}>
        {feature ? `Renomear ${feature.nome}` : 'Nova característica'}
      </DialogTitle>
      <form noValidate onSubmit={handleSubmit(submit)}>
        <DialogContent>
          <Stack spacing={2.5}>
            <FormError message={formError} />
            <FormTextField
              id={`${id}-nome`}
              label="Nome"
              placeholder="Ex.: Lousa digital"
              helperText="Aparece nos filtros da busca e na página do recurso."
              registration={register('nome')}
              error={errors.nome?.message}
              required
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
          <Button variant="outlined" onClick={onClose} disabled={mutation.isPending}>
            Cancelar
          </Button>
          <Button type="submit" variant="contained" disabled={mutation.isPending}>
            {mutation.isPending ? 'Salvando…' : feature ? 'Salvar nome' : 'Criar característica'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
