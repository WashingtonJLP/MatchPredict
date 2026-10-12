# Requisitos funcionais

Este documento descreve as capacidades implementadas no MatchPredict. O código atual do backend e do frontend é a fonte de verdade.

## Contas e autenticação

### RF01 — Cadastro público

O sistema deve permitir que um visitante crie uma conta informando nome, e-mail e senha.

- O e-mail deve ser válido, normalizado e único.
- A senha deve ter de 8 a 72 caracteres, com ao menos uma letra maiúscula, uma letra minúscula e um número.
- A senha deve ser armazenada como hash e nunca retornada pela API.
- O cadastro público deve sempre criar a conta com `Role.USER`; o papel não pode ser escolhido na requisição.

### RF02 — Login e sessão

O sistema deve autenticar contas ativas por e-mail e senha e, em caso de sucesso, emitir um JWT.

- Credenciais inválidas e contas desativadas devem ser recusadas sem revelar qual condição falhou.
- Rotas protegidas devem exigir `Authorization: Bearer <token>`.
- O JWT deve carregar a versão de autenticação da conta.
- A validação de cada requisição protegida deve recusar conta inexistente, desativada ou com `authVersion` diferente do token.

### RF03 — Recuperação de senha

O sistema deve permitir a solicitação e a conclusão da recuperação de senha.

- A solicitação deve retornar uma mensagem genérica, exista ou não uma conta ativa para o e-mail.
- O backend deve gerar um token, persistir somente seu hash e aplicar expiração de 30 minutos.
- O link deve ser enviado por e-mail pelo provedor SMTP configurado.
- A redefinição deve exigir token, nova senha e confirmação idêntica.
- Tokens inexistentes, expirados, consumidos ou associados a conta desativada devem ser recusados.
- Após a redefinição, token e expiração devem ser removidos.

### RF04 — Perfil

O usuário autenticado deve poder consultar e atualizar o próprio perfil.

- A consulta deve retornar somente dados seguros da conta autenticada.
- A atualização deve permitir alterar o nome.
- A troca de senha deve exigir a senha atual e aplicar a mesma política do cadastro à nova senha.

## Futebol e competições

### RF05 — Jogos do dia

O sistema deve disponibilizar publicamente os jogos de futebol por data civil em `America/Sao_Paulo`.

- A consulta deve aceitar data e competição opcionais.
- O retorno deve agrupar os jogos pelas competições suportadas e informar seus estados normalizados.
- A integração com a ESPN deve ser tratada pelo backend, sem expor essa dependência ao frontend.

### RF06 — Catálogo de competições

O sistema deve disponibilizar publicamente o catálogo de competições suportadas e suas capacidades.

- Deve ser possível consultar a temporada atual de uma competição.
- Competições compatíveis devem oferecer classificação esportiva.
- Competições de mata-mata devem oferecer a estrutura do torneio por fases.

### RF07 — Fixtures sincronizadas

O usuário autenticado deve poder consultar as fixtures armazenadas localmente.

- A listagem deve aceitar filtros por status, rodada, time e intervalo de datas.
- Deve haver paginação por `page` e `limit` e ordenação por kickoff crescente.
- Cada item deve informar times, temporada, rodada, kickoff, status, placar disponível, palpite do usuário e se ainda aceita alteração.
- O frontend deve poder consultar a página inicial recomendada para a rodada atual.

## Participação mensal e pagamentos

### RF08 — Situação da participação vigente

O usuário autenticado deve poder consultar sua participação no mês corrente.

- O período deve seguir o mês calendário em `America/Sao_Paulo`.
- A resposta deve informar período, valor, situação e data de ativação quando existente.
- A ausência de período persistido deve produzir a descrição do período corrente, sem conceder participação ativa.

### RF09 — Autorização para palpitar

O sistema deve exigir uma `Participation` com status `ACTIVE` em um `ParticipationPeriod` aberto que contenha o kickoff da fixture.

- A verificação deve ocorrer na criação e na edição do palpite.
- Um `Payment` com status `PENDING`, isoladamente, não deve autorizar palpites.
- O período aplicável deve ser determinado pelo kickoff da fixture, não apenas pela data da requisição.

### RF10 — Criação e retomada do PIX

O usuário autenticado deve poder criar ou retomar a cobrança PIX do período mensal vigente.

- O valor atual deve ser R$ 25,00, persistido como 2.500 centavos.
- O sistema deve reutilizar um PIX pendente ainda válido quando disponível.
- Cobranças pendentes vencidas devem assumir o estado efetivo `EXPIRED` no fluxo aplicável.
- Se já existir participação ativa no período, uma nova cobrança deve ser recusada.
- A criação deve possuir limitação de frequência e mecanismos contra duplicidade concorrente.

### RF11 — Consulta de pagamentos

O usuário autenticado deve poder:

- consultar o histórico dos próprios pagamentos confirmados;
- retomar o PIX pendente e válido do período atual;
- consultar o status de uma cobrança própria;
- solicitar uma reconciliação pontual de cobrança própria elegível.

O usuário não deve consultar nem reconciliar pagamentos de outra conta.

### RF12 — Confirmação e reconciliação do pagamento

O backend deve receber eventos autenticados do provedor PIX e reconciliar pagamentos elegíveis.

- O evento `PAYMENT_RECEIVED` do Asaas deve ser correlacionado com o pagamento local.
- A transição válida para `PAID` deve registrar as referências do provedor e `paidAt`.
- A confirmação deve criar a `Participation ACTIVE` vinculada ao pagamento na mesma transação.
- Eventos repetidos e confirmações concorrentes devem ser tratados de modo idempotente.
- A reconciliação iniciada pelo usuário deve respeitar elegibilidade, cooldown e limites de requisição.
- Estados locais possíveis são `PENDING`, `PAID`, `EXPIRED`, `CANCELLED` e `FAILED`.

## Palpites, transparência e pontuação

### RF13 — Criação de palpite

O usuário autenticado e habilitado para o período deve poder registrar um palpite de placar.

- O palpite deve conter fixture, gols do mandante e gols do visitante.
- Os gols devem ser inteiros não negativos.
- Cada usuário deve possuir no máximo um palpite por fixture.
- A criação deve ser bloqueada no kickoff ou quando a fixture estiver `LIVE` ou `FT`.
- O contrato atual não deve exigir palpite de MVP.

### RF14 — Edição de palpite

O usuário autenticado deve poder alterar somente o placar de um palpite próprio.

- A edição deve exigir participação ativa no período da fixture.
- Deve aplicar o mesmo fechamento por kickoff e status usado na criação.
- Palpites de outras contas não podem ser editados.

### RF15 — Exclusão de palpite

O usuário autenticado deve poder excluir um palpite próprio enquanto a fixture estiver aberta.

- A exclusão deve aplicar o mesmo fechamento por kickoff e status.
- Palpites de outras contas não podem ser excluídos.
- A exclusão não exige uma nova validação de participação ativa.

### RF16 — Meus palpites

O sistema deve listar exclusivamente os palpites da conta autenticada.

- O frontend deve separar palpites ainda alteráveis do histórico.
- O histórico pode ser filtrado por rodada na interface.
- Fixtures sem palpite do usuário não devem aparecer nessa listagem.

### RF17 — Transparência dos palpites

O sistema deve expor os palpites de uma fixture conforme a regra de fechamento.

- Antes do kickoff, o usuário deve ver somente o próprio palpite, quando existente.
- Antes do kickoff, a ausência de palpite próprio não deve revelar os palpites alheios.
- No kickoff ou quando a fixture estiver `LIVE` ou `FT`, os palpites da fixture podem ser exibidos.
- Quando disponível, o retorno deve incluir resultado final, processamento e pontos calculados.

### RF18 — Processamento e pontuação

O sistema deve processar fixtures `FT` com placar final e ainda não processadas.

- Placar exato deve valer 3 pontos.
- Acerto do vencedor ou do empate, sem placar exato, deve valer 1 ponto.
- Erro deve valer 0 ponto.
- O processamento deve atualizar os indicadores do palpite e marcar a fixture com `processedAt`.
- O fluxo deve ser idempotente.
- A pontuação funcional atual é baseada somente no placar; MVP não acrescenta pontos.

### RF19 — Classificação

O sistema deve disponibilizar publicamente a classificação da temporada ativa e, para o usuário autenticado, sua posição individual.

- A posição deve ser calculada pela ordem oficial, não pelo campo legado `Standing.position`.
- A ordem deve considerar, nesta sequência: `totalPoints` decrescente, `exactScores` decrescente, `correctWinners` decrescente, `wrongPredictions` crescente e `createdAt` crescente.
- A resposta deve incluir posição, usuário e estatísticas acumuladas.
- Quando não houver standing para o usuário autenticado, a consulta individual deve retornar `404 Not Found`.
- Ajustes administrativos já materializados em `totalPoints` devem participar normalmente da ordenação.

### RF20 — Estatísticas pessoais

O usuário autenticado deve poder consultar pontos, quantidade de palpites, placares exatos, vencedores corretos, erros e aproveitamento na temporada ativa.

## Sincronização e automação

### RF21 — Sincronização esportiva administrativa

O backend deve permitir que somente `ADMIN` acione as sincronizações locais de liga, temporada, times, fixtures, jogadores e resultados provenientes da ESPN.

### RF22 — Atualização automática de resultados

O backend deve executar a rotina agendada de atualização e processamento de resultados.

- A rotina deve consultar a fonte esportiva antes de decidir se há trabalho local necessário.
- Fixtures encerradas e ainda não processadas devem ser processadas.
- Falhas devem ser registradas nos logs da aplicação sem expor credenciais.

## Administração

### RF23 — Controle de acesso administrativo

As rotas sob `/api/v1/admin` devem exigir JWT válido e `Role.ADMIN`, por meio de `JwtAuthGuard`, `RolesGuard` e do decorator de papéis.

- Contas `USER` não devem acessar a área administrativa.
- O produto não deve oferecer promoção ou rebaixamento de administradores pela interface.
- A interface administrativa deve estar disponível em todas as páginas sob `/admin`.

### RF24 — Dashboard administrativo

O administrador deve poder consultar, sob demanda, indicadores de usuários, participação vigente, pagamentos recebidos, valor recebido, pendências financeiras e atividade administrativa recente.

### RF25 — Gestão e detalhe de usuários

O administrador deve poder listar, pesquisar, filtrar e paginar usuários e abrir um detalhe sem dados sensíveis.

- O detalhe deve apresentar conta, contagens relacionadas, participações, pagamentos e classificação/desempenho por temporada.
- A posição apresentada deve usar a mesma ordenação dinâmica da classificação oficial.
- Filtros devem permitir distinguir papel, situação da conta e participação vigente.

### RF26 — Consulta administrativa financeira

O administrador deve poder consultar, com paginação e filtros:

- pagamentos;
- participações;
- períodos recentes;
- pagamentos `PAID` sem participação ativa correspondente, como pendências de revisão observacional.

A área administrativa não deve editar valores, marcar pagamentos manualmente como pagos, estornar ou ativar participações manualmente.

### RF27 — Auditoria administrativa

O sistema deve registrar e listar ações administrativas de desativação, reativação e exclusão de usuário por meio de `AdminAuditLog`.

- Cada registro deve identificar o administrador, a ação, o alvo e os metadados necessários.
- A listagem deve ser paginada e ordenada da atividade mais recente para a mais antiga.

### RF28 — Desativação e reativação

O administrador deve poder desativar e reativar contas `USER`.

- A desativação deve preservar palpites, pagamentos, participações e demais históricos.
- A desativação deve preencher `disabledAt`, incrementar `authVersion` e remover tokens pendentes de recuperação de senha.
- A alteração de `authVersion` deve invalidar sessões JWT já emitidas.
- A reativação deve limpar `disabledAt` sem apagar o histórico.
- A interface deve exigir confirmação antes da desativação.
- Contas `ADMIN` não podem ser alteradas por esses endpoints.

### RF29 — Exclusão segura de conta de teste

O administrador deve poder analisar o impacto e excluir definitivamente somente uma conta elegível.

- A interface deve exigir a confirmação literal `EXCLUIR`.
- O fluxo deve impedir autoexclusão e exclusão de qualquer `ADMIN`.
- A exclusão deve ser bloqueada quando houver pagamento `PAID`, `PENDING` ou `EXPIRED`, participação vinculada a pagamento, participação ativa ou histórico do alvo como ator administrativo.
- Quando permitida, a remoção dos dados dependentes e do usuário deve ocorrer em uma transação e gerar auditoria.
- Quando a exclusão estiver bloqueada para um `USER`, a desativação deve ser indicada como alternativa.

## Interface web

### RF30 — Páginas do produto

O frontend deve oferecer:

- página inicial pública, jogos do dia, competições e regras;
- cadastro, login, recuperação e redefinição de senha;
- dashboard, fixtures, meus palpites, transparência, estatísticas e perfil;
- participação mensal com PIX, status e histórico;
- área administrativa com visão geral, usuários, pagamentos, participações, pendências e auditoria.

## Fora do escopo implementado

- pontuação funcional por MVP;
- promoção ou rebaixamento de `ADMIN` pela interface;
- edição manual de pagamentos, marcação manual como pago, estorno ou alteração de valor;
- ativação financeira manual de participação;
- ligas privadas, convites, notificações e OAuth;
- premiações, rateio, carteira, saques, odds ou apostas;
- aplicativo móvel nativo e internacionalização.
