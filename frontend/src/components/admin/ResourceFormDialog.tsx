import { zodResolver } from '@hookform/resolvers/zod';
import CheckSharp from '@mui/icons-material/CheckSharp';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import FormControl from '@mui/material/FormControl';
import FormHelperText from '@mui/material/FormHelperText';
import FormLabel from '@mui/material/FormLabel';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useId, useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';

import { FormError } from '@/components/form/FormError';
import { FormTextField } from '@/components/form/FormTextField';
import { resourceTypeLabels } from '@/domain/resource-types';
import { useCatalogMutation } from '@/hooks/useAdminCatalog';
import { useFeedback } from '@/hooks/useFeedback';
import { adminCatalogApi } from '@/lib/api';
import type { BuildingAdminRead, FeatureAdminRead, ResourceAdminRead } from '@/lib/api/types';
import { applyApiError } from '@/lib/form-errors';
import {
  resourceSchema,
  type ResourceFormInput,
  type ResourceFormOutput,
} from '@/schemas/forms/catalog';
import { colors } from '@/theme/tokens';

const labelSx = { mb: 0.75, fontWeight: 700, fontSize: '0.875rem', color: 'text.primary' };

const FIELDS = [
  'bloco_id',
  'tipo',
  'nome',
  'capacidade',
  'andar',
  'descricao',
  'caracteristica_ids',
] as const;

const FIELD_BY_CODE = { RECURSO_JA_EXISTE: 'nome', BLOCO_INVALIDO: 'bloco_id' } as const;

function initialValues(resource: ResourceAdminRead | null): ResourceFormInput {
  return {
    bloco_id: resource ? String(resource.bloco.id) : '',
    tipo: resource?.tipo ?? 'SALA_ESTUDO',
    nome: resource?.nome ?? '',
    capacidade: resource && resource.capacidade !== null ? String(resource.capacidade) : '',
    andar: resource?.andar ?? '',
    descricao: resource?.descricao ?? '',
    caracteristica_ids: resource?.caracteristicas.map((feature) => feature.id) ?? [],
  };
}

interface ResourceFormDialogProps {
  /** `null` para um recurso novo. */
  resource: ResourceAdminRead | null;
  buildings: readonly BuildingAdminRead[];
  features: readonly FeatureAdminRead[];
  onClose: () => void;
}

export function ResourceFormDialog({
  resource,
  buildings,
  features,
  onClose,
}: ResourceFormDialogProps) {
  const id = useId();
  const { notify } = useFeedback();
  const [formError, setFormError] = useState<string | null>(null);
  const editing = resource !== null;

  const {
    control,
    register,
    handleSubmit,
    setError,

    formState: { errors },
  } = useForm<ResourceFormInput, unknown, ResourceFormOutput>({
    resolver: zodResolver(resourceSchema),
    defaultValues: initialValues(resource),
  });
  const isEquipment = useWatch({ control, name: 'tipo' }) === 'EQUIPAMENTO';

  // Só blocos ativos recebem recursos; o bloco atual aparece mesmo desativado, para não sumir.
  const buildingOptions = buildings.filter(
    (building) => building.ativo || building.id === resource?.bloco.id,
  );

  const mutation = useCatalogMutation((data: ResourceFormOutput) =>
    resource
      ? adminCatalogApi.updateResource(resource.id, data)
      : adminCatalogApi.createResource(data),
  );

  const submit = (data: ResourceFormOutput) => {
    setFormError(null);
    mutation.mutate(data, {
      onSuccess: (saved) => {
        notify({
          message: editing
            ? `Salvamos as alterações em ${saved.nome}.`
            : `Criamos ${saved.nome}. Já aparece na busca de quem reserva.`,
          severity: 'success',
        });
        onClose();
      },
      onError: (error) =>
        applyApiError(error, {
          setError,
          fields: FIELDS,
          fieldByCode: FIELD_BY_CODE,
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
        {editing ? `Editar ${resource.nome}` : 'Novo recurso'}
      </DialogTitle>
      <form noValidate onSubmit={handleSubmit(submit)}>
        <DialogContent>
          <Stack spacing={2.5}>
            <FormError message={formError} />
            <Box
              sx={{
                display: 'grid',
                gap: 2.5,
                gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
              }}
            >
              <Controller
                control={control}
                name="bloco_id"
                render={({ field, fieldState }) => (
                  <FormControl fullWidth required error={Boolean(fieldState.error)}>
                    <FormLabel id={`${id}-bloco-rotulo`} sx={labelSx}>
                      Bloco
                    </FormLabel>
                    <Select
                      {...field}
                      inputRef={field.ref}
                      labelId={`${id}-bloco-rotulo`}
                      id={`${id}-bloco`}
                      displayEmpty
                      aria-describedby={fieldState.error ? `${id}-bloco-erro` : undefined}
                    >
                      <MenuItem value="" disabled>
                        Escolha o bloco
                      </MenuItem>
                      {buildingOptions.map((building) => (
                        <MenuItem key={building.id} value={String(building.id)}>
                          {building.ativo ? building.nome : `${building.nome} (desativado)`}
                        </MenuItem>
                      ))}
                    </Select>
                    {fieldState.error && (
                      <FormHelperText id={`${id}-bloco-erro`} sx={{ mx: 0 }}>
                        {fieldState.error.message}
                      </FormHelperText>
                    )}
                  </FormControl>
                )}
              />
              <Controller
                control={control}
                name="tipo"
                render={({ field }) => (
                  <FormControl fullWidth required>
                    <FormLabel id={`${id}-tipo-rotulo`} sx={labelSx}>
                      Tipo
                    </FormLabel>
                    <Select
                      {...field}
                      inputRef={field.ref}
                      labelId={`${id}-tipo-rotulo`}
                      id={`${id}-tipo`}
                    >
                      {Object.entries(resourceTypeLabels).map(([value, label]) => (
                        <MenuItem key={value} value={value}>
                          {label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                )}
              />
            </Box>
            <FormTextField
              id={`${id}-nome`}
              label="Nome"
              placeholder="Ex.: Sala de estudo 204"
              registration={register('nome')}
              error={errors.nome?.message}
              required
            />
            <Box
              sx={{
                display: 'grid',
                gap: 2.5,
                gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
              }}
            >
              <FormTextField
                id={`${id}-capacidade`}
                label={isEquipment ? 'Capacidade (opcional)' : 'Capacidade'}
                inputMode="numeric"
                helperText="Número máximo de pessoas."
                registration={register('capacidade')}
                error={errors.capacidade?.message}
                required={!isEquipment}
              />
              <FormTextField
                id={`${id}-andar`}
                label="Andar (opcional)"
                placeholder="Ex.: Térreo"
                registration={register('andar')}
                error={errors.andar?.message}
              />
            </Box>
            <FormTextField
              id={`${id}-descricao`}
              label="Descrição (opcional)"
              multiline
              minRows={2}
              registration={register('descricao')}
              error={errors.descricao?.message}
            />
            <Controller
              control={control}
              name="caracteristica_ids"
              render={({ field }) => (
                <Box component="fieldset" sx={{ border: 0, m: 0, p: 0, minWidth: 0 }}>
                  <Typography component="legend" sx={{ ...labelSx, mb: 1 }}>
                    Características
                  </Typography>
                  {features.length === 0 ? (
                    <Typography variant="body2" color="text.secondary">
                      Nenhuma característica cadastrada. Crie em Blocos e características.
                    </Typography>
                  ) : (
                    <Stack direction="row" useFlexGap sx={{ flexWrap: 'wrap', gap: 1 }}>
                      {features.map((feature) => {
                        const selected = field.value.includes(feature.id);
                        return (
                          <Chip
                            key={feature.id}
                            label={feature.nome}
                            aria-pressed={selected}
                            onClick={() =>
                              field.onChange(
                                selected
                                  ? field.value.filter((current) => current !== feature.id)
                                  : [...field.value, feature.id],
                              )
                            }
                            icon={selected ? <CheckSharp aria-hidden /> : undefined}
                            variant={selected ? 'filled' : 'outlined'}
                            color={selected ? 'primary' : 'default'}
                            sx={{
                              ...(selected
                                ? {}
                                : {
                                    borderColor: colors.lineStrong,
                                    '&:hover': { backgroundColor: colors.sunken },
                                  }),
                            }}
                          />
                        );
                      })}
                    </Stack>
                  )}
                </Box>
              )}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
          <Button variant="outlined" onClick={onClose} disabled={mutation.isPending}>
            Cancelar
          </Button>
          <Button type="submit" variant="contained" disabled={mutation.isPending}>
            {mutation.isPending ? 'Salvando…' : editing ? 'Salvar alterações' : 'Criar recurso'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
