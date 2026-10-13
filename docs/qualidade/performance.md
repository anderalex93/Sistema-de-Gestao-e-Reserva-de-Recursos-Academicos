# Performance: RNF02 (consultas em até 2 segundos)

- **Issue:** #33
- **Data da medição local:** 13/10/2026
- **Resultado:** p95 de **45 ms** na busca e na disponibilidade e de **85 ms** no quadro do dia,
  com 30 usuários simultâneos e zero erros. O limite do RNF02 é 2.000 ms.

## Como foi medido

| Item | Valor |
|---|---|
| Massa | `make seed-volume`: 100 recursos em 4 blocos, 200 contas e **19.557 reservas** em 60 dias (30 antes e 30 depois de hoje), ~10% canceladas |
| Banco | PostgreSQL 16.14 (Docker), banco separado `eduspace_perf`, depois de `ANALYZE` |
| API | `uvicorn` com 1 processo, sem reload e sem access log, na mesma máquina |
| Carga | Locust ([backend/tests/load/locustfile.py](../../backend/tests/load/locustfile.py)): **30 usuários virtuais por 2 minutos**, rampa de 5/s, pausa de 1 a 3 s entre ações |
| Mistura | 4 buscas (30% com horário livre, o filtro mais caro), 4 consultas de disponibilidade e 1 quadro do dia, a cada 9 ações |

Para repetir:

```bash
cd backend
DATABASE_URL=.../eduspace_perf make migrate seed seed-volume   # com SEED_VOLUME_SENHA definida
LOAD_EMAIL=carga0001@umj.edu.br LOAD_SENHA=... \
  uv run --with locust locust -f tests/load/locustfile.py --host http://127.0.0.1:8000 \
  --headless -u 30 -r 5 -t 2m --csv ../docs/qualidade/carga
```

## Resultado local

1.709 requisições, 14,6 por segundo, **0 falhas**.

| Consulta | Requisições | p50 | p95 | p99 | Máximo |
|---|---|---|---|---|---|
| Busca (`GET /recursos`) | 756 | 20 ms | 45 ms | 74 ms | 130 ms |
| Disponibilidade (`GET /recursos/{id}/disponibilidade`) | 757 | 21 ms | 45 ms | 100 ms | 132 ms |
| Quadro do dia (`GET /quadro`) | 196 | 51 ms | 85 ms | 120 ms | 126 ms |
| **Todas** | 1.709 | 21 ms | 59 ms | 93 ms | 132 ms |

## O que foi otimizado

1. **Sobreposição pelo índice GiST.** As consultas de reservas confirmadas que tocam um horário
   (disponibilidade, quadro e o filtro "livre em" da busca) passaram a usar o mesmo predicado da
   exclusion constraint, `tstzrange(inicio, fim, '[)') && ...` com `status = 'CONFIRMADA'`
   ([overlap.py](../../backend/app/repositories/overlap.py)). Assim o Postgres usa o índice GiST
   `reserva_sem_sobreposicao` e lê só as reservas que realmente se sobrepõem, em vez de todo o
   histórico anterior do recurso. Com a massa acima:

   | Consulta | Páginas lidas antes | Depois |
   |---|---|---|
   | Busca com horário livre | 3.160 | 103 |
   | Disponibilidade de um recurso | 37 | 10 |
   | Quadro do dia | 3.150 | 90 |

   O ganho cresce com o histórico: antes, cada dia a mais de reservas passadas aumentava a leitura.
2. **Índice `reserva (recurso_id, inicio)`** (migração `096bf8b78ba4`), para as consultas que não
   se limitam às confirmadas: agenda do admin e histórico.
3. **Sem N+1.** Bloco vem na mesma consulta do recurso (`joined`/`contains_eager`), características
   numa segunda consulta para a página inteira (`selectin`), e o quadro busca as reservas de todos
   os recursos do dia numa consulta só.
4. **Header `X-Process-Time`** em toda resposta e log `Slow request` acima de
   `REQUISICAO_LENTA_MS` (500 ms), com método e caminho, nunca a query string.

## Pendente: medição em produção

O critério de aceite pede o p95 **na API de produção**, que depende do deploy (#19). Depois do
deploy: rodar o seed de volume num banco de medição do Neon (nunca no de demonstração), repetir o
comando acima com `--host` apontando para a API do Render já aquecida e acrescentar aqui uma
tabela "Resultado em produção". No plano gratuito do Render a primeira requisição depois de
ociosidade demora vários segundos (cold start); por isso o teste começa com a API aquecida.

## Anexo: `EXPLAIN (ANALYZE, BUFFERS)` com a massa de volume

### Busca com horário livre (GET /recursos?inicio&fim)

```
Limit (actual time=2.036..2.039 rows=8 loops=1)
  Buffers: shared hit=103
  ->  Sort (actual time=2.034..2.037 rows=8 loops=1)
        Sort Key: bloco.nome, (CASE recurso.tipo WHEN 'SALA_ESTUDO'::text THEN 0 WHEN 'LABORATORIO'::text THEN 1 WHEN 'AUDITORIO'::text THEN 2 WHEN 'EQUIPAMENTO'::text THEN 3 ELSE NULL::integer END), recurso.nome, recurso.id
        Sort Method: quicksort  Memory: 27kB
        Buffers: shared hit=103
        ->  Nested Loop (actual time=1.841..1.858 rows=8 loops=1)
              Join Filter: (recurso.bloco_id = bloco.id)
              Rows Removed by Join Filter: 21
              Buffers: shared hit=94
              ->  Hash Right Anti Join (actual time=1.830..1.835 rows=8 loops=1)
                    Hash Cond: (reserva.recurso_id = recurso.id)
                    Buffers: shared hit=86
                    ->  Bitmap Heap Scan on reserva (actual time=1.628..1.685 rows=118 loops=1)
                          Recheck Cond: ((tstzrange(inicio, fim, '[)'::text) && '["2026-10-15 13:00:00+00","2026-10-15 15:00:00+00")'::tstzrange) AND ((status)::text = 'CONFIRMADA'::text))
                          Heap Blocks: exact=8
                          Buffers: shared hit=84
                          ->  Bitmap Index Scan on reserva_sem_sobreposicao (actual time=1.613..1.613 rows=118 loops=1)
                                Index Cond: (tstzrange(inicio, fim, '[)'::text) && '["2026-10-15 13:00:00+00","2026-10-15 15:00:00+00")'::tstzrange)
                                Buffers: shared hit=76
                    ->  Hash (actual time=0.086..0.087 rows=100 loops=1)
                          Buckets: 1024  Batches: 1  Memory Usage: 20kB
                          Buffers: shared hit=2
                          ->  Seq Scan on recurso (actual time=0.011..0.046 rows=100 loops=1)
                                Filter: ativo
                                Buffers: shared hit=2
              ->  Seq Scan on bloco (actual time=0.001..0.001 rows=4 loops=8)
                    Filter: ativo
                    Buffers: shared hit=8
Planning:
  Buffers: shared hit=345
Planning Time: 4.025 ms
Execution Time: 3.351 ms
```

### Disponibilidade de um recurso no dia (GET /recursos/{id}/disponibilidade)

```
Sort (actual time=0.102..0.103 rows=3 loops=1)
  Sort Key: reserva.inicio
  Sort Method: quicksort  Memory: 25kB
  Buffers: shared hit=10
  ->  Nested Loop (actual time=0.049..0.055 rows=3 loops=1)
        Buffers: shared hit=7
        ->  Nested Loop (actual time=0.013..0.017 rows=1 loops=1)
              Join Filter: (recurso_1.bloco_id = bloco_1.id)
              Buffers: shared hit=3
              ->  Seq Scan on recurso recurso_1 (actual time=0.008..0.013 rows=1 loops=1)
                    Filter: (id = '50'::bigint)
                    Rows Removed by Filter: 99
                    Buffers: shared hit=2
              ->  Seq Scan on bloco bloco_1 (actual time=0.001..0.001 rows=1 loops=1)
                    Buffers: shared hit=1
        ->  Bitmap Heap Scan on reserva (actual time=0.033..0.033 rows=3 loops=1)
              Recheck Cond: ((recurso_id = '50'::bigint) AND (tstzrange(inicio, fim, '[)'::text) && '["2026-10-15 03:00:00+00","2026-10-16 03:00:00+00")'::tstzrange) AND ((status)::text = 'CONFIRMADA'::text))
              Heap Blocks: exact=1
              Buffers: shared hit=4
              ->  Bitmap Index Scan on reserva_sem_sobreposicao (actual time=0.029..0.029 rows=3 loops=1)
                    Index Cond: ((recurso_id = '50'::bigint) AND (tstzrange(inicio, fim, '[)'::text) && '["2026-10-15 03:00:00+00","2026-10-16 03:00:00+00")'::tstzrange))
                    Buffers: shared hit=3
Planning:
  Buffers: shared hit=46
Planning Time: 0.613 ms
Execution Time: 0.209 ms
```

### Quadro do dia, todos os recursos (GET /quadro)

```
Sort (actual time=2.391..2.411 rows=379 loops=1)
  Sort Key: reserva.recurso_id, reserva.inicio
  Sort Method: quicksort  Memory: 128kB
  Buffers: shared hit=90
  ->  Hash Join (actual time=1.649..2.011 rows=379 loops=1)
        Hash Cond: (recurso_1.id = recurso.id)
        Buffers: shared hit=90
        ->  Hash Join (actual time=1.572..1.835 rows=379 loops=1)
              Hash Cond: (recurso_1.bloco_id = bloco_1.id)
              Buffers: shared hit=88
              ->  Hash Join (actual time=1.534..1.710 rows=379 loops=1)
                    Hash Cond: (reserva.recurso_id = recurso_1.id)
                    Buffers: shared hit=87
                    ->  Bitmap Heap Scan on reserva (actual time=1.432..1.477 rows=379 loops=1)
                          Recheck Cond: ((tstzrange(inicio, fim, '[)'::text) && '["2026-10-15 03:00:00+00","2026-10-16 03:00:00+00")'::tstzrange) AND ((status)::text = 'CONFIRMADA'::text))
                          Heap Blocks: exact=8
                          Buffers: shared hit=85
                          ->  Bitmap Index Scan on reserva_sem_sobreposicao (actual time=1.423..1.424 rows=379 loops=1)
                                Index Cond: (tstzrange(inicio, fim, '[)'::text) && '["2026-10-15 03:00:00+00","2026-10-16 03:00:00+00")'::tstzrange)
                                Buffers: shared hit=77
                    ->  Hash (actual time=0.074..0.074 rows=100 loops=1)
                          Buckets: 1024  Batches: 1  Memory Usage: 20kB
                          Buffers: shared hit=2
                          ->  Seq Scan on recurso recurso_1 (actual time=0.005..0.025 rows=100 loops=1)
                                Buffers: shared hit=2
              ->  Hash (actual time=0.016..0.016 rows=4 loops=1)
                    Buckets: 1024  Batches: 1  Memory Usage: 9kB
                    Buffers: shared hit=1
                    ->  Seq Scan on bloco bloco_1 (actual time=0.006..0.007 rows=4 loops=1)
                          Buffers: shared hit=1
        ->  Hash (actual time=0.054..0.055 rows=100 loops=1)
              Buckets: 1024  Batches: 1  Memory Usage: 12kB
              Buffers: shared hit=2
              ->  Seq Scan on recurso (actual time=0.011..0.024 rows=100 loops=1)
                    Buffers: shared hit=2
Planning:
  Buffers: shared hit=20
Planning Time: 1.538 ms
Execution Time: 2.776 ms
```

