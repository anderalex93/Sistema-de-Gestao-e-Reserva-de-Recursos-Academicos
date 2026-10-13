"""Catálogo inicial do campus usado pelo seed (`make seed`).

Os nomes são de demonstração: a administração ajusta tudo pela tela de patrimônio (#27).
"""

from dataclasses import dataclass

from app.core.enums import ResourceType


@dataclass(frozen=True, slots=True)
class BuildingSeed:
    nome: str
    descricao: str


@dataclass(frozen=True, slots=True)
class ResourceSeed:
    bloco: str
    nome: str
    tipo: ResourceType
    capacidade: int | None
    andar: str | None
    caracteristicas: tuple[str, ...]
    descricao: str | None = None


PROJETOR = "Projetor"
AR = "Ar-condicionado"
COMPUTADORES = "Computadores"
QUADRO = "Quadro branco"
TV = "TV para apresentação"
TOMADAS = "Tomadas nas mesas"
SOM = "Sistema de som"
ACESSIVEL = "Acessível para cadeirantes"
TRANSMISSAO = "Kit de transmissão"
PORTATIL = "Portátil"

FEATURES: tuple[str, ...] = (
    PROJETOR,
    AR,
    COMPUTADORES,
    QUADRO,
    TV,
    TOMADAS,
    SOM,
    ACESSIVEL,
    TRANSMISSAO,
    PORTATIL,
)

BUILDINGS: tuple[BuildingSeed, ...] = (
    BuildingSeed("Bloco A", "Entrada principal, ao lado da secretaria acadêmica."),
    BuildingSeed("Bloco B", "Atrás da praça de convivência."),
    BuildingSeed("Bloco C", "Laboratórios de informática e de saúde."),
    BuildingSeed("Bloco D", "Biblioteca, auditório e apoio audiovisual."),
)

SALA = ResourceType.SALA_ESTUDO
LAB = ResourceType.LABORATORIO
EQUIP = ResourceType.EQUIPAMENTO


def _study_rooms() -> tuple[ResourceSeed, ...]:
    rooms: list[ResourceSeed] = []
    layout = (
        ("Bloco A", "Térreo", 101, 4, (QUADRO, AR, ACESSIVEL)),
        ("Bloco A", "1º andar", 201, 4, (QUADRO, AR, TV, TOMADAS)),
        ("Bloco B", "Térreo", 101, 3, (QUADRO, ACESSIVEL)),
        ("Bloco B", "1º andar", 201, 3, (QUADRO, AR, PROJETOR)),
        ("Bloco D", "2º andar", 301, 6, (QUADRO, AR, TOMADAS, TV)),
    )
    for bloco, andar, first_number, count, features in layout:
        for offset in range(count):
            number = first_number + offset
            capacity = (4, 6, 8, 12)[number % 4]
            rooms.append(
                ResourceSeed(bloco, f"Sala de estudo {number}", SALA, capacity, andar, features)
            )
    return tuple(rooms)


RESOURCES: tuple[ResourceSeed, ...] = (
    *_study_rooms(),
    ResourceSeed(
        "Bloco C",
        "Laboratório de Informática 1",
        LAB,
        30,
        "Térreo",
        (COMPUTADORES, PROJETOR, AR, QUADRO, ACESSIVEL),
    ),
    ResourceSeed(
        "Bloco C",
        "Laboratório de Informática 2",
        LAB,
        30,
        "Térreo",
        (COMPUTADORES, PROJETOR, AR, QUADRO),
    ),
    ResourceSeed(
        "Bloco C",
        "Laboratório de Redes",
        LAB,
        20,
        "1º andar",
        (COMPUTADORES, PROJETOR, AR, TOMADAS),
    ),
    ResourceSeed(
        "Bloco C",
        "Laboratório de Anatomia",
        LAB,
        25,
        "1º andar",
        (PROJETOR, AR, QUADRO),
        "Uso acompanhado por técnico do laboratório.",
    ),
    ResourceSeed(
        "Bloco C",
        "Laboratório Maker",
        LAB,
        16,
        "2º andar",
        (COMPUTADORES, TOMADAS, QUADRO, TV),
        "Impressora 3D e bancadas de eletrônica.",
    ),
    ResourceSeed(
        "Bloco D",
        "Auditório Central",
        ResourceType.AUDITORIO,
        180,
        "Térreo",
        (PROJETOR, AR, SOM, ACESSIVEL, TRANSMISSAO),
        "Palco com púlpito, dois microfones sem fio e cabine de som.",
    ),
    ResourceSeed(
        "Bloco D",
        "Projetor Epson 01",
        EQUIP,
        None,
        None,
        (PROJETOR, PORTATIL),
        "Retirada no apoio audiovisual, térreo do Bloco D.",
    ),
    ResourceSeed(
        "Bloco D",
        "Projetor Epson 02",
        EQUIP,
        None,
        None,
        (PROJETOR, PORTATIL),
        "Retirada no apoio audiovisual, térreo do Bloco D.",
    ),
    ResourceSeed(
        "Bloco D",
        "Projetor Epson 03",
        EQUIP,
        None,
        None,
        (PROJETOR, PORTATIL),
        "Retirada no apoio audiovisual, térreo do Bloco D.",
    ),
    ResourceSeed(
        "Bloco A",
        "Projetor BenQ 01",
        EQUIP,
        None,
        None,
        (PROJETOR, PORTATIL),
        "Retirada na secretaria do Bloco A.",
    ),
    ResourceSeed(
        "Bloco D",
        "Kit de transmissão 01",
        EQUIP,
        None,
        None,
        (TRANSMISSAO, PORTATIL),
        "Câmera, tripé, microfone de lapela e placa de captura.",
    ),
    ResourceSeed(
        "Bloco D",
        "Kit de transmissão 02",
        EQUIP,
        None,
        None,
        (TRANSMISSAO, PORTATIL),
        "Câmera, tripé, microfone de lapela e placa de captura.",
    ),
    ResourceSeed(
        "Bloco D",
        "Caixa de som portátil",
        EQUIP,
        None,
        None,
        (SOM, PORTATIL),
        "Com microfone sem fio.",
    ),
    ResourceSeed(
        "Bloco A",
        "Notebook de apresentação",
        EQUIP,
        None,
        None,
        (COMPUTADORES, PORTATIL),
        "Com adaptador HDMI.",
    ),
)
