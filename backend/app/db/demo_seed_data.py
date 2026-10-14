"""Pessoas e cenário do seed de demonstração (`make seed-demo`, issue #38).

Sustenta o roteiro de docs/apresentacao/roteiro.md: as três contas usadas ao vivo, pessoas
fictícias donas das reservas e os espaços que a demo precisa encontrar livres ou ocupados.
"""

from dataclasses import dataclass
from datetime import time

from app.core.enums import UserRole


@dataclass(frozen=True, slots=True)
class DemoPerson:
    nome: str
    email: str
    perfil: UserRole


@dataclass(frozen=True, slots=True)
class DemoSlot:
    """Recurso do catálogo (bloco e nome) num horário local do dia."""

    bloco: str
    nome: str
    inicio: time
    fim: time


LUCAS = DemoPerson("Lucas Andrade", "aluno.demo@umj.edu.br", UserRole.ALUNO)
MARINA = DemoPerson("Marina Lopes", "prof.demo@umj.edu.br", UserRole.PROFESSOR)
ADMIN = DemoPerson("Administração Demo", "admin.demo@umj.edu.br", UserRole.ADMIN)

# Contas usadas ao vivo: a senha vem de SEED_DEMO_SENHA e é redefinida a cada execução.
ACCOUNTS: tuple[DemoPerson, ...] = (LUCAS, MARINA, ADMIN)

# Só donas de reservas: senha inutilizável, ninguém entra com elas.
PEOPLE: tuple[DemoPerson, ...] = (
    DemoPerson("Ana Beatriz Souza", "ana.souza@umj.edu.br", UserRole.ALUNO),
    DemoPerson("Gabriel Nascimento", "gabriel.nascimento@umj.edu.br", UserRole.ALUNO),
    DemoPerson("Júlia Ferreira", "julia.ferreira@umj.edu.br", UserRole.ALUNO),
    DemoPerson("Rafael Oliveira", "rafael.oliveira@umj.edu.br", UserRole.ALUNO),
    DemoPerson("Camila Rocha", "camila.rocha@umj.edu.br", UserRole.ALUNO),
    DemoPerson("Pedro Henrique Lima", "pedro.lima@umj.edu.br", UserRole.ALUNO),
    DemoPerson("Larissa Barbosa", "larissa.barbosa@umj.edu.br", UserRole.ALUNO),
    DemoPerson("Thiago Cavalcanti", "thiago.cavalcanti@umj.edu.br", UserRole.ALUNO),
    DemoPerson("Carlos Eduardo Teixeira", "carlos.teixeira@umj.edu.br", UserRole.PROFESSOR),
    DemoPerson("Fernanda Moura", "fernanda.moura@umj.edu.br", UserRole.PROFESSOR),
    DemoPerson("Ricardo Albuquerque", "ricardo.albuquerque@umj.edu.br", UserRole.PROFESSOR),
    DemoPerson("Patrícia Gomes", "patricia.gomes@umj.edu.br", UserRole.PROFESSOR),
)

# Hoje, livres para a demo: a 204 do Bloco A das 19h às 21h (fluxo principal e conflito) e a
# grade inteira da 203 do Bloco B (aparece sozinha na busca por Sala de estudo + Projetor).
LIVE_ROOM_FREE = DemoSlot("Bloco A", "Sala de estudo 204", time(19), time(21))
FREE_ALL_DAY = ("Bloco B", "Sala de estudo 203")

# Hoje, ocupados por outras pessoas: o vizinho da 204 na grade e as outras salas com projetor,
# para a busca das 19h às 21h devolver só a 203 do Bloco B.
TODAY_BUSY: tuple[DemoSlot, ...] = (
    DemoSlot("Bloco A", "Sala de estudo 204", time(18), time(19)),
    DemoSlot("Bloco B", "Sala de estudo 201", time(19), time(21)),
    DemoSlot("Bloco B", "Sala de estudo 202", time(19, 30), time(21)),
)

# Reserva de hoje sem check-in que vira "não compareceu" na primeira leitura.
NO_SHOW_ROOM = ("Bloco C", "Laboratório Maker")

STUDY_ROOMS: tuple[tuple[str, str], ...] = (
    ("Bloco A", "Sala de estudo 101"),
    ("Bloco A", "Sala de estudo 202"),
    ("Bloco B", "Sala de estudo 102"),
    ("Bloco D", "Sala de estudo 301"),
)
LABS: tuple[tuple[str, str], ...] = (
    ("Bloco C", "Laboratório de Informática 1"),
    ("Bloco C", "Laboratório de Redes"),
    ("Bloco C", "Laboratório de Informática 2"),
)

PURPOSES_STUDY: tuple[str, ...] = (
    "Estudo em grupo",
    "Revisão para a prova",
    "Reunião do projeto integrador",
    "Preparação de seminário",
    "Monitoria",
)
PURPOSES_LAB: tuple[str, ...] = (
    "Aula prática",
    "Aula de reposição",
    "Projeto de extensão",
    "Treinamento de monitores",
)
PURPOSES_EVENT: tuple[str, ...] = (
    "Palestra",
    "Defesa de TCC",
    "Gravação de aula",
    "Semana acadêmica",
)
