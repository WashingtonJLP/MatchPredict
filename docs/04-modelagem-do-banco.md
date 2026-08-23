# Modelagem do Banco de Dados

## Objetivo

Este documento descreve a modelagem atual do banco de dados do MatchPredict com base em `backend/prisma/schema.prisma`.

A aplicação utiliza PostgreSQL como banco relacional e Prisma ORM para mapear entidades, relações, enums, índices e constraints.

Os dados esportivos são sincronizados a partir das APIs da ESPN e persistidos localmente.

---

## Tecnologias

- PostgreSQL
- Prisma ORM
- Neon Database, quando usado como provedor PostgreSQL gerenciado

---

## Datasource e client

O Prisma usa:

- `provider = "postgresql"`;
- `DATABASE_URL` via variável de ambiente;
- `prisma-client-js` como client.

---

## Enums

### Role

Define o papel do usuário:

- `USER`
- `ADMIN`

### FixtureStatus

Define o estado da partida:

- `NS`
- `LIVE`
- `FT`
- `POSTPONED`
- `CANCELLED`

### WinnerType

Define o vencedor final da partida:

- `HOME`
- `AWAY`
- `DRAW`

---

## Entidades

A modelagem atual contém:

- `User`
- `League`
- `Season`
- `Team`
- `Fixture`
- `Prediction`
- `Standing`
- `SyncLog`
- `Player`

---

## Diagrama entidade-relacionamento

O repositório possui um diagrama em:

```text
docs/images/erd-v1.png
```

Esse diagrama deve ser revisado sempre que a modelagem mudar, pois o schema atual inclui campos e relações adicionados após a primeira versão da documentação.

---

## User

Armazena usuários, credenciais, papel de acesso e dados de recuperação de senha.

### Campos principais

| Campo | Tipo | Observações |
| --- | --- | --- |
| `id` | `String @db.Uuid` | PK, gerado por `uuid()` |
| `name` | `String` | Nome do usuário |
| `email` | `String` | Único |
| `password` | `String` | Hash da senha |
| `role` | `Role` | Default `USER` |
| `avatarUrl` | `String?` | Mapeado para `avatar_url` |
| `resetPasswordToken` | `String?` | Único, hash do token de reset |
| `resetPasswordExpiresAt` | `DateTime?` | Expiração do token de reset |
| `createdAt` | `DateTime` | Default `now()` |
| `updatedAt` | `DateTime` | Atualizado automaticamente |

### Relações

- `predictions`: um usuário pode ter muitos palpites.
- `standings`: um usuário pode ter standings em temporadas diferentes.

### Constraints

- `email` é único.
- `resetPasswordToken` é único quando preenchido.

Tabela física: `users`.

---

## League

Representa a liga sincronizada.

### Campos principais

| Campo | Tipo | Observações |
| --- | --- | --- |
| `id` | `String @db.Uuid` | PK |
| `apiLeagueId` | `Int` | Único, mapeado para `api_league_id` |
| `name` | `String` | Nome da liga |
| `country` | `String` | País |
| `logo` | `String` | URL do logo |
| `isActive` | `Boolean` | Default `true` |
| `createdAt` | `DateTime` | Default `now()` |
| `updatedAt` | `DateTime` | Atualizado automaticamente |

### Relações

- `seasons`: uma liga pode ter várias temporadas.

### Constraints

- `apiLeagueId` é único.

Tabela física: `leagues`.

---

## Season

Representa uma temporada de uma liga.

### Campos principais

| Campo | Tipo | Observações |
| --- | --- | --- |
| `id` | `String @db.Uuid` | PK |
| `leagueId` | `String @db.Uuid` | FK para `League` |
| `year` | `Int` | Ano da temporada segundo a fonte externa |
| `name` | `String` | Nome exibível da temporada |
| `isActive` | `Boolean` | Default `true` |
| `startDate` | `DateTime` | Mapeado para `start_date` |
| `endDate` | `DateTime` | Mapeado para `end_date` |
| `createdAt` | `DateTime` | Default `now()` |
| `updatedAt` | `DateTime` | Atualizado automaticamente |

### Relações

- `league`: uma temporada pertence a uma liga.
- `fixtures`: uma temporada possui partidas.
- `standings`: uma temporada possui classificações.

### Constraints e Índices

- `@@unique([leagueId, year])`
- `@@index([leagueId])`

Tabela física: `seasons`.

---

## Team

Armazena times sincronizados.

### Campos principais

| Campo | Tipo | Observações |
| --- | --- | --- |
| `id` | `String @db.Uuid` | PK |
| `apiTeamId` | `Int` | Único, mapeado para `api_team_id` |
| `name` | `String` | Nome do time |
| `logo` | `String` | URL do escudo |
| `country` | `String` | País |
| `createdAt` | `DateTime` | Default `now()` |
| `updatedAt` | `DateTime` | Atualizado automaticamente |

### Relações

- `homeFixtures`: fixtures em que o time é mandante.
- `awayFixtures`: fixtures em que o time é visitante.
- `players`: jogadores vinculados ao time.

### Constraints

- `apiTeamId` é único.

Tabela física: `teams`.

---

## Fixture

Representa uma partida sincronizada.

### Campos principais

| Campo | Tipo | Observações |
| --- | --- | --- |
| `id` | `String @db.Uuid` | PK |
| `apiFixtureId` | `Int` | Único, mapeado para `api_fixture_id` |
| `seasonId` | `String @db.Uuid` | FK para `Season` |
| `homeTeamId` | `String @db.Uuid` | FK para `Team` |
| `awayTeamId` | `String @db.Uuid` | FK para `Team` |
| `round` | `Int` | Rodada |
| `kickoff` | `DateTime` | Data/hora da partida |
| `status` | `FixtureStatus` | Default `NS` |
| `homeGoals` | `Int?` | Placar do mandante |
| `awayGoals` | `Int?` | Placar do visitante |
| `winnerType` | `WinnerType?` | Vencedor final |
| `processedAt` | `DateTime?` | Indica processamento de pontuação |
| `createdAt` | `DateTime` | Default `now()` |
| `updatedAt` | `DateTime` | Atualizado automaticamente |

### Relações

- `season`: a partida pertence a uma temporada.
- `homeTeam`: time mandante.
- `awayTeam`: time visitante.
- `predictions`: palpites vinculados à partida.

### Constraints e Índices

- `apiFixtureId` é único.
- `@@index([seasonId])`
- `@@index([homeTeamId])`
- `@@index([awayTeamId])`
- `@@index([kickoff])`

Tabela física: `fixtures`.

---

## Prediction

Representa o palpite de um usuário para uma partida.

### Campos principais

| Campo | Tipo | Observações |
| --- | --- | --- |
| `id` | `String @db.Uuid` | PK |
| `userId` | `String @db.Uuid` | FK para `User` |
| `fixtureId` | `String @db.Uuid` | FK para `Fixture` |
| `homeGoals` | `Int` | Gols previstos para mandante |
| `awayGoals` | `Int` | Gols previstos para visitante |
| `mvpPlayerId` | `String? @db.Uuid` | FK opcional para `Player` |
| `scorePoints` | `Int` | Default `0` |
| `mvpPoints` | `Int` | Default `0` |
| `totalPoints` | `Int` | Default `0` |
| `exactScore` | `Boolean` | Default `false` |
| `correctWinner` | `Boolean` | Default `false` |
| `correctMvp` | `Boolean` | Default `false` |
| `createdAt` | `DateTime` | Default `now()` |
| `updatedAt` | `DateTime` | Atualizado automaticamente |

### Relações

- `user`: o palpite pertence a um usuário.
- `fixture`: o palpite pertence a uma partida.
- `mvpPlayer`: relação opcional para jogador escolhido como MVP.

### Constraints e Índices

- `@@unique([userId, fixtureId])`: impede mais de um palpite por usuário na mesma partida.
- `@@index([fixtureId])`
- `@@index([userId])`
- `@@index([mvpPlayerId])`

Tabela física: `predictions`.

Observação: os campos de MVP estão modelados, mas o fluxo atual de criação/edição de palpite aceita apenas placar.

---

## Standing

Armazena a classificação agregada de um usuário em uma temporada.

### Campos principais

| Campo | Tipo | Observações |
| --- | --- | --- |
| `id` | `String @db.Uuid` | PK |
| `seasonId` | `String @db.Uuid` | FK para `Season` |
| `userId` | `String @db.Uuid` | FK para `User` |
| `scorePoints` | `Int` | Default `0` |
| `mvpPoints` | `Int` | Default `0` |
| `totalPoints` | `Int` | Default `0` |
| `exactScores` | `Int` | Default `0` |
| `correctWinners` | `Int` | Default `0` |
| `correctMvps` | `Int` | Default `0` |
| `wrongPredictions` | `Int` | Default `0` |
| `position` | `Int` | Default `1` |
| `createdAt` | `DateTime` | Default `now()` |
| `updatedAt` | `DateTime` | Atualizado automaticamente |

### Relações

- `user`: standing pertence a um usuário.
- `season`: standing pertence a uma temporada.

### Constraints e Índices

- `@@unique([seasonId, userId])`: um standing por usuário por temporada.
- `@@index([seasonId])`

Tabela física: `standings`.

Observação: `position` existe no schema, mas a posição exibida pelo ranking atual é calculada pela ordenação da consulta.

---

## SyncLog

Modelo reservado para histórico de sincronizações.

### Campos principais

| Campo | Tipo | Observações |
| --- | --- | --- |
| `id` | `String @db.Uuid` | PK |
| `entity` | `String` | Entidade sincronizada |
| `status` | `String` | Status da sincronização |
| `message` | `String?` | Mensagem opcional |
| `startedAt` | `DateTime` | Início |
| `finishedAt` | `DateTime?` | Fim opcional |
| `createdAt` | `DateTime` | Default `now()` |

Tabela física: `sync_logs`.

Observação: o modelo existe no schema, mas não há fluxo atual no backend gravando registros em `SyncLog`.

---

## Player

Armazena jogadores sincronizados dos times cadastrados.

### Campos principais

| Campo | Tipo | Observações |
| --- | --- | --- |
| `id` | `String @db.Uuid` | PK |
| `apiPlayerId` | `Int` | Único, mapeado para `api_player_id` |
| `teamId` | `String @db.Uuid` | FK para `Team` |
| `name` | `String` | Nome do jogador |
| `number` | `Int?` | Número da camisa, quando disponível |
| `photo` | `String?` | Foto, quando disponível |
| `position` | `String?` | Posição, quando disponível |
| `createdAt` | `DateTime` | Default `now()` |
| `updatedAt` | `DateTime` | Atualizado automaticamente |

### Relações

- `team`: jogador pertence a um time.
- `predictions`: palpites que referenciam o jogador como MVP.

### Constraints e Índices

- `apiPlayerId` é único.
- `@@index([teamId])`

Tabela física: `players`.

---

## Relações principais

- `League 1:N Season`
- `Season 1:N Fixture`
- `Season 1:N Standing`
- `Team 1:N Fixture` como mandante
- `Team 1:N Fixture` como visitante
- `Team 1:N Player`
- `Fixture 1:N Prediction`
- `User 1:N Prediction`
- `User 1:N Standing`
- `Player 1:N Prediction` como MVP opcional

---

## Regras de integridade relevantes

- E-mail de usuário é único.
- Token de recuperação de senha é único quando preenchido.
- Identificador externo de liga é único.
- Identificador externo de time é único.
- Identificador externo de partida é único.
- Identificador externo de jogador é único.
- Cada usuário pode ter apenas um palpite por partida.
- Cada usuário pode ter apenas um standing por temporada.
- Cada temporada pertence a uma liga.
- Cada partida pertence a uma temporada, a um mandante e a um visitante.
- Cada jogador pertence a um time.

---

## Considerações

A modelagem atual já contempla campos para evolução futura, especialmente MVP e logs de sincronização.

Nem todos os campos modelados estão ativos nos fluxos funcionais atuais. Em especial:

- MVP está no schema, mas não é aceito nos DTOs atuais de criação/edição de palpite.
- `SyncLog` está no schema, mas não é gravado pelos serviços atuais.

Essa distinção é importante para manter a documentação alinhada ao comportamento real da aplicação.
