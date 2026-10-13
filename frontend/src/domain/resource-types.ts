import CoPresentSharp from '@mui/icons-material/CoPresentSharp';
import DevicesOtherSharp from '@mui/icons-material/DevicesOtherSharp';
import MeetingRoomSharp from '@mui/icons-material/MeetingRoomSharp';
import ScienceSharp from '@mui/icons-material/ScienceSharp';
import type SvgIcon from '@mui/material/SvgIcon';

import type { ResourceRead, ResourceType } from '@/lib/api/types';

export const resourceTypeLabels: Record<ResourceType, string> = {
  SALA_ESTUDO: 'Sala de estudo',
  LABORATORIO: 'Laboratório',
  AUDITORIO: 'Auditório',
  EQUIPAMENTO: 'Equipamento',
};

export const resourceTypeIcons: Record<ResourceType, typeof SvgIcon> = {
  SALA_ESTUDO: MeetingRoomSharp,
  LABORATORIO: ScienceSharp,
  AUDITORIO: CoPresentSharp,
  EQUIPAMENTO: DevicesOtherSharp,
};

/** "Até 6 pessoas" para espaços; equipamento não tem lotação. */
export function capacityLabel(resource: Pick<ResourceRead, 'capacidade'>): string | null {
  if (resource.capacidade === null) return null;
  return resource.capacidade === 1 ? 'Até 1 pessoa' : `Até ${resource.capacidade} pessoas`;
}

/** "Bloco A · Térreo", ou só o bloco quando o andar não foi informado. */
export function locationLabel(resource: Pick<ResourceRead, 'bloco' | 'andar'>): string {
  return resource.andar ? `${resource.bloco.nome} · ${resource.andar}` : resource.bloco.nome;
}
