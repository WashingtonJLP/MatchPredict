# Endpoints da API

## Objetivo

Este documento descreve todos os endpoints disponíveis na API do MatchPredict.

A API seguirá o padrão REST e será responsável pela autenticação dos usuários, gerenciamento das regras de negócio, sincronização dos dados esportivos, comunicação com o banco de dados e disponibilização das informações consumidas pelo Front-end.

Todos os endpoints protegidos exigirão autenticação via JWT.

---

# Base URL

## Desenvolvimento

```
http://localhost:3000/api/v1
```

## Produção

```
https://api.matchpredict.com/api/v1
```

---

# Documentação da API

Em ambiente de desenvolvimento e produção, a API disponibilizará documentação utilizando Swagger.

```
/api/docs
```

---

# Autenticação

## POST /auth/register

### Descrição

Realiza o cadastro de um novo usuário.

### Request

```json
{
    "name": "Washington",
    "email": "washington@email.com",
    "password": "123456"
}
```

### Response

```json
{
    "success": true,
    "message": "User created successfully.",
    "data": {
        "user": {},
        "token": ""
    }
}
```

---

## POST /auth/login

### Descrição

Realiza o login do usuário.

### Request

```json
{
    "email": "washington@email.com",
    "password": "123456"
}
```

### Response

```json
{
    "success": true,
    "message": "Login successful.",
    "data": {
        "user": {},
        "token": ""
    }
}
```

---

## GET /auth/me

### Descrição

Retorna o usuário autenticado.

---

# Usuários

## GET /users/profile

Retorna os dados do usuário autenticado.

---

## PATCH /users/profile

Atualiza as informações do usuário.

---

## PATCH /users/avatar

Atualiza a foto do perfil.

---

# Ligas

## GET /leagues

Lista todas as ligas disponíveis.

---

## GET /leagues/:id

Retorna os detalhes de uma liga.

---

# Temporadas

## GET /seasons/active

Retorna a temporada ativa.

---

## GET /seasons/:id

Retorna os detalhes de uma temporada.

---

# Times

## GET /teams

Lista todos os times da temporada.

---

## GET /teams/:id

Retorna os detalhes de um time.

---

# Partidas

## GET /fixtures

Lista todas as partidas.

### Filtros

- season
- round
- team
- status
- date

Exemplo

```
GET /fixtures?round=5
```

---

## GET /fixtures/:id

Retorna uma partida específica.

---

# Palpites

## POST /predictions

Registra um novo palpite.

### Request

```json
{
    "fixtureId":"",

    "homeGoals":2,

    "awayGoals":1,

    "mvpPlayerId":123
}
```

---

## PATCH /predictions/:id

Atualiza um palpite.

### Regras

- Apenas o proprietário poderá editar.
- O jogo deverá estar com status NS.
- Após o início da partida não será permitido alterar o palpite.

---

## GET /predictions/me

Lista todos os palpites do usuário.

---

## GET /predictions/me/:seasonId

Lista todos os palpites do usuário em uma temporada.

---

# Ranking

## GET /standings

Retorna o ranking da temporada ativa.

---

## GET /standings/:seasonId

Retorna o ranking de uma temporada específica.

---

# Administração

Todos os endpoints abaixo exigem perfil ADMIN.

---

## POST /admin/sync

Executa manualmente uma sincronização com a API-Football.

---

## GET /admin/sync/logs

Lista o histórico das sincronizações.

---

## POST /admin/seasons

Cria uma nova temporada.

---

## PATCH /admin/seasons/:id/finish

Encerra uma temporada.

---

## PATCH /admin/leagues/:id

Atualiza informações de uma liga.

---

# Formato das Respostas

Todas as respostas seguirão o mesmo padrão.

## Sucesso

```json
{
    "success": true,
    "message": "Operation completed successfully.",
    "data": {}
}
```

## Erro

```json
{
    "success": false,
    "message": "Predictions are closed."
}
```

---

# Códigos HTTP

| Código | Descrição |
|---------|-----------|
| 200 | OK |
| 201 | Created |
| 204 | No Content |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 409 | Conflict |
| 422 | Unprocessable Entity |
| 500 | Internal Server Error |

---

# Segurança

- Autenticação via JWT.
- Endpoints protegidos exigem token válido.
- Senhas armazenadas utilizando hash (bcrypt).
- Rate Limit aplicado nos endpoints de autenticação.
- CORS configurado para permitir apenas os domínios autorizados.
- HTTPS obrigatório em produção.

---

# Versionamento

Todos os endpoints serão versionados.

Exemplo:

```
/api/v1/auth/login
```

Isso permitirá futuras evoluções da API sem quebrar compatibilidade com versões anteriores.

---

# Deploy

A arquitetura prevista para produção será composta por:

Frontend

- Vercel

Backend

- Railway

Banco de Dados

- PostgreSQL (Neon)

API Externa

- API-Football

Documentação

- Swagger

```
React
      │
      ▼
MatchPredict API (NestJS)
      │
      ├────────────► PostgreSQL (Neon)
      │
      └────────────► API-Football
```