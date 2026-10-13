"""Código curto do comprovante, fácil de ditar e de digitar na porta da sala."""

import secrets
from typing import Protocol

# Sem 0, O, 1, I e L, que se confundem ao ler ou ditar.
ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ"
PREFIX = "EDU-"
LENGTH = 6


class CodeGenerator(Protocol):
    def new(self) -> str: ...


class RandomCodeGenerator:
    """`EDU-` + 6 caracteres: 31^6, cerca de 887 milhões de combinações."""

    def new(self) -> str:
        return PREFIX + "".join(secrets.choice(ALPHABET) for _ in range(LENGTH))
