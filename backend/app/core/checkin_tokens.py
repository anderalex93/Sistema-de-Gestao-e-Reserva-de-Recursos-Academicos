"""Token do QR Code de check-in de cada recurso (#43)."""

import secrets

# 16 bytes aleatórios viram 22 caracteres URL-safe; a coluna aceita até 32.
CHECKIN_TOKEN_BYTES = 16


def new_checkin_token() -> str:
    """Imprevisível, para ninguém fazer check-in sem estar diante do QR Code do espaço."""
    return secrets.token_urlsafe(CHECKIN_TOKEN_BYTES)
