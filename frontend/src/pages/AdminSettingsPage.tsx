import { zodResolver } from '@hookform/resolvers/zod';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import FormControl from '@mui/material/FormControl';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormHelperText from '@mui/material/FormHelperText';
import FormLabel from '@mui/material/FormLabel';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { visuallyHidden } from '@mui/utils';
import { useEffect, useState, type ReactNode } from 'react';
import { Controller, useForm, useWatch, type Control, type FieldPath } from 'react-hook-form';

import { FormError } from '@/components/form/FormError';
import { FormTextField } from '@/components/form/FormTextField';
import { LoadError } from '@/components/LoadError';
import { PageHeader } from '@/components/PageHeader';
import { WEEKDAY_NAMES } from '@/domain/occupancy';
import { durationLabel } from '@/domain/slot-selection';
import { useAdminSettings, useSaveAdminSettings } from '@/hooks/useAdminSettings';
import { useFeedback } from '@/hooks/useFeedback';
import type { CampusSettingsRead } from '@/lib/api/types';
import { applyApiError } from '@/lib/form-errors';
import { loadFailure } from '@/lib/load-failure';
import { paths } from '@/router/paths';
import {
  settingsFormValues,
  settingsPayload,
  settingsSchema,
  type SettingsFormInput,
  type SettingsFormOutput,
} from '@/schemas/forms/settings';
import { colors } from '@/theme/tokens';

const labelSx = { mb: 0.75, fontWeight: 700, fontSize: '0.875rem', color: 'text.primary' };

/** 05:00 a 23:30, de meia em meia hora. */
const TIMES = Array.from({ length: 38 }, (_, index) => {
  const minutes = 5 * 60 + index * 30;
  return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
});
const DURATIONS = Array.from({ length: 24 }, (_, index) => (index + 1) * 30);
const CHECKIN_MINUTES = [0, 5, 10, 15, 20, 30, 45, 60];

interface Option {
  value: string;
  label: string;
}

/** Garante que o valor salvo apareça na lista, mesmo fora das opções sugeridas. */
function withCurrent(options: Option[], current: string, label: (value: string) => string) {
  return options.some((option) => option.value === current)
    ? options
    : [...options, { value: current, label: label(current) }].sort(
        (a, b) => Number(a.value) - Number(b.value),
      );
}

function SelectField({
  control,
  name,
  id,
  label,
  helperText,
  error,
  options,
  disabled,
  compactLabel = false,
}: {
  control: Control<SettingsFormInput, unknown, SettingsFormOutput>;
  name: FieldPath<SettingsFormInput>;
  id: string;
  label: string;
  helperText?: string;
  error?: string;
  options: Option[];
  disabled?: boolean;
  /** Na tabela de horários o cabeçalho das colunas já diz o que é: o rótulo fica só para leitores de tela a partir do tablet. */
  compactLabel?: boolean;
}) {
  const message = error ?? helperText;
  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <FormControl fullWidth error={Boolean(error)} disabled={disabled}>
          <FormLabel
            id={`${id}-rotulo`}
            sx={compactLabel ? { ...labelSx, '@media (min-width:600px)': visuallyHidden } : labelSx}
          >
            {label}
          </FormLabel>
          <Select
            id={id}
            labelId={`${id}-rotulo`}
            value={String(field.value)}
            onChange={field.onChange}
            onBlur={field.onBlur}
            inputRef={field.ref}
            inputProps={{ 'aria-describedby': message ? `${id}-mensagem` : undefined }}
          >
            {options.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </Select>
          {message && (
            <FormHelperText id={`${id}-mensagem`} sx={{ mx: 0 }}>
              {message}
            </FormHelperText>
          )}
        </FormControl>
      )}
    />
  );
}

function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <Box
      component="section"
      aria-labelledby={id}
      sx={{ borderTop: 1, borderColor: 'divider', pt: 3, mt: 4 }}
    >
      <Typography id={id} variant="h2" sx={{ mb: 2.5 }}>
        {title}
      </Typography>
      {children}
    </Box>
  );
}

function lastChange(settings: CampusSettingsRead): string {
  if (settings.origem === 'AMBIENTE' || !settings.atualizado_em) {
    return 'Valores padrão do servidor. Ninguém alterou por aqui ainda.';
  }
  const when = new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Maceio',
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(settings.atualizado_em));
  const who = settings.atualizado_por ? ` por ${settings.atualizado_por}` : '';
  return `Última alteração${who} em ${when.replace('.', '')}.`;
}

function SettingsForm({ settings }: { settings: CampusSettingsRead }) {
  const { notify } = useFeedback();
  const [formError, setFormError] = useState<string | null>(null);
  const save = useSaveAdminSettings();
  const {
    control,
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isDirty },
  } = useForm<SettingsFormInput, unknown, SettingsFormOutput>({
    resolver: zodResolver(settingsSchema),
    defaultValues: settingsFormValues(settings),
  });
  const days = useWatch({ control, name: 'dias' });
  // Erro da lista inteira (nenhum dia aberto): o resolver pode guardá-lo na raiz do array.
  const daysError = errors.dias?.root?.message ?? errors.dias?.message;
  const values = useWatch({ control });

  useEffect(() => reset(settingsFormValues(settings)), [settings, reset]);

  const submit = (data: SettingsFormOutput) => {
    setFormError(null);
    save.mutate(settingsPayload(data), {
      onSuccess: () => notify({ message: 'Configurações salvas.', severity: 'success' }),
      onError: (error) =>
        applyApiError(error, {
          setError,
          fields: [
            'duracao_max_minutos',
            'antecedencia_max_dias',
            'limite_ativas_aluno',
            'limite_ativas_professor',
            'checkin_tolerancia_min',
            'checkin_antecedencia_min',
          ],
          setFormError,
        }),
    });
  };

  const minutesLabel = (value: string) => (value === '0' ? 'Desligado' : `${value} min`);
  const durationOptions = withCurrent(
    DURATIONS.map((minutes) => ({ value: String(minutes), label: durationLabel(minutes) })),
    values.duracao_max_minutos ?? '',
    (value) => durationLabel(Number(value)),
  );
  const toleranceOptions = withCurrent(
    CHECKIN_MINUTES.map((minutes) => ({
      value: String(minutes),
      label: minutes === 0 ? 'Desligado: check-in opcional' : `${minutes} min`,
    })),
    values.checkin_tolerancia_min ?? '',
    minutesLabel,
  );
  const leadOptions = withCurrent(
    CHECKIN_MINUTES.map((minutes) => ({
      value: String(minutes),
      label: minutes === 0 ? 'Só no horário de início' : `${minutes} min antes`,
    })),
    values.checkin_antecedencia_min ?? '',
    minutesLabel,
  );
  const timeOptions = TIMES.map((time) => ({ value: time, label: time }));

  return (
    <form noValidate onSubmit={handleSubmit(submit)}>
      <Stack spacing={2}>
        <Typography color="text.secondary">{lastChange(settings)}</Typography>
        <Alert severity="info" variant="outlined" role="note">
          As mudanças valem na hora para novas reservas. Reservas já confirmadas continuam como
          estão.
        </Alert>
        <FormError message={formError} />
      </Stack>

      <Section id="config-horario" title="Horário de funcionamento">
        {daysError && (
          <Typography role="alert" sx={{ color: colors.error, mb: 2 }}>
            {daysError}
          </Typography>
        )}
        <Box
          aria-hidden
          sx={{
            display: { xs: 'none', sm: 'grid' },
            gridTemplateColumns: '120px 140px 1fr 1fr',
            gap: 2,
            pb: 1,
            borderBottom: 1,
            borderColor: 'divider',
            ...labelSx,
            color: 'text.secondary',
          }}
        >
          <span>Dia</span>
          <span>Situação</span>
          <span>Abertura</span>
          <span>Fechamento</span>
        </Box>
        <Box component="ul" sx={{ m: 0, p: 0, listStyle: 'none' }}>
          {days.map((day, index) => {
            const name = WEEKDAY_NAMES[index + 1] ?? '';
            const label = name.charAt(0).toUpperCase() + name.slice(1);
            return (
              <Box
                component="li"
                key={name}
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr 1fr', sm: '120px 140px 1fr 1fr' },
                  gap: 2,
                  alignItems: { xs: 'end', sm: 'center' },
                  py: { xs: 2, sm: 1.5 },
                  borderTop: index === 0 ? 'none' : 1,
                  borderColor: 'divider',
                }}
              >
                <Typography sx={{ fontWeight: 700, alignSelf: 'center' }}>{label}</Typography>
                <Controller
                  control={control}
                  name={`dias.${index}.aberto`}
                  render={({ field }) => (
                    <FormControlLabel
                      sx={{ alignSelf: 'center', m: 0 }}
                      control={
                        <Checkbox
                          checked={field.value}
                          onChange={(event) => field.onChange(event.target.checked)}
                          slotProps={{ input: { 'aria-label': `${label}: aberto` } }}
                        />
                      }
                      label="Aberto"
                    />
                  )}
                />
                <SelectField
                  control={control}
                  name={`dias.${index}.abertura`}
                  id={`config-${index}-abertura`}
                  label={`Abertura de ${name}`}
                  options={timeOptions}
                  disabled={!day.aberto}
                  compactLabel
                />
                <SelectField
                  control={control}
                  name={`dias.${index}.fechamento`}
                  id={`config-${index}-fechamento`}
                  label={`Fechamento de ${name}`}
                  options={timeOptions}
                  disabled={!day.aberto}
                  compactLabel
                  error={errors.dias?.[index]?.fechamento?.message}
                />
              </Box>
            );
          })}
        </Box>
      </Section>

      <Section id="config-reservas" title="Reservas">
        <Box
          sx={{
            display: 'grid',
            gap: 3,
            gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' },
          }}
        >
          <SelectField
            control={control}
            name="duracao_max_minutos"
            id="config-duracao"
            label="Duração máxima de uma reserva"
            options={durationOptions}
          />
          <FormTextField
            id="config-antecedencia"
            label="Antecedência máxima (dias)"
            helperText="Até quantos dias à frente dá para reservar."
            inputMode="numeric"
            registration={register('antecedencia_max_dias')}
            error={errors.antecedencia_max_dias?.message}
          />
          <FormTextField
            id="config-limite-aluno"
            label="Reservas futuras por aluno"
            helperText="Quantas reservas um aluno pode ter ao mesmo tempo."
            inputMode="numeric"
            registration={register('limite_ativas_aluno')}
            error={errors.limite_ativas_aluno?.message}
          />
          <FormTextField
            id="config-limite-professor"
            label="Reservas futuras por professor"
            helperText="A administração não tem limite."
            inputMode="numeric"
            registration={register('limite_ativas_professor')}
            error={errors.limite_ativas_professor?.message}
          />
        </Box>
      </Section>

      <Section id="config-checkin" title="Check-in pela porta">
        <Box
          sx={{
            display: 'grid',
            gap: 3,
            gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' },
          }}
        >
          <SelectField
            control={control}
            name="checkin_tolerancia_min"
            id="config-tolerancia"
            label="Prazo para o check-in"
            helperText="Sem check-in nesse prazo depois do início, a sala é liberada."
            options={toleranceOptions}
          />
          <SelectField
            control={control}
            name="checkin_antecedencia_min"
            id="config-janela"
            label="Check-in liberado a partir de"
            helperText="Quanto antes do início quem reservou já pode ler o QR da porta."
            options={leadOptions}
          />
        </Box>
      </Section>

      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={1.5}
        sx={{ borderTop: 1, borderColor: 'divider', pt: 3, mt: 4 }}
      >
        <Button type="submit" variant="contained" disabled={save.isPending}>
          {save.isPending ? 'Salvando…' : 'Salvar configurações'}
        </Button>
        <Button
          variant="outlined"
          disabled={!isDirty || save.isPending}
          onClick={() => reset(settingsFormValues(settings))}
        >
          Descartar alterações
        </Button>
      </Stack>
    </form>
  );
}

export default function AdminSettingsPage() {
  const query = useAdminSettings();
  const failure = loadFailure(query);

  return (
    <>
      <PageHeader
        title="Configurações"
        description="Horário do campus e regras que valem para todas as reservas."
        breadcrumbs={[{ label: 'Administração', to: paths.admin }, { label: 'Configurações' }]}
      />
      {failure ? (
        <LoadError error={failure} onRetry={() => void query.refetch()} />
      ) : query.data ? (
        <SettingsForm settings={query.data} />
      ) : (
        <Box aria-busy="true" aria-label="Carregando configurações">
          {Array.from({ length: 6 }, (_, index) => (
            <Skeleton key={index} variant="rectangular" height={56} sx={{ mt: index ? 2 : 0 }} />
          ))}
        </Box>
      )}
    </>
  );
}
