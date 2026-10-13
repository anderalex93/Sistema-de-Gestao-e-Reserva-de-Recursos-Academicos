import CheckSharp from '@mui/icons-material/CheckSharp';
import SearchSharp from '@mui/icons-material/SearchSharp';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import FormControl from '@mui/material/FormControl';
import FormLabel from '@mui/material/FormLabel';
import InputAdornment from '@mui/material/InputAdornment';
import MenuItem from '@mui/material/MenuItem';
import OutlinedInput from '@mui/material/OutlinedInput';
import Select from '@mui/material/Select';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useEffect, useId, useRef, useState, type ReactNode } from 'react';

import type { ResourceSearch } from '@/domain/resource-search';
import { resourceTypeLabels } from '@/domain/resource-types';
import {
  campusToday,
  endOptions,
  hoursOn,
  isBefore,
  startOptions,
  type WeeklyHours,
} from '@/domain/schedule';
import type { BuildingRead, FeatureRead, ResourceType } from '@/lib/api/types';
import { colors } from '@/theme/tokens';

const ANY = '';
const SEARCH_DEBOUNCE_MS = 300;
const labelSx = { mb: 0.75, fontWeight: 700, fontSize: '0.875rem', color: 'text.primary' };

interface SearchFiltersFormProps {
  search: ResourceSearch;
  onChange: (patch: Partial<ResourceSearch>) => void;
  buildings: readonly BuildingRead[];
  features: readonly FeatureRead[];
  weeklyHours: WeeklyHours;
  /** Última data reservável (`AAAA-MM-DD`). */
  maxDate: string;
}

function Field({ id, label, children }: { id: string; label: string; children: ReactNode }) {
  return (
    <FormControl fullWidth>
      <FormLabel id={`${id}-rotulo`} htmlFor={id} sx={labelSx}>
        {label}
      </FormLabel>
      {children}
    </FormControl>
  );
}

/** Campos da busca. Cada mudança é aplicada na hora (e vai para a URL). */
export function SearchFiltersForm({
  search,
  onChange,
  buildings,
  features,
  weeklyHours,
  maxDate,
}: SearchFiltersFormProps) {
  const id = useId();
  const today = campusToday();
  const starts = startOptions(search.data, weeklyHours);
  const ends = endOptions(search.data, search.inicio, weeklyHours);
  const closedDay = search.data !== null && hoursOn(search.data, weeklyHours) === null;

  // O texto digitado vai para a URL depois de uma pausa. Quando a URL muda por fora
  // ("Limpar filtros"), o campo acompanha, sem apagar o espaço que a pessoa acabou de digitar.
  const [busca, setBusca] = useState(search.busca);
  const [urlBusca, setUrlBusca] = useState(search.busca);
  if (search.busca !== urlBusca) {
    setUrlBusca(search.busca);
    if (busca.trim() !== search.busca) setBusca(search.busca);
  }
  const typingTimer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(typingTimer.current), []);
  const typeBusca = (value: string) => {
    setBusca(value);
    window.clearTimeout(typingTimer.current);
    typingTimer.current = window.setTimeout(
      () => onChange({ busca: value.trim() }),
      SEARCH_DEBOUNCE_MS,
    );
  };

  const toggleFeature = (featureId: number) => {
    const selected = search.caracteristicas.includes(featureId)
      ? search.caracteristicas.filter((current) => current !== featureId)
      : [...search.caracteristicas, featureId];
    onChange({ caracteristicas: selected });
  };

  const changeStart = (inicio: string) =>
    onChange({
      inicio: inicio || null,
      // Fim que deixou de fazer sentido some, em vez de virar um intervalo invertido.
      fim: inicio && search.fim && !isBefore(inicio, search.fim) ? null : search.fim,
    });

  return (
    <Stack spacing={2.5}>
      <Box
        sx={{
          display: 'grid',
          gap: 2,
          gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 190px), 1fr))',
        }}
      >
        <Field id={`${id}-busca`} label="Nome">
          <OutlinedInput
            id={`${id}-busca`}
            value={busca}
            onChange={(event) => typeBusca(event.target.value)}
            placeholder="Ex.: Sala 204"
            startAdornment={
              <InputAdornment position="start">
                <SearchSharp aria-hidden />
              </InputAdornment>
            }
          />
        </Field>

        <Field id={`${id}-bloco`} label="Bloco">
          <Select
            id={`${id}-bloco`}
            labelId={`${id}-bloco-rotulo`}
            value={search.bloco_id === null ? ANY : String(search.bloco_id)}
            onChange={(event) =>
              onChange({ bloco_id: event.target.value ? Number(event.target.value) : null })
            }
            displayEmpty
          >
            <MenuItem value={ANY}>Todos os blocos</MenuItem>
            {buildings.map((building) => (
              <MenuItem key={building.id} value={String(building.id)}>
                {building.nome}
              </MenuItem>
            ))}
          </Select>
        </Field>

        <Field id={`${id}-tipo`} label="Tipo">
          <Select
            id={`${id}-tipo`}
            labelId={`${id}-tipo-rotulo`}
            value={search.tipo ?? ANY}
            onChange={(event) =>
              onChange({ tipo: (event.target.value as ResourceType | typeof ANY) || null })
            }
            displayEmpty
          >
            <MenuItem value={ANY}>Todos os tipos</MenuItem>
            {Object.entries(resourceTypeLabels).map(([value, label]) => (
              <MenuItem key={value} value={value}>
                {label}
              </MenuItem>
            ))}
          </Select>
        </Field>

        <Field id={`${id}-capacidade`} label="Pessoas (mínimo)">
          <OutlinedInput
            id={`${id}-capacidade`}
            type="number"
            value={search.capacidade_min ?? ''}
            onChange={(event) => {
              const value = Number.parseInt(event.target.value, 10);
              onChange({ capacidade_min: value > 0 ? Math.min(value, 1000) : null });
            }}
            slotProps={{ input: { min: 1, max: 1000, inputMode: 'numeric' } }}
          />
        </Field>
      </Box>

      <Box component="fieldset" sx={{ border: 0, m: 0, p: 0, minWidth: 0 }}>
        <Typography component="legend" sx={{ ...labelSx, mb: 0.5 }}>
          Livre em
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1.25 }}>
          Escolha data, início e fim para ver só o que está livre nesse horário.
        </Typography>
        {closedDay && (
          <Typography component="output" sx={{ display: 'block', mb: 1.25, fontWeight: 500 }}>
            O campus não abre neste dia. Escolha outra data.
          </Typography>
        )}
        <Box
          sx={{
            display: 'grid',
            gap: 2,
            gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 150px), 1fr))',
          }}
        >
          <Field id={`${id}-data`} label="Data">
            <OutlinedInput
              id={`${id}-data`}
              type="date"
              value={search.data ?? ''}
              onChange={(event) => {
                // `AAAA-MM-DD` compara em ordem de calendário.
                const value = event.target.value;
                const data = value >= today && value <= maxDate ? value : null;
                const keepTimes =
                  !data ||
                  (search.inicio !== null &&
                    startOptions(data, weeklyHours).includes(search.inicio));
                onChange({ data, ...(keepTimes ? {} : { inicio: null, fim: null }) });
              }}
              slotProps={{ input: { min: today, max: maxDate } }}
            />
          </Field>
          <Field id={`${id}-inicio`} label="Início">
            <Select
              id={`${id}-inicio`}
              labelId={`${id}-inicio-rotulo`}
              value={search.inicio ?? ANY}
              onChange={(event) => changeStart(event.target.value)}
              displayEmpty
              MenuProps={{ slotProps: { paper: { sx: { maxHeight: 320 } } } }}
            >
              <MenuItem value={ANY}>Qualquer</MenuItem>
              {starts.map((time) => (
                <MenuItem key={time} value={time}>
                  {time}
                </MenuItem>
              ))}
            </Select>
          </Field>
          <Field id={`${id}-fim`} label="Fim">
            <Select
              id={`${id}-fim`}
              labelId={`${id}-fim-rotulo`}
              value={search.fim ?? ANY}
              onChange={(event) => onChange({ fim: event.target.value || null })}
              displayEmpty
              MenuProps={{ slotProps: { paper: { sx: { maxHeight: 320 } } } }}
            >
              <MenuItem value={ANY}>Qualquer</MenuItem>
              {ends.map((time) => (
                <MenuItem key={time} value={time}>
                  {time}
                </MenuItem>
              ))}
            </Select>
          </Field>
        </Box>
      </Box>

      {features.length > 0 && (
        <Box component="fieldset" sx={{ border: 0, m: 0, p: 0, minWidth: 0 }}>
          <Typography component="legend" sx={{ ...labelSx, mb: 1 }}>
            Precisa ter
          </Typography>
          <Stack direction="row" useFlexGap sx={{ flexWrap: 'wrap', gap: 1 }}>
            {features.map((feature) => {
              const selected = search.caracteristicas.includes(feature.id);
              return (
                <Chip
                  key={feature.id}
                  label={feature.nome}
                  aria-pressed={selected}
                  onClick={() => toggleFeature(feature.id)}
                  icon={selected ? <CheckSharp aria-hidden /> : undefined}
                  variant={selected ? 'filled' : 'outlined'}
                  color={selected ? 'primary' : 'default'}
                  sx={{
                    height: 36,
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
        </Box>
      )}
    </Stack>
  );
}
