# Revisão LGPD dos endpoints da API

- **Issue:** #34
- **Data:** 13/10/2026
- **Escopo:** todos os endpoints de `/api/v1`, quanto aos dados pessoais que recebem e devolvem.

Dados pessoais tratados pelo EduSpace: **nome**, **e-mail**, **matrícula** (opcional), **perfil**,
**data do aceite dos termos** e o **histórico de reservas** (hábitos de uso). Não há dado sensível
(Art. 5º, II). Base legal: Art. 7º, V (execução do serviço pedido pelo titular).

## Por endpoint

| Endpoint | Quem acessa | Dado pessoal exposto | Avaliação |
|---|---|---|---|
| `POST /auth/cadastro` | Público | Recebe nome, e-mail, senha, matrícula e o aceite; devolve a própria conta | Aceite obrigatório, data gravada em `aceite_termos_em`. Senha só como hash Argon2. Limite de 10/min por IP |
| `POST /auth/login` | Público | Devolve a própria conta | Mesma mensagem para e-mail inexistente e senha errada (não revela quem tem conta). Limite de 20/min |
| `GET /auth/me` | Logado | A própria conta | OK |
| `POST /auth/me/aceite-termos` | Logado | A própria conta | Conta criada pelo admin aceita no primeiro acesso. A data original não é sobrescrita |
| `GET /auth/me/dados` | Logado | A própria conta e todas as reservas dela | Direito de acesso e portabilidade (Art. 18, II e V). Sem `senha_hash` |
| `POST /auth/me/exclusao` | Logado | Nenhum | Eliminação (Art. 18, VI). Pede a senha, limite de 20/min. A conta é anonimizada; as reservas ficam sem identificar ninguém (Art. 16, IV). Admin não se exclui por aqui |
| `GET /blocos`, `/caracteristicas`, `/recursos`, `/recursos/{id}` | Logado | Nenhum | Catálogo |
| `GET /recursos/{id}/disponibilidade` | Logado | `reservado_por` (nome) **só para admin**; para os demais, só `propria` | Minimização revisada (#22) |
| `GET /quadro` | Logado | `reservado_por` **só para admin** | Minimização revisada (#51) |
| `POST /reservas`, `GET /reservas/minhas`, `GET /reservas/{id}`, `POST /reservas/{id}/cancelar` | Logado | Só reservas da própria pessoa; a de outra pessoa responde 404 | OK |
| `GET /reservas/comprovante/{codigo}` | Público | **Primeiro nome** de quem reservou | Minimização revisada (#24): sem e-mail, matrícula nem sobrenome. Limite de 60/min contra varredura de códigos |
| `GET /config/regras`, `GET /health` | Público / logado | Nenhum | OK |
| `GET/POST/PATCH /admin/usuarios` | Admin | Nome, e-mail, matrícula, perfil e situação de todas as contas | Necessário para administrar acessos. 403 para os demais perfis |
| `GET /admin/reservas`, `POST /admin/reservas/{id}/cancelar` | Admin | Nome e e-mail de quem reservou | Para avisar a pessoa num cancelamento administrativo; sem matrícula. O motivo vai para o dono; a tela orienta a não escrever dado pessoal |
| `/admin/blocos`, `/admin/recursos`, `/admin/caracteristicas` | Admin | Nenhum | Catálogo |

## Logs

- A aplicação não registra senha, token, e-mail nem corpo de requisição. O handler de erro grava
  só método, caminho e tipo da exceção. O seed mascara o e-mail do admin (`a***@umj.edu.br`).
- **Pendente (#19):** o access log do servidor em produção registra a query string; a busca de
  usuários do admin (`?busca=`) pode conter nome ou e-mail. Desligar o access log do uvicorn ou
  filtrar a query string no deploy.

## Retenção

Definida na Política de Privacidade (`/privacidade`): conta enquanto a pessoa usar o sistema ou
até pedir a exclusão; reservas por até 2 anos após a data da reserva, para histórico e
estatística de uso. **A eliminação automática após 2 anos ainda não está implementada** (job de
anonimização a fazer antes de o sistema completar um ano de uso).

## Fora do escopo do MVP

- Troca de senha obrigatória no primeiro acesso de conta criada pelo admin depende da troca de
  senha (#42).
- Indicação formal do encarregado (DPO) pela UMJ: a política aponta o canal da administração do
  campus até a indicação.
