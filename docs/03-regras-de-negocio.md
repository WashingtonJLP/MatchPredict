# Regras de Negócio

## Objetivo

Este documento descreve as regras de negócio atualmente implementadas no MatchPredict.

O backend NestJS é a fonte de verdade para as regras de autenticação, palpites, processamento de resultados, transparência e ranking.

---

## RN01 - Cadastro de Usuário

- O usuário deve informar nome, e-mail e senha.
- O nome é obrigatório e deve possuir entre 3 e 80 caracteres.
- O e-mail deve ser válido, possuir no máximo 254 caracteres e ser único.
- O e-mail é normalizado antes de ser armazenado.
- A senha deve possuir entre 8 e 72 caracteres, com pelo menos:
  - uma letra maiúscula;
  - uma letra minúscula;
  - um número.
- A senha é armazenada com hash usando bcrypt.
- Não é permitido cadastrar um novo usuário com e-mail já existente.
- Usuários novos são criados com perfil `USER`.

---

## RN02 - Autenticação

- O login é feito com e-mail e senha.
- Ao autenticar com sucesso, a API retorna um JWT.
- O JWT contém o identificador do usuário, e-mail e papel (`role`).
- Endpoints protegidos exigem JWT válido no header `Authorization`.
- O backend valida a existência do usuário em cada requisição autenticada.
- Endpoints de autenticação possuem rate limit específico para reduzir abuso.

---

## RN03 - Recuperação de Senha

- A solicitação de recuperação recebe apenas o e-mail.
- A resposta da solicitação é sempre genérica, independentemente de o e-mail existir ou não.
- Quando o e-mail existe, o sistema gera um token aleatório.
- O token é armazenado apenas como hash SHA-256.
- O token de recuperação expira em 30 minutos.
- Ao redefinir senha:
  - o token deve existir;
  - o token não pode estar expirado;
  - a nova senha e a confirmação devem ser iguais;
  - a nova senha deve atender à política de senha forte.
- Após redefinição bem-sucedida, o token e sua expiração são removidos.
- Se um token expirado for usado, ele é removido antes de retornar erro.

---

## RN04 - Perfil do Usuário

- O usuário autenticado pode consultar o próprio perfil.
- O usuário autenticado pode atualizar o próprio nome.
- O usuário autenticado pode alterar a própria senha.
- Para alterar senha, a senha atual deve ser informada e conferida.
- A nova senha deve atender à mesma política de senha forte do cadastro.
- Dados sensíveis, como senha e tokens de recuperação, não são retornados nas respostas públicas de usuário.

---

## RN05 - Competições e Temporadas

- O sistema está configurado para operar inicialmente com a Premier League.
- A liga e a temporada ativa são sincronizadas a partir das APIs da ESPN.
- Apenas uma temporada ativa por liga é mantida como ativa no fluxo de sincronização atual.
- Ao sincronizar uma nova temporada ativa, temporadas anteriores da mesma liga são marcadas como inativas.
- Consultas de ranking e estatísticas usam a temporada ativa vinculada a uma liga ativa.

---

## RN06 - Times, Jogadores e Partidas

- Times, jogadores, partidas e resultados são sincronizados a partir das APIs da ESPN.
- Times são identificados localmente por UUID e externamente por `apiTeamId`.
- Jogadores são identificados localmente por UUID e externamente por `apiPlayerId`.
- Partidas são identificadas localmente por UUID e externamente por `apiFixtureId`.
- A rodada (`round`) é armazenada na fixture como número inteiro.
- A rodada é calculada durante a sincronização de fixtures com base na posição do evento e na quantidade de partidas por rodada.
- Os status de partida suportados são:
  - `NS`;
  - `LIVE`;
  - `FT`;
  - `POSTPONED`;
  - `CANCELLED`.
- O resultado final da partida é armazenado em `homeGoals`, `awayGoals` e `winnerType`.
- Partidas finalizadas podem ser marcadas como processadas por meio de `processedAt`.

---

## RN07 - Listagem de Partidas

- Apenas usuários autenticados podem listar partidas.
- A listagem retorna partidas da base local.
- A listagem suporta filtros por:
  - status;
  - rodada;
  - time;
  - data/hora inicial do kickoff;
  - data/hora final do kickoff.
- A listagem é paginada.
- As partidas são ordenadas por kickoff crescente.
- Para cada partida, a resposta inclui o palpite do usuário autenticado, quando existir.
- `canPredict` só é verdadeiro quando:
  - a partida ainda está aberta para palpite;
  - o usuário ainda não registrou palpite para aquela partida.

---

## RN08 - Registro de Palpites

- Apenas usuários autenticados podem registrar palpites.
- Cada usuário pode registrar no máximo um palpite por partida.
- O palpite atual contém:
  - gols previstos para o mandante;
  - gols previstos para o visitante.
- Gols previstos devem ser números inteiros entre 0 e 20.
- O palpite só pode ser criado se a partida estiver aberta para palpite.
- A partida está aberta para palpite quando:
  - `kickoff` é maior que o horário atual;
  - status não é `LIVE`;
  - status não é `FT`.
- Se a partida não existir, o palpite não pode ser criado.
- Se o usuário já tiver palpite para a partida, a criação é rejeitada.

---

## RN09 - Edição e Exclusão de Palpites

- Apenas o dono do palpite pode editá-lo ou excluí-lo.
- Um palpite só pode ser editado enquanto a partida estiver aberta para palpite.
- Um palpite só pode ser excluído enquanto a partida estiver aberta para palpite.
- Ao editar, pelo menos um dos campos `homeGoals` ou `awayGoals` deve ser enviado.
- Após o fechamento dos palpites, não é permitido:
  - editar o palpite;
  - excluir o palpite.

---

## RN10 - Fechamento dos Palpites

- O fechamento dos palpites é calculado por partida.
- Uma partida está fechada para palpite quando qualquer condição abaixo é verdadeira:
  - `kickoff` é menor ou igual ao horário atual;
  - status é `LIVE`;
  - status é `FT`.
- O fechamento não depende da rodada inteira.
- Em uma mesma rodada, podem existir palpites ainda ativos e palpites já encerrados se as partidas tiverem horários diferentes.
- O frontend pode exibir um estado derivado da mesma regra, mas a proteção real é aplicada pelo backend.

---

## RN11 - Meus Palpites

- A listagem de meus palpites retorna somente palpites do usuário autenticado.
- A listagem não retorna partidas sem palpite do usuário.
- A listagem não possui filtros ou paginação no endpoint atual.
- A ordenação do endpoint é pela data de criação do palpite em ordem decrescente.
- A organização visual entre palpites ativos e histórico é feita no frontend com base na regra de fechamento da partida.

---

## RN12 - Transparência de Palpites

- A transparência é consultada por fixture.
- Antes do fechamento dos palpites, a consulta retorna somente o palpite do usuário autenticado, se existir.
- Após o fechamento dos palpites, a consulta retorna os palpites de todos os usuários daquela fixture.
- Os palpites na transparência são ordenados por nome do usuário e, depois, por data de criação.
- A resposta informa se a fixture está fechada para palpites.
- O resultado final só é retornado quando:
  - status da fixture é `FT`;
  - `homeGoals` não é nulo;
  - `awayGoals` não é nulo.

---

## RN13 - Pontuação

- A pontuação atual considera apenas placar e vencedor/empate.
- Placar exato vale 3 pontos.
- Acerto do vencedor ou empate, sem placar exato, vale 1 ponto.
- Erro do vencedor/empate vale 0 ponto.
- Se a partida não possuir placar final, a pontuação calculada é 0.
- `scorePoints` e `totalPoints` recebem o mesmo valor no cálculo atual.
- Campos de MVP existem no modelo de dados, mas MVP não faz parte do fluxo atual de criação/edição de palpites nem do motor de pontuação atual.

---

## RN14 - Processamento de Resultados

- Uma fixture só pode ser processada se existir.
- Uma fixture só pode ser processada se estiver com status `FT`.
- Uma fixture finalizada só pode ser processada se possuir placar final.
- O processamento calcula a pontuação de todos os palpites da fixture.
- O processamento atualiza os standings dos usuários afetados.
- O processamento marca a fixture com `processedAt`.
- Se a fixture já tiver sido processada, o endpoint retorna um resultado indicando `alreadyProcessed: true` e não recalcula os palpites.
- O processamento usa transação para evitar processamento duplicado concorrente.
- Um scheduler executa a cada 5 minutos para:
  - sincronizar resultados pendentes;
  - processar fixtures finalizadas ainda não processadas.

---

## RN15 - Ranking

- O ranking é calculado para a temporada ativa.
- Standings são atualizados a partir dos palpites de fixtures finalizadas.
- Cada usuário possui no máximo um standing por temporada.
- O ranking público retorna a lista de usuários classificados.
- A posição do usuário autenticado pode ser consultada separadamente.

### Critérios de Ordenação

1. Maior `totalPoints`.
2. Maior `exactScores`.
3. Maior `correctWinners`.
4. Menor `wrongPredictions`.
5. `createdAt` mais antigo do standing.

---

## RN16 - Estatísticas do Usuário

- As estatísticas são calculadas para o usuário autenticado na temporada ativa.
- O total de palpites considera palpites do usuário na temporada ativa.
- A média de pontos considera somente palpites de fixtures já processadas.
- A acurácia é o percentual de palpites processados com vencedor correto.
- Melhor e pior rodada são calculadas a partir da soma de pontos por rodada, considerando apenas fixtures processadas.
- Em caso de empate de pontos entre rodadas, a rodada de menor número é escolhida.
- A posição atual é calculada com base na ordenação real do ranking.

---

## RN17 - Administração

- O sistema possui usuários com perfil `ADMIN`.
- Endpoints administrativos exigem JWT válido e role `ADMIN`.
- Apenas administradores podem:
  - sincronizar liga e temporada ativa;
  - sincronizar times;
  - sincronizar fixtures;
  - sincronizar jogadores;
  - sincronizar resultados;
  - calcular a pontuação de um palpite específico;
  - processar todos os palpites de uma fixture.
- Usuários sem role `ADMIN` recebem erro de acesso restrito ao chamar endpoints administrativos.

---

## RN18 - Integridade e Segurança

- A API usa validação global com `whitelist`, transformação de tipos e rejeição de campos não permitidos.
- IDs recebidos em parâmetros de rota de palpites são validados como UUID v4.
- O par `(userId, fixtureId)` é único na tabela de palpites.
- O par `(seasonId, userId)` é único na tabela de standings.
- Configurações sensíveis são lidas de variáveis de ambiente.
- Em produção, CORS exige origem configurada.
- Swagger é habilitado apenas fora de produção.
- O backend pode ser configurado para confiar em proxies por meio de `TRUST_PROXY_HOPS`.

---

## RN19 - Limitações Atuais

- Não há endpoint público específico para listar ligas, temporadas, times ou jogadores.
- Não há painel administrativo no frontend.
- Não há CRUD manual de ligas, temporadas, times ou partidas.
- Não há endpoint para encerrar temporada manualmente.
- `SyncLog` existe no modelo de dados, mas não há fluxo implementado gravando logs de sincronização.
- MVP existe no schema, mas ainda não está implementado no fluxo funcional de palpites.
- A API atual não usa envelope global de resposta.
