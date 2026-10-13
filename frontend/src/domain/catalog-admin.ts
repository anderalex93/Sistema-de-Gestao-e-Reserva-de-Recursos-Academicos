import type { RemovalRead, ResourceAdminRead } from '@/lib/api/types';

export type ResourceSituation = 'ATIVO' | 'DESATIVADO' | 'BLOCO_DESATIVADO';

export const situationLabels: Record<ResourceSituation, string> = {
  ATIVO: 'Ativo',
  DESATIVADO: 'Desativado',
  BLOCO_DESATIVADO: 'Bloco desativado',
};

/** Recurso ativo num bloco desativado também some da busca: a tela precisa dizer por quê. */
export function resourceSituation(resource: ResourceAdminRead): ResourceSituation {
  if (!resource.ativo) return 'DESATIVADO';
  return resource.bloco.ativo ? 'ATIVO' : 'BLOCO_DESATIVADO';
}

function cancelledLabel(count: number): string {
  if (count === 0) return '';
  return count === 1 ? ' Cancelamos 1 reserva futura.' : ` Cancelamos ${count} reservas futuras.`;
}

/** Aviso depois de remover: o backend decide entre excluir e desativar (ADR 0002). */
export function removalMessage(name: string, result: RemovalRead): string {
  if (result.resultado === 'EXCLUIDO') return `Excluímos ${name} do catálogo.`;
  return (
    `Desativamos ${name}. Não aparece mais na busca e o histórico continua.` +
    cancelledLabel(result.reservas_canceladas)
  );
}
