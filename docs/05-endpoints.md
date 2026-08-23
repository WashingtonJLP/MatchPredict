# Endpoints da API

## Visão Geral

A API do MatchPredict é uma API REST implementada em NestJS.

Base URL local:

```text
http://localhost:3000/api/v1
```

No `compose.yaml`, o backend é exposto na máquina host em `127.0.0.1:3001`, apontando para a porta `3000` do container.

Todas as rotas abaixo já incluem o prefixo global `/api/v1`.

## Autenticação

Endpoints protegidos usam JWT no header:

```http
Authorization: Bearer <token>
```

Os endpoints de autenticação usam rate limit específico:

| Endpoint | Limite |
| --- | --- |
| `POST /auth/register` | 3 requisições a cada 10 minutos |
| `POST /auth/login` | 5 requisições a cada 1 minuto |
| `POST /auth/forgot-password` | 3 requisições a cada 15 minutos |
| `POST /auth/reset-password` | 5 requisições a cada 15 minutos |

A aplicação usa validação global com `whitelist`, `transform` e `forbidNonWhitelisted`. Campos extras no corpo ou query são rejeitados.

## Swagger

Swagger é habilitado somente fora de produção:

```text
/api/docs
```

## Visão Geral Dos Endpoints

| Método | Rota | Acesso | Finalidade |
| --- | --- | --- | --- |
| `POST` | `/api/v1/auth/register` | Público | Registrar usuário |
| `POST` | `/api/v1/auth/login` | Público | Autenticar usuário |
| `POST` | `/api/v1/auth/forgot-password` | Público | Solicitar redefinição de senha |
| `POST` | `/api/v1/auth/reset-password` | Público | Redefinir senha com token |
| `GET` | `/api/v1/users/me` | Autenticado | Obter perfil autenticado |
| `PATCH` | `/api/v1/users/me` | Autenticado | Atualizar perfil/senha |
| `GET` | `/api/v1/users/me/statistics` | Autenticado | Obter estatísticas do usuário |
| `GET` | `/api/v1/football/fixtures` | Autenticado | Listar partidas sincronizadas |
| `POST` | `/api/v1/football/sync/league` | ADMIN | Sincronizar liga e temporada ativa da ESPN |
| `POST` | `/api/v1/football/sync/teams` | ADMIN | Sincronizar times |
| `POST` | `/api/v1/football/sync/fixtures` | ADMIN | Sincronizar partidas |
| `POST` | `/api/v1/football/sync/players` | ADMIN | Sincronizar jogadores |
| `POST` | `/api/v1/football/sync/results` | ADMIN | Sincronizar resultados |
| `POST` | `/api/v1/predictions` | Autenticado | Criar palpite |
| `GET` | `/api/v1/predictions/my` | Autenticado | Listar meus palpites |
| `GET` | `/api/v1/predictions/fixture/:fixtureId/transparency` | Autenticado | Consultar transparência de palpites da partida |
| `GET` | `/api/v1/predictions/fixture/:fixtureId` | Autenticado | Listar palpites de uma partida |
| `PATCH` | `/api/v1/predictions/:id` | Autenticado | Atualizar palpite próprio |
| `DELETE` | `/api/v1/predictions/:id` | Autenticado | Excluir palpite próprio |
| `POST` | `/api/v1/predictions/calculate/:predictionId` | ADMIN | Calcular pontuação de um palpite |
| `POST` | `/api/v1/predictions/process/:fixtureId` | ADMIN | Processar palpites de uma partida |
| `GET` | `/api/v1/standings` | Público | Listar ranking da temporada ativa |
| `GET` | `/api/v1/standings/me` | Autenticado | Obter posição do usuário autenticado |

---

# Auth

## POST /api/v1/auth/register

Registra um novo usuário.

Acesso: público.

### Corpo

```json
{
  "name": "Ada Lovelace",
  "email": "ada@example.com",
  "password": "Senha123"
}
```

### Validações

- `name`: texto obrigatório, mínimo 3 e máximo 80 caracteres.
- `email`: e-mail válido, máximo 254 caracteres.
- `password`: texto obrigatório, mínimo 8 e máximo 72 caracteres, com ao menos uma letra maiúscula, uma letra minúscula e um número.
- E-mail é normalizado para minúsculas e deve ser único.

### Resposta 201

```json
{
  "id": "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
  "name": "Ada Lovelace",
  "email": "ada@example.com",
  "role": "USER",
  "avatarUrl": null,
  "createdAt": "2026-08-23T12:00:00.000Z",
  "updatedAt": "2026-08-23T12:00:00.000Z"
}
```

### Erros Relevantes

- `409 Conflict`: e-mail já cadastrado.
- `400 Bad Request`: dados inválidos, conforme validação global.
- `429 Too Many Requests`: limite de requisições excedido.

## POST /api/v1/auth/login

Autentica um usuário e emite JWT.

Acesso: público.

### Corpo

```json
{
  "email": "ada@example.com",
  "password": "Senha123"
}
```

### Validações

- `email`: e-mail válido, máximo 254 caracteres.
- `password`: texto obrigatório, máximo 72 caracteres.

### Resposta 200

```json
{
  "accessToken": "<token>"
}
```

### Erros Relevantes

- `401 Unauthorized`: e-mail ou senha inválidos.
- `400 Bad Request`: dados inválidos.
- `429 Too Many Requests`: limite de requisições excedido.

## POST /api/v1/auth/forgot-password

Solicita envio de link para redefinição de senha. A resposta é genérica para não revelar se o e-mail existe.

Acesso: público.

### Corpo

```json
{
  "email": "ada@example.com"
}
```

### Validações

- `email`: e-mail válido, máximo 254 caracteres.

### Resposta 200

```json
{
  "message": "Se o e-mail estiver cadastrado, você receberá um link para redefinir sua senha."
}
```

### Erros Relevantes

- `400 Bad Request`: dados inválidos.
- `429 Too Many Requests`: limite de requisições excedido.

## POST /api/v1/auth/reset-password

Redefine a senha usando token de recuperação.

Acesso: público.

### Corpo

```json
{
  "token": "<token-de-64-caracteres>",
  "password": "NovaSenha123",
  "confirmPassword": "NovaSenha123"
}
```

### Validações

- `token`: texto com exatamente 64 caracteres.
- `password`: texto obrigatório, mínimo 8 e máximo 72 caracteres, com ao menos uma letra maiúscula, uma letra minúscula e um número.
- `confirmPassword`: texto obrigatório, máximo 72 caracteres.
- `password` e `confirmPassword` devem ser iguais.
- Token deve existir e não estar expirado.

### Resposta 200

```json
{
  "message": "Senha alterada com sucesso."
}
```

### Erros Relevantes

- `400 Bad Request`: senhas diferentes, token inválido ou token expirado.
- `400 Bad Request`: dados inválidos.
- `429 Too Many Requests`: limite de requisições excedido.

---

# Users

## GET /api/v1/users/me

Retorna o usuário autenticado.

Acesso: autenticado.

### Resposta 200

```json
{
  "id": "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
  "name": "Ada Lovelace",
  "email": "ada@example.com",
  "role": "USER",
  "createdAt": "2026-08-23T12:00:00.000Z",
  "updatedAt": "2026-08-23T12:00:00.000Z"
}
```

### Erros Relevantes

- `401 Unauthorized`: JWT ausente, inválido ou usuário não encontrado.

## PATCH /api/v1/users/me

Atualiza o perfil do usuário autenticado. Pode alterar nome e, opcionalmente, senha.

Acesso: autenticado.

### Corpo

```json
{
  "name": "Ada Byron",
  "currentPassword": "SenhaAtual123",
  "newPassword": "NovaSenha123"
}
```

Todos os campos são opcionais. Para alterar senha, `currentPassword` é obrigatório.

### Validações

- `name`: texto, mínimo 3 e máximo 80 caracteres.
- `currentPassword`: texto, máximo 72 caracteres.
- `newPassword`: texto, mínimo 8 e máximo 72 caracteres, com ao menos uma letra maiúscula, uma letra minúscula e um número.

### Resposta 200

```json
{
  "id": "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
  "name": "Ada Byron",
  "email": "ada@example.com",
  "role": "USER",
  "createdAt": "2026-08-23T12:00:00.000Z",
  "updatedAt": "2026-08-23T12:10:00.000Z"
}
```

### Erros Relevantes

- `400 Bad Request`: `newPassword` enviado sem `currentPassword`.
- `401 Unauthorized`: JWT ausente/inválido ou senha atual incorreta.
- `400 Bad Request`: dados inválidos.

## GET /api/v1/users/me/statistics

Retorna estatísticas do usuário autenticado na temporada ativa.

Acesso: autenticado.

### Resposta 200

```json
{
  "totalPredictions": 24,
  "totalPoints": 42,
  "averagePoints": 1.75,
  "accuracy": 62.5,
  "correctWinners": 15,
  "exactScores": 6,
  "wrongPredictions": 9,
  "bestRound": {
    "round": 12,
    "points": 18
  },
  "worstRound": {
    "round": 8,
    "points": 0
  },
  "currentPosition": 4
}
```

`bestRound` e `worstRound` podem ser `null`.

### Erros Relevantes

- `401 Unauthorized`: JWT ausente ou inválido.
- `404 Not Found`: temporada ativa não encontrada.

---

# Football

## GET /api/v1/football/fixtures

Lista partidas sincronizadas da base local, com paginação, filtros e o palpite do usuário autenticado quando existir.

Acesso: autenticado.

### Query Parameters

| Parâmetro | Tipo | Validação | Descrição |
| --- | --- | --- | --- |
| `status` | string | `NS`, `LIVE`, `FT`, `POSTPONED`, `CANCELLED` | Filtra por status da partida |
| `round` | number | inteiro entre 0 e 100 | Filtra por rodada |
| `teamId` | UUID v4 | UUID válido | Filtra partidas em que o time é mandante ou visitante |
| `from` | ISO date string | data válida | Data/hora inicial do kickoff |
| `to` | ISO date string | data válida | Data/hora final do kickoff |
| `page` | number | inteiro entre 1 e 1000 | Página, padrão `1` |
| `limit` | number | inteiro entre 1 e 100 | Itens por página, padrão `20` |

### Exemplo

```http
GET /api/v1/football/fixtures?round=12&status=NS&page=1&limit=20
Authorization: Bearer <token>
```

### Resposta 200

```json
{
  "data": [
    {
      "id": "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
      "round": 12,
      "kickoff": "2026-08-14T19:00:00.000Z",
      "status": "NS",
      "homeGoals": null,
      "awayGoals": null,
      "winnerType": null,
      "homeTeam": {
        "id": "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
        "name": "Arsenal",
        "logo": "https://example.com/arsenal.png"
      },
      "awayTeam": {
        "id": "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
        "name": "Chelsea",
        "logo": "https://example.com/chelsea.png"
      },
      "canPredict": true,
      "userPrediction": null
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 380,
    "totalPages": 19
  }
}
```

### Erros Relevantes

- `401 Unauthorized`: JWT ausente ou inválido.
- `400 Bad Request`: query inválida.

## POST /api/v1/football/sync/league

Sincroniza a liga configurada e a temporada ativa a partir das APIs da ESPN.

Acesso: ADMIN.

### Resposta 201

```json
{
  "league": {
    "id": "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
    "apiLeagueId": 23,
    "name": "English Premier League",
    "country": "England",
    "logo": "https://example.com/league.png",
    "isActive": true,
    "createdAt": "2026-08-23T12:00:00.000Z",
    "updatedAt": "2026-08-23T12:00:00.000Z"
  },
  "season": {
    "id": "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
    "leagueId": "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
    "year": 2026,
    "name": "2026",
    "isActive": true,
    "startDate": "2026-08-01T00:00:00.000Z",
    "endDate": "2027-05-31T00:00:00.000Z",
    "createdAt": "2026-08-23T12:00:00.000Z",
    "updatedAt": "2026-08-23T12:00:00.000Z"
  }
}
```

### Erros Relevantes

- `401 Unauthorized`: JWT ausente ou inválido.
- `403 Forbidden`: usuário não é ADMIN.
- `404 Not Found`: liga da ESPN não encontrada.
- `502 Bad Gateway`: resposta inválida das APIs da ESPN.
- `500 Internal Server Error`: configuração obrigatória ausente.

## POST /api/v1/football/sync/teams

Sincroniza os times da temporada ativa.

Acesso: ADMIN.

### Resposta 201

```json
{
  "created": 2,
  "updated": 18,
  "total": 20
}
```

### Erros Relevantes

- `401 Unauthorized`: JWT ausente ou inválido.
- `403 Forbidden`: usuário não é ADMIN.
- `404 Not Found`: temporada ativa não encontrada.
- `502 Bad Gateway`: resposta inválida das APIs da ESPN.

## POST /api/v1/football/sync/fixtures

Sincroniza as partidas da temporada ativa.

Acesso: ADMIN.

### Resposta 201

```json
{
  "fixturesFound": 380,
  "created": 20,
  "updated": 360,
  "skipped": 0
}
```

### Erros Relevantes

- `401 Unauthorized`: JWT ausente ou inválido.
- `403 Forbidden`: usuário não é ADMIN.
- `404 Not Found`: temporada ativa não encontrada.
- `502 Bad Gateway`: resposta inválida das APIs da ESPN.

## POST /api/v1/football/sync/players

Sincroniza jogadores dos times cadastrados.

Acesso: ADMIN.

### Resposta 201

```json
{
  "created": 30,
  "updated": 480
}
```

### Erros Relevantes

- `401 Unauthorized`: JWT ausente ou inválido.
- `403 Forbidden`: usuário não é ADMIN.
- `502 Bad Gateway`: resposta inválida das APIs da ESPN.

## POST /api/v1/football/sync/results

Atualiza resultados e status das partidas ainda não finalizadas.

Acesso: ADMIN.

### Resposta 201

```json
{
  "checked": 120,
  "updated": 4,
  "finished": 2,
  "unchanged": 116
}
```

### Erros Relevantes

- `401 Unauthorized`: JWT ausente ou inválido.
- `403 Forbidden`: usuário não é ADMIN.
- `502 Bad Gateway`: resposta inválida das APIs da ESPN.

---

# Predictions

## POST /api/v1/predictions

Cria um palpite para uma partida.

Acesso: autenticado.

### Corpo

```json
{
  "fixtureId": "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
  "homeGoals": 2,
  "awayGoals": 1
}
```

### Validações

- `fixtureId`: UUID v4 obrigatório.
- `homeGoals`: inteiro entre 0 e 20.
- `awayGoals`: inteiro entre 0 e 20.
- O usuário só pode ter um palpite por partida.
- A partida deve estar aberta para palpite: `kickoff > agora`, status diferente de `LIVE` e diferente de `FT`.

### Resposta 201

Retorna o palpite criado com a fixture e os times relacionados.

```json
{
  "id": "dddddddd-dddd-4ddd-8ddd-dddddddddddd",
  "userId": "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
  "fixtureId": "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
  "homeGoals": 2,
  "awayGoals": 1,
  "mvpPlayerId": null,
  "scorePoints": 0,
  "mvpPoints": 0,
  "totalPoints": 0,
  "exactScore": false,
  "correctWinner": false,
  "correctMvp": false,
  "createdAt": "2026-08-23T12:00:00.000Z",
  "updatedAt": "2026-08-23T12:00:00.000Z",
  "fixture": {
    "id": "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
    "round": 12,
    "kickoff": "2026-08-24T19:00:00.000Z",
    "status": "NS",
    "homeGoals": null,
    "awayGoals": null,
    "homeTeam": {
      "id": "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee",
      "name": "Arsenal",
      "logo": "https://example.com/arsenal.png",
      "country": "England"
    },
    "awayTeam": {
      "id": "ffffffff-ffff-4fff-8fff-ffffffffffff",
      "name": "Chelsea",
      "logo": "https://example.com/chelsea.png",
      "country": "England"
    }
  }
}
```

### Erros Relevantes

- `401 Unauthorized`: JWT ausente ou inválido.
- `404 Not Found`: partida não encontrada.
- `409 Conflict`: palpite duplicado ou partida fechada para palpite.
- `400 Bad Request`: corpo inválido.

## GET /api/v1/predictions/my

Lista todos os palpites do usuário autenticado.

Acesso: autenticado.

Não há filtros ou paginação neste endpoint.

Ordenação: `createdAt` descendente.

### Resposta 200

```json
[
  {
    "id": "dddddddd-dddd-4ddd-8ddd-dddddddddddd",
    "userId": "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
    "fixtureId": "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
    "homeGoals": 2,
    "awayGoals": 1,
    "scorePoints": 3,
    "mvpPoints": 0,
    "totalPoints": 3,
    "exactScore": true,
    "correctWinner": true,
    "correctMvp": false,
    "fixture": {
      "id": "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
      "round": 12,
      "kickoff": "2026-08-24T19:00:00.000Z",
      "status": "FT",
      "homeGoals": 2,
      "awayGoals": 1,
      "homeTeam": {
        "id": "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee",
        "name": "Arsenal",
        "logo": "https://example.com/arsenal.png",
        "country": "England"
      },
      "awayTeam": {
        "id": "ffffffff-ffff-4fff-8fff-ffffffffffff",
        "name": "Chelsea",
        "logo": "https://example.com/chelsea.png",
        "country": "England"
      }
    }
  }
]
```

### Erros Relevantes

- `401 Unauthorized`: JWT ausente ou inválido.

## GET /api/v1/predictions/fixture/:fixtureId/transparency

Consulta a transparência de palpites de uma partida.

Acesso: autenticado.

Antes do fechamento dos palpites, retorna apenas o palpite do usuário autenticado, se existir. Após o fechamento, retorna os palpites de todos os usuários para a fixture.

### Parâmetros De Rota

| Parâmetro | Tipo | Descrição |
| --- | --- | --- |
| `fixtureId` | UUID v4 | ID da partida |

### Resposta 200

```json
{
  "fixture": {
    "id": "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
    "round": 12,
    "kickoff": "2026-08-24T19:00:00.000Z",
    "status": "FT",
    "processedAt": "2026-08-24T21:10:00.000Z",
    "homeTeam": {
      "id": "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee",
      "name": "Arsenal",
      "logo": "https://example.com/arsenal.png"
    },
    "awayTeam": {
      "id": "ffffffff-ffff-4fff-8fff-ffffffffffff",
      "name": "Chelsea",
      "logo": "https://example.com/chelsea.png"
    }
  },
  "isClosedForPrediction": true,
  "finalResult": {
    "homeGoals": 2,
    "awayGoals": 1
  },
  "predictions": [
    {
      "id": "dddddddd-dddd-4ddd-8ddd-dddddddddddd",
      "homeGoals": 2,
      "awayGoals": 1,
      "totalPoints": 3,
      "user": {
        "id": "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
        "name": "Ada Lovelace",
        "avatarUrl": null
      }
    }
  ]
}
```

`finalResult` será `null` se a fixture não estiver `FT` ou ainda não tiver placar final.

### Erros Relevantes

- `401 Unauthorized`: JWT ausente ou inválido.
- `400 Bad Request`: `fixtureId` não é UUID v4.
- `404 Not Found`: partida não encontrada.

## GET /api/v1/predictions/fixture/:fixtureId

Lista palpites de uma partida.

Acesso: autenticado.

Antes do fechamento dos palpites, retorna apenas o palpite do usuário autenticado, se existir. Após o fechamento, retorna todos os palpites da fixture.

### Parâmetros De Rota

| Parâmetro | Tipo | Descrição |
| --- | --- | --- |
| `fixtureId` | UUID v4 | ID da partida |

### Resposta 200

```json
[
  {
    "id": "dddddddd-dddd-4ddd-8ddd-dddddddddddd",
    "userId": "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
    "fixtureId": "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
    "homeGoals": 2,
    "awayGoals": 1,
    "totalPoints": 3,
    "user": {
      "id": "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
      "name": "Ada Lovelace"
    }
  }
]
```

Ordenação: `createdAt` descendente.

### Erros Relevantes

- `401 Unauthorized`: JWT ausente ou inválido.
- `400 Bad Request`: `fixtureId` não é UUID v4.
- `404 Not Found`: partida não encontrada.

## PATCH /api/v1/predictions/:id

Atualiza um palpite próprio.

Acesso: autenticado.

### Parâmetros De Rota

| Parâmetro | Tipo | Descrição |
| --- | --- | --- |
| `id` | UUID v4 | ID do palpite |

### Corpo

```json
{
  "homeGoals": 1,
  "awayGoals": 1
}
```

### Validações

- Pelo menos um dos campos `homeGoals` ou `awayGoals` deve ser enviado.
- `homeGoals`: inteiro entre 0 e 20, se enviado.
- `awayGoals`: inteiro entre 0 e 20, se enviado.
- O palpite deve pertencer ao usuário autenticado.
- A partida deve estar aberta para palpite: `kickoff > agora`, status diferente de `LIVE` e diferente de `FT`.

### Resposta 200

Retorna o palpite atualizado com a fixture e os times relacionados.

### Erros Relevantes

- `400 Bad Request`: nenhum campo atualizável enviado ou `id` inválido.
- `401 Unauthorized`: JWT ausente ou inválido.
- `403 Forbidden`: palpite pertence a outro usuário.
- `404 Not Found`: palpite não encontrado.
- `409 Conflict`: partida já iniciada ou fechada.
- `400 Bad Request`: corpo inválido.

## DELETE /api/v1/predictions/:id

Exclui um palpite próprio.

Acesso: autenticado.

### Parâmetros De Rota

| Parâmetro | Tipo | Descrição |
| --- | --- | --- |
| `id` | UUID v4 | ID do palpite |

### Regras

- O palpite deve pertencer ao usuário autenticado.
- A partida deve estar aberta para palpite: `kickoff > agora`, status diferente de `LIVE` e diferente de `FT`.

### Resposta 200

```json
{
  "message": "Palpite excluído com sucesso."
}
```

### Erros Relevantes

- `400 Bad Request`: `id` não é UUID v4.
- `401 Unauthorized`: JWT ausente ou inválido.
- `403 Forbidden`: palpite pertence a outro usuário.
- `404 Not Found`: palpite não encontrado.
- `409 Conflict`: partida já iniciada ou fechada.

## POST /api/v1/predictions/calculate/:predictionId

Calcula a pontuação de um palpite específico.

Acesso: ADMIN.

### Parâmetros De Rota

| Parâmetro | Tipo | Descrição |
| --- | --- | --- |
| `predictionId` | UUID v4 | ID do palpite |

### Resposta 201

Retorna o palpite atualizado com a fixture e os times relacionados.

### Erros Relevantes

- `400 Bad Request`: `predictionId` não é UUID v4.
- `401 Unauthorized`: JWT ausente ou inválido.
- `403 Forbidden`: usuário não é ADMIN.
- `404 Not Found`: palpite não encontrado.

## POST /api/v1/predictions/process/:fixtureId

Processa todos os palpites de uma partida finalizada e atualiza standings dos usuários afetados.

Acesso: ADMIN.

### Parâmetros De Rota

| Parâmetro | Tipo | Descrição |
| --- | --- | --- |
| `fixtureId` | UUID v4 | ID da partida |

### Regras

- A partida deve existir.
- A partida deve estar com status `FT`.
- A partida deve possuir placar final.
- Se a partida já tiver `processedAt`, o endpoint retorna `alreadyProcessed: true`.

### Resposta 201

```json
{
  "fixtureId": "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
  "alreadyProcessed": false,
  "predictionsProcessed": 42,
  "standingsUpdated": 18
}
```

### Erros Relevantes

- `400 Bad Request`: `fixtureId` não é UUID v4, partida não finalizada ou sem placar final.
- `401 Unauthorized`: JWT ausente ou inválido.
- `403 Forbidden`: usuário não é ADMIN.
- `404 Not Found`: partida não encontrada.

---

# Standings

## GET /api/v1/standings

Lista o ranking da temporada ativa.

Acesso: público.

### Resposta 200

```json
[
  {
    "position": 1,
    "userId": "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
    "name": "Ada Lovelace",
    "avatarUrl": null,
    "scorePoints": 39,
    "totalPoints": 42,
    "exactScores": 6,
    "correctWinners": 17,
    "wrongPredictions": 5
  }
]
```

Ordenação real do ranking:

1. `totalPoints` descendente.
2. `exactScores` descendente.
3. `correctWinners` descendente.
4. `wrongPredictions` ascendente.
5. `createdAt` ascendente.

### Erros Relevantes

- `404 Not Found`: temporada ativa não encontrada.

## GET /api/v1/standings/me

Retorna a posição do usuário autenticado no ranking da temporada ativa.

Acesso: autenticado.

### Resposta 200

```json
{
  "position": 4,
  "totalPlayers": 18,
  "totalPoints": 42,
  "exactScores": 6,
  "correctWinners": 17
}
```

### Erros Relevantes

- `401 Unauthorized`: JWT ausente ou inválido.
- `404 Not Found`: temporada ativa não encontrada ou usuário não possui classificação na temporada ativa.

---

# Observações De Contrato

- A API retorna objetos diretamente; não há envelope global `{ "success": true, "data": ... }`.
- Datas são serializadas em formato ISO.
- IDs são UUID v4 no banco local.
- Estados de fixture: `NS`, `LIVE`, `FT`, `POSTPONED`, `CANCELLED`.
- Tipos de vencedor: `HOME`, `AWAY`, `DRAW`.
- Os dados esportivos são sincronizados a partir das APIs da ESPN.
- O fluxo atual de palpite aceita apenas placar previsto. MVP existe no modelo de dados, mas não faz parte dos DTOs atuais de criação/edição de palpite.
