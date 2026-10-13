"""Limite de tentativas por IP em login, cadastro e verificação pública de comprovante.

O campus sai para a internet por poucos IPs (NAT), então os limites são folgados: o objetivo é
barrar força bruta, não estudantes na mesma rede. Em produção atrás de proxy, o uvicorn precisa
de `--proxy-headers` para enxergar o IP real (issue #19).
"""

from slowapi import Limiter
from slowapi.util import get_remote_address

LOGIN_LIMIT = "20/minute"
SIGNUP_LIMIT = "10/minute"
# Quem confere na porta abre poucos comprovantes; mais que isso parece varredura de códigos.
RECEIPT_LIMIT = "60/minute"

limiter = Limiter(key_func=get_remote_address)
