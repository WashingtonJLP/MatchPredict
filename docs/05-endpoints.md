# Endpoints da API

## Convenções

A API REST é implementada em NestJS e usa o prefixo global:

```text
/api/v1
```

No ambiente local do backend, a base padrão é `http://localhost:3000/api/v1`. Pelo `compose.yaml`, a porta do container é exposta no host como `127.0.0.1:3001`.

Rotas marcadas como **Autenticado** exigem:

```http
Authorization: Bearer <token>
```

Rotas marcadas como **ADMIN** exigem JWT válido e `Role.ADMIN`. A validação global usa `whitelist`, transformação de tipos e rejeição de campos não declarados. Não existe envelope global obrigatório para as respostas.

Swagger fica disponível somente fora de produção em `/api/docs`.

## Autenticação

| Método | Rota | Acesso | Finalidade |
| --- | --- | --- | --- |
| `POST` | `/api/v1/auth/register` | Público | Criar uma conta `USER` |
| `POST` | `/api/v1/auth/login` | Público | Validar credenciais e emitir JWT |
| `POST` | `/api/v1/auth/forgot-password` | Público | Solicitar link de recuperação com resposta não enumerável |
| `POST` | `/api/v1/auth/reset-password` | Público | Redefinir senha com token válido |

### Corpos e limites

`POST /auth/register` recebe `name`, `email` e `password`. Não recebe `role`. Nome tem de 3 a 80 caracteres, e-mail tem no máximo 254 e senha tem de 8 a 72 caracteres, com maiúscula, minúscula e número.

`POST /auth/login` recebe `email` e `password` e devolve `accessToken`. Conta desativada é recusada como credencial inválida.

`POST /auth/forgot-password` recebe `email`. `POST /auth/reset-password` recebe `token`, `password` e `confirmPassword`.

| Endpoint | Rate limit específico |
| --- | --- |
| `POST /auth/register` | 3 a cada 10 minutos |
| `POST /auth/login` | 5 por minuto |
| `POST /auth/forgot-password` | 3 a cada 15 minutos |
| `POST /auth/reset-password` | 5 a cada 15 minutos |

## Usuários

| Método | Rota | Acesso | Finalidade |
| --- | --- | --- | --- |
| `GET` | `/api/v1/users/me` | Autenticado | Consultar o perfil seguro da conta atual |
| `PATCH` | `/api/v1/users/me` | Autenticado | Alterar nome e, opcionalmente, senha |
| `GET` | `/api/v1/users/me/statistics` | Autenticado | Consultar estatísticas na temporada ativa |

No `PATCH /users/me`, todos os campos são opcionais: `name`, `currentPassword` e `newPassword`. A nova senha exige a senha atual correta.

As estatísticas incluem totais, média, acurácia, placares exatos, vencedores corretos, erros, melhor/pior rodada e posição atual quando disponível.

## Futebol

### Jogos do dia e competições públicas

| Método | Rota | Acesso | Finalidade |
| --- | --- | --- | --- |
| `GET` | `/api/v1/football/daily-games` | Público | Listar jogos por data civil em `America/Sao_Paulo` |
| `GET` | `/api/v1/football/competitions` | Público | Listar competições configuradas e suas capacidades |
| `GET` | `/api/v1/football/competitions/:id/seasons/current` | Público | Consultar temporada corrente e fases |
| `GET` | `/api/v1/football/competitions/:id/standings` | Público | Consultar classificação esportiva |
| `GET` | `/api/v1/football/competitions/:id/tournament` | Público | Consultar mata-mata organizado por fases |

`GET /football/daily-games` exige `date=YYYY-MM-DD` e aceita `competition` com um identificador configurado, por exemplo `eng.1`.

As consultas de standings e tournament aceitam `season` opcional, inteiro de 2000 a 2100. A existência de cada recurso depende das capacidades da competição.

### Fixtures locais

| Método | Rota | Acesso | Finalidade |
| --- | --- | --- | --- |
| `GET` | `/api/v1/football/fixtures/current-page` | Autenticado | Calcular a página inicial recomendada para a rodada atual |
| `GET` | `/api/v1/football/fixtures` | Autenticado | Listar fixtures sincronizadas, incluindo o palpite do usuário |

`GET /football/fixtures/current-page` aceita `limit` de 1 a 100, com default 20.

`GET /football/fixtures` aceita:

| Query | Tipo/validação | Efeito |
| --- | --- | --- |
| `status` | `FixtureStatus` | Filtra estado |
| `round` | inteiro de 0 a 100 | Filtra rodada |
| `teamId` | UUID v4 | Filtra mandante ou visitante |
| `from`, `to` | datas ISO | Delimitam kickoff |
| `page` | inteiro de 1 a 1000, default 1 | Página |
| `limit` | inteiro de 1 a 100, default 20 | Tamanho da página |

A resposta paginada usa `{ data, meta }`; `meta` informa página, limite, total e total de páginas.

### Sincronização esportiva

| Método | Rota | Acesso | Finalidade |
| --- | --- | --- | --- |
| `POST` | `/api/v1/football/sync/league` | ADMIN | Sincronizar liga e temporada ativa da ESPN |
| `POST` | `/api/v1/football/sync/teams` | ADMIN | Sincronizar times |
| `POST` | `/api/v1/football/sync/fixtures` | ADMIN | Sincronizar fixtures |
| `POST` | `/api/v1/football/sync/players` | ADMIN | Sincronizar jogadores |
| `POST` | `/api/v1/football/sync/results` | ADMIN | Atualizar resultados das fixtures pendentes |

Esses endpoints usam a verificação administrativa do `FootballController`. Não fazem parte do CRUD do painel administrativo.

## Palpites

| Método | Rota | Acesso | Finalidade |
| --- | --- | --- | --- |
| `POST` | `/api/v1/predictions` | Autenticado | Criar palpite próprio |
| `GET` | `/api/v1/predictions/my` | Autenticado | Listar palpites da conta atual |
| `GET` | `/api/v1/predictions/fixture/:fixtureId/transparency` | Autenticado | Consultar fixture, resultado e palpites visíveis |
| `GET` | `/api/v1/predictions/fixture/:fixtureId` | Autenticado | Listar palpites visíveis de uma fixture |
| `PATCH` | `/api/v1/predictions/:id` | Autenticado | Alterar placar de palpite próprio |
| `DELETE` | `/api/v1/predictions/:id` | Autenticado | Excluir palpite próprio |
| `POST` | `/api/v1/predictions/calculate/:predictionId` | ADMIN | Recalcular um palpite específico |
| `POST` | `/api/v1/predictions/process/:fixtureId` | ADMIN | Processar a fixture e atualizar standings |

### Contratos principais

Criação:

```json
{
  "fixtureId": "<uuid-v4>",
  "homeGoals": 2,
  "awayGoals": 1
}
```

Atualização:

```json
{
  "homeGoals": 1,
  "awayGoals": 1
}
```

Os gols devem ser inteiros de 0 a 20. A atualização exige ao menos um dos dois campos. Criação e edição exigem participação ativa no período da fixture e fixture aberta; exclusão exige propriedade e fixture aberta.

Antes do fechamento, os dois endpoints por fixture retornam somente o palpite da conta atual, quando existente. Após o fechamento, podem retornar todos os palpites. O endpoint `transparency` também informa dados normalizados da fixture, `isClosedForPrediction` e `finalResult` quando aplicável.

IDs de fixture e palpite são validados como UUID v4. Os erros de domínio mais comuns são `403` para palpite de outro usuário, `404` para recurso inexistente e `409` para duplicidade ou fixture fechada.

## Classificação

| Método | Rota | Acesso | Finalidade |
| --- | --- | --- | --- |
| `GET` | `/api/v1/standings` | Público | Listar a classificação da temporada ativa |
| `GET` | `/api/v1/standings/me` | Autenticado | Consultar a posição da conta atual |

O ranking devolve a posição calculada dinamicamente pela ordem oficial. `GET /standings/me` retorna `404` se não houver temporada ativa ou standing para o usuário.

## Rodadas

| Método | Rota | Acesso | Finalidade |
| --- | --- | --- | --- |
| `GET` | `/api/v1/rounds/catalog` | Autenticado | Listar competições, temporadas e rodadas persistidas |
| `GET` | `/api/v1/rounds/:competitionId/seasons/:seasonId/:round` | Autenticado | Obter estatísticas de uma rodada |

### Catálogo de rodadas

`GET /rounds/catalog` lista somente competições e temporadas com fixtures persistidas. Para cada temporada, retorna todas as rodadas iniciadas, somente a próxima rodada futura disponível e a seleção padrão para a navegação inicial.

A consulta não acessa a ESPN nem cria processamento em background. A janela é derivada das datas dos fixtures persistidos, sem quantidade total de rodadas fixa no código.

### Estatísticas da rodada

`GET /rounds/:competitionId/seasons/:seasonId/:round` retorna estado, contadores de fixtures, destaques, desempenho do usuário autenticado e ranking.

| Parâmetro | Tipo | Descrição |
| --- | --- | --- |
| `competitionId` | UUID | ID persistido de `League` |
| `seasonId` | UUID | ID persistido de `Season` pertencente à competição |
| `round` | inteiro positivo | Número persistido em `Fixture.round` |

Regras relevantes:

- usa apenas `Prediction.scorePoints` de fixtures avaliadas;
- trata `exactScores`, `correctWinnersOnly` e `wrongPredictions` como categorias mutuamente exclusivas;
- não lê nem retorna `Standing.adjustmentPoints`;
- exclui usuários sem palpites públicos e não retorna placares previstos;
- antes do kickoff, oculta ranking, destaques e informações de terceiros;
- `best` representa o primeiro colocado do ranking e inclui suas métricas;
- `lowestScore` inclui `participant` somente quando existe um único participante com a menor pontuação;
- `tieBreakCriterion` é informado somente quando um critério determinístico resolve a igualdade de pontos.

Erros relevantes: `400` para parâmetros inválidos, `401` para JWT ausente ou inválido e `404` para competição, temporada ou rodada inexistente.

## Participação mensal

| Método | Rota | Acesso | Finalidade |
| --- | --- | --- | --- |
| `GET` | `/api/v1/participations/me/current` | Autenticado | Consultar participação e período vigentes |

A resposta informa `active`, status e data de ativação da participação, além de ano, mês, início, fim, valor em centavos e moeda do período.

## Pagamentos

| Método | Rota | Acesso | Finalidade |
| --- | --- | --- | --- |
| `GET` | `/api/v1/payments/me` | Autenticado | Listar pagamentos `PAID` da conta atual |
| `GET` | `/api/v1/payments/me/current-pix` | Autenticado | Retomar o PIX `PENDING` válido do período atual |
| `GET` | `/api/v1/payments/:paymentId/status` | Autenticado | Consultar o estado de uma cobrança própria |
| `POST` | `/api/v1/payments/pix` | Autenticado | Criar ou retomar a cobrança PIX mensal |
| `POST` | `/api/v1/payments/:paymentId/reconcile` | Autenticado | Verificar pontualmente a cobrança própria no Asaas |
| `POST` | `/api/v1/payments/webhook/:provider` | Provedor autenticado | Receber evento de pagamento |

Observações:

- `paymentId` deve ser UUID v4.
- `POST /payments/pix` permite 5 requisições por minuto.
- `POST /payments/:paymentId/reconcile` permite 3 requisições por minuto e o serviço aplica cooldown adicional de dois minutos por pagamento.
- O webhook permite 120 requisições por minuto, valida o provedor e autentica o token recebido no header do Asaas.
- Somente `PAYMENT_RECEIVED` elegível conclui o fluxo; outros eventos são reconhecidos e ignorados.
- Nenhuma dessas rotas aceita valor, status ou ativação manual enviados pelo cliente.

## Administração

Todos os endpoints desta seção usam `JwtAuthGuard`, `RolesGuard`, `ThrottlerGuard` e `@Roles(Role.ADMIN)` no controller.

### Dashboard e períodos

| Método | Rota | Finalidade |
| --- | --- | --- |
| `GET` | `/api/v1/admin/dashboard` | Indicadores atuais e atividade administrativa recente |
| `GET` | `/api/v1/admin/periods` | Até 24 períodos recentes para filtros |

O dashboard informa período corrente, usuários cadastrados, participações ativas, quantidade e valor de pagamentos recebidos no mês, pendências financeiras e as oito ações administrativas mais recentes.

### Usuários

| Método | Rota | Finalidade |
| --- | --- | --- |
| `GET` | `/api/v1/admin/users` | Listar, buscar, filtrar e paginar usuários |
| `GET` | `/api/v1/admin/users/:id` | Consultar detalhe seguro, históricos e desempenho |
| `GET` | `/api/v1/admin/users/:id/deletion-impact` | Avaliar bloqueadores antes da exclusão |
| `PATCH` | `/api/v1/admin/users/:id/disable` | Desativar conta `USER` e revogar sessões |
| `PATCH` | `/api/v1/admin/users/:id/reactivate` | Reativar conta `USER` |
| `DELETE` | `/api/v1/admin/users/:id` | Excluir definitivamente conta elegível |

Filtros de `GET /admin/users`:

- `search`: nome ou e-mail, até 100 caracteres;
- `role`: `USER` ou `ADMIN`;
- `accountStatus`: `ACTIVE` ou `DISABLED`;
- paginação comum do Admin.

O corpo da exclusão é estrito:

```json
{
  "confirmation": "EXCLUIR"
}
```

A exclusão e as mudanças de estado estão sujeitas às restrições descritas nas regras de negócio. `DELETE` permite 3 tentativas a cada 10 minutos; desativação e reativação, 5 a cada 10 minutos.

### Pagamentos, participações e revisão

| Método | Rota | Finalidade |
| --- | --- | --- |
| `GET` | `/api/v1/admin/payments` | Listar pagamentos com filtros |
| `GET` | `/api/v1/admin/participations` | Listar participações com filtros |
| `GET` | `/api/v1/admin/financial-reviews` | Listar pagamentos `PAID` sem participação ativa correspondente |

Pagamentos aceitam `status`, `periodId` e `user` (nome ou e-mail). Participações aceitam `status`, `periodId` e `user`. A revisão financeira aceita somente paginação e é observacional.

### Auditoria

| Método | Rota | Finalidade |
| --- | --- | --- |
| `GET` | `/api/v1/admin/audit-logs` | Listar ações administrativas auditadas |

### Paginação administrativa

As listagens administrativas paginadas aceitam:

| Query | Regra |
| --- | --- |
| `page` | inteiro de 1 a 10.000, default 1 |
| `limit` | inteiro de 1 a 50, default 20 |

As respostas usam `{ data, meta }` com total e total de páginas.

## Códigos e formatos relevantes

- Datas são serializadas em ISO 8601.
- Identificadores locais são UUID v4, salvo IDs textuais de competições e referências externas.
- Estados de fixture: `NS`, `LIVE`, `FT`, `POSTPONED`, `CANCELLED`.
- Estados de pagamento: `PENDING`, `PAID`, `EXPIRED`, `CANCELLED`, `FAILED`.
- Estados de participação: `ACTIVE`, `CANCELLED`.
- O fluxo de palpite recebe somente placar; campos de MVP do schema não fazem parte dos DTOs atuais.
