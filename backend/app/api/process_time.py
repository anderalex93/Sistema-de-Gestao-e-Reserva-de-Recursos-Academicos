"""Tempo de cada requisição: header `X-Process-Time` e log das lentas (RNF02, #33)."""

import logging
import time

from starlette.types import ASGIApp, Message, Receive, Scope, Send

logger = logging.getLogger("app.performance")

HEADER = b"x-process-time"


class ProcessTimeMiddleware:
    """ASGI puro (sem `BaseHTTPMiddleware`), para não bufferizar a resposta.

    O tempo vai em milissegundos no header. Acima do limite, registra método, caminho e tempo:
    nunca a query string, que pode trazer nome ou e-mail digitado numa busca (LGPD).
    """

    def __init__(self, app: ASGIApp, slow_ms: float = 500) -> None:
        self._app = app
        self._slow_ms = slow_ms

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        if scope["type"] != "http":
            await self._app(scope, receive, send)
            return
        start = time.perf_counter()

        async def send_with_time(message: Message) -> None:
            if message["type"] == "http.response.start":
                elapsed_ms = (time.perf_counter() - start) * 1000
                message.setdefault("headers", []).append((HEADER, f"{elapsed_ms:.1f}".encode()))
                if elapsed_ms > self._slow_ms:
                    logger.warning(
                        "Slow request %s %s: %.0f ms (status %s)",
                        scope["method"],
                        scope["path"],
                        elapsed_ms,
                        message["status"],
                    )
            await send(message)

        await self._app(scope, receive, send_with_time)
