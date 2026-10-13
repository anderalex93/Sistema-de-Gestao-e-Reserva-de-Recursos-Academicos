"""Teste de carga do RNF02 (#33): busca, disponibilidade e quadro com 30 usuários virtuais.

Precisa de um banco com o seed de volume (`make seed-volume`) e de uma conta para entrar:

    LOAD_EMAIL=carga0001@umj.edu.br LOAD_SENHA=... \\
    uv run --with locust locust -f tests/load/locustfile.py --host http://127.0.0.1:8000 \\
        --headless -u 30 -r 5 -t 2m --csv ../docs/qualidade/carga

Um único login no início, compartilhado por todos os usuários virtuais: o login tem limite de
20 por minuto por IP e não é o que o RNF02 mede.
"""

import os
import random
from datetime import UTC, datetime, timedelta
from typing import Any
from zoneinfo import ZoneInfo

import requests
from locust import HttpUser, between, events, task
from locust.env import Environment

API = "/api/v1"
CAMPUS = ZoneInfo("America/Maceio")
TYPES = ("SALA_ESTUDO", "LABORATORIO", "AUDITORIO", "EQUIPAMENTO")


class SharedState:
    """Preenchido uma vez em `test_start` e lido por todos os usuários virtuais."""

    token = ""
    resource_ids: list[int] = []
    building_ids: list[int] = []


@events.test_start.add_listener
def sign_in_once(environment: Environment, **_kwargs: Any) -> None:
    base = f"{environment.host}{API}"
    login = requests.post(
        f"{base}/auth/login",
        json={"email": os.environ["LOAD_EMAIL"], "senha": os.environ["LOAD_SENHA"]},
        timeout=30,
    )
    login.raise_for_status()
    SharedState.token = login.json()["access_token"]
    headers = {"Authorization": f"Bearer {SharedState.token}"}
    buildings = requests.get(f"{base}/blocos", headers=headers, timeout=30).json()
    resources = requests.get(
        f"{base}/recursos", params={"per_page": 100}, headers=headers, timeout=30
    ).json()
    SharedState.building_ids = [building["id"] for building in buildings]
    SharedState.resource_ids = [resource["id"] for resource in resources["items"]]


def campus_day(offset: int) -> str:
    return (datetime.now(CAMPUS).date() + timedelta(days=offset)).isoformat()


class Student(HttpUser):
    wait_time = between(1, 3)

    def on_start(self) -> None:
        self.client.headers["Authorization"] = f"Bearer {SharedState.token}"

    @task(4)
    def search(self) -> None:
        params: dict[str, Any] = {"per_page": 24}
        choice = random.random()
        if choice < 0.3 and SharedState.building_ids:
            params["bloco_id"] = random.choice(SharedState.building_ids)
        elif choice < 0.5:
            params["tipo"] = random.choice(TYPES)
        elif choice < 0.6:
            params["capacidade_min"] = random.choice((4, 8, 12))
        elif choice < 0.9:
            # Horário livre: o filtro mais caro (subconsulta de sobreposição).
            start = datetime.now(UTC).replace(minute=0, second=0, microsecond=0) + timedelta(
                days=random.randint(1, 7), hours=random.randint(0, 6)
            )
            params["inicio"] = start.isoformat()
            params["fim"] = (start + timedelta(hours=2)).isoformat()
        self.client.get(f"{API}/recursos", params=params, name="busca")

    @task(4)
    def availability(self) -> None:
        self.client.get(
            f"{API}/recursos/{random.choice(SharedState.resource_ids)}/disponibilidade",
            params={"data": campus_day(random.randint(-3, 10))},
            name="disponibilidade",
        )

    @task(1)
    def board(self) -> None:
        self.client.get(
            f"{API}/quadro", params={"data": campus_day(random.randint(0, 7))}, name="quadro"
        )
