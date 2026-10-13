# ADR 0002 — Exclusão de blocos, recursos e características pela administração

- **Status:** Aceito
- **Data:** 13/10/2026
- **Decisores:** Ramon Albuquerque (Dev Full Stack)
- **Issue:** #27

## Contexto

A administração mantém o catálogo pela tela `/admin/recursos` (#27). Excluir precisa conviver com
duas exigências que puxam em sentidos opostos:

- o histórico não pode quebrar: reservas antigas e comprovantes apontam para o recurso
  (`reserva.recurso_id` é `RESTRICT`), e o DER já diz que nada com histórico é apagado;
- um recurso cadastrado por engano, que nunca foi reservado, não deveria ficar para sempre na
  lista como "desativado".

E há um terceiro caso: desativar um recurso que tem reservas confirmadas para os próximos dias.
Se o recurso simplesmente sumir da busca, essas pessoas chegam a uma sala que "não existe mais"
com um comprovante válido na mão.

## Decisão

### Recurso — `DELETE /api/v1/admin/recursos/{id}`

| Situação | Resultado |
|---|---|
| Nenhuma reserva, de qualquer status ou data | Exclusão física → `{"resultado": "EXCLUIDO"}` |
| Tem histórico e nenhuma reserva que ainda não começou | `ativo = false` → `{"resultado": "DESATIVADO"}` |
| Tem reservas confirmadas que ainda não começaram, sem `forcar` | **`409 RESERVAS_FUTURAS`**, com a quantidade na mensagem. Nada muda |
| O mesmo, com `?forcar=true` | Cancela essas reservas e desativa → `reservas_canceladas: N` |

Adotamos **as duas opções** da issue juntas: o 409 informa a quantidade e a confirmação explícita
(`forcar=true`) é o segundo passo. A tela faz exatamente isso: tenta desativar, e se receber
`RESERVAS_FUTURAS` mostra a mensagem e oferece "Cancelar reservas e desativar".

- "Futura" é `status = CONFIRMADA AND inicio > agora`. Reserva **em andamento** não é cancelada:
  a pessoa já está na sala, e ela vira histórico sozinha quando terminar.
- O cancelamento é feito em nome do admin (`cancelada_por_id`) com
  `motivo_cancelamento = "Recurso desativado pela administração."`, o mesmo campo que o
  cancelamento administrativo (#30) usa. Quem reservou vê a reserva cancelada no histórico.
- As reservas futuras são lidas com `SELECT ... FOR UPDATE`, para o cancelamento não sobrescrever
  um cancelamento feito pelo dono no mesmo instante.
- Reativar é `POST /admin/recursos/{id}/reativar`. O `PUT` não mexe em `ativo`, para que desativar
  passe sempre pela regra acima.

### Bloco — `DELETE /api/v1/admin/blocos/{id}`

Mesma regra, com o bloco como unidade: **sem recursos** é apagado; **com recursos** é desativado
(todos os recursos somem da busca) e as reservas futuras de todos eles passam pelo mesmo
409/`forcar`. Os recursos mantêm o próprio `ativo`: ao reativar o bloco, cada um volta como estava.

### Característica — `DELETE /api/v1/admin/caracteristicas/{id}`

Característica é só atributo de busca, sem histórico. A exclusão é física e retira a
característica de todos os recursos que a usam. A tela mostra em quantos recursos ela está antes
de confirmar.

### Validações

- Nome de recurso único **por bloco**; nome de bloco e de característica únicos. A comparação
  ignora maiúsculas no service ("sala 101" = "Sala 101"); as constraints únicas do banco seguem
  como garantia contra dois admins salvando ao mesmo tempo. Conflito → `409 *_JA_EXISTE`.
- Capacidade entre 1 e 1000, obrigatória exceto para `EQUIPAMENTO` (o banco já tem os `CHECK`).
- Criar ou mover um recurso só para bloco ativo (`422 BLOCO_INVALIDO`); um recurso que já está num
  bloco desativado pode ser editado sem trocar de bloco.

## Consequências

- O catálogo nunca perde histórico e não acumula lixo de cadastros errados.
- Desativar nunca deixa reserva confirmada para um recurso invisível.
- O front precisa tratar o 409 como pergunta, não como erro. Está centralizado no diálogo de
  desativação.
