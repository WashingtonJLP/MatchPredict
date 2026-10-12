# Regras de negócio

## Objetivo

Este documento registra as regras efetivamente aplicadas pelo MatchPredict. O backend é a autoridade para autenticação, participação, pagamentos, palpites, transparência, pontuação, classificação e administração.

## Contas e autenticação

### RN01 — Cadastro

- Nome, e-mail e senha são obrigatórios.
- O nome deve ter entre 3 e 80 caracteres.
- O e-mail deve ser válido, ter no máximo 254 caracteres, ser normalizado e ser único.
- A senha deve ter entre 8 e 72 caracteres e incluir letra maiúscula, letra minúscula e número.
- A senha é persistida como hash bcrypt.
- O contrato público de cadastro não aceita papel de acesso; toda nova conta é criada como `Role.USER`.

### RN02 — Login e JWT

- O login exige e-mail e senha válidos de uma conta ativa.
- Conta com `disabledAt` preenchido não pode entrar.
- Credencial inválida e conta desativada produzem a mesma resposta de autenticação inválida.
- O JWT contém identificador, e-mail, papel e `authVersion` do usuário.
- Em cada requisição protegida, a estratégia JWT consulta o estado atual da conta.
- O token é recusado se a conta não existir, estiver desativada ou se a versão do token for diferente do `authVersion` persistido.
- Endpoints de autenticação possuem limites específicos de requisições.

### RN03 — Recuperação de senha

- A solicitação sempre retorna uma mensagem genérica, sem revelar se o e-mail pertence a uma conta ativa.
- Para uma conta válida, o sistema gera um token aleatório, persiste somente seu hash SHA-256 e define expiração de 30 minutos.
- Conta desativada não recebe fluxo funcional de recuperação.
- A redefinição exige token válido, senha e confirmação idênticas e a política de senha forte.
- Token expirado é removido antes do erro; token consumido também deixa de ser válido.
- Após uma redefinição bem-sucedida, hash e expiração do token são apagados.

### RN04 — Perfil

- O usuário autenticado pode consultar e atualizar apenas o próprio perfil.
- O nome pode ser alterado dentro dos limites de validação.
- A troca de senha exige a senha atual correta e uma nova senha válida.
- Senha e dados de recuperação nunca são expostos nas respostas públicas.

## Futebol e competições

### RN05 — Fontes e escopos esportivos

- A ESPN é a fonte externa dos dados esportivos.
- O catálogo público cobre as competições configuradas e informa se cada uma oferece jogos, classificação, grupos ou mata-mata.
- Jogos do dia podem ser consultados para competições nacionais e internacionais do catálogo.
- O fluxo local de fixtures, palpites, processamento e classificação continua vinculado à competição de palpites configurada como Premier League (`eng.1`).
- Liga, temporada, times, jogadores, fixtures e resultados locais usam identificadores externos para sincronização e UUIDs como identificadores internos.

### RN06 — Temporadas, fixtures e estados

- O fluxo de sincronização mantém a temporada corrente da liga local e pode marcar temporadas anteriores da mesma liga como inativas.
- As consultas de classificação do jogo de palpites usam uma temporada ativa associada a liga ativa.
- A fixture armazena rodada, kickoff, times, placar, vencedor, status e data de processamento.
- Os estados locais de fixture são `NS`, `LIVE`, `FT`, `POSTPONED` e `CANCELLED`.
- Resultado final utilizável exige `homeGoals` e `awayGoals` preenchidos.
- `processedAt` identifica que a pontuação daquela fixture já foi processada.

### RN07 — Consulta de fixtures

- A listagem local de fixtures exige autenticação.
- Os filtros disponíveis incluem status, rodada, time e intervalo de kickoff.
- O resultado é paginado e ordenado por kickoff crescente.
- Cada fixture pode incluir o palpite da conta autenticada.
- O indicador de criação de palpite considera se a fixture está aberta e se o usuário ainda não possui palpite nela.

## Período e participação mensal

### RN08 — Definição do período

- A participação é organizada por mês calendário em `America/Sao_Paulo`.
- Um período começa à meia-noite local do primeiro dia do mês e termina, com limite exclusivo, à meia-noite local do primeiro dia do mês seguinte.
- O período é identificado de forma única por `referenceYear` e `referenceMonth`.
- O valor atual é R$ 25,00, armazenado como `2_500` centavos em `BRL`.
- Um `ParticipationPeriod` pode estar `OPEN` ou `CLOSED`.

### RN09 — Elegibilidade para palpitar

- A autorização efetiva depende de uma `Participation` com status `ACTIVE`.
- A participação deve pertencer ao usuário e a um período `OPEN` cujo intervalo contenha o kickoff da fixture.
- O kickoff, e não a data em que a requisição é feita, determina o período exigido.
- A regra é verificada ao criar e ao editar um palpite.
- `Payment PENDING` não autoriza palpites.
- `Payment PAID` deve passar pelo fluxo que cria a `Participation ACTIVE`; o pagamento isolado não substitui essa participação.
- A exclusão de um palpite próprio ainda aberto não repete a verificação de participação.

### RN10 — Estados da participação

- `ParticipationStatus.ACTIVE` concede a elegibilidade do período enquanto este estiver aberto.
- `ParticipationStatus.CANCELLED` não autoriza palpites.
- Deve existir no máximo uma participação por usuário e período.
- Uma participação criada pelo fluxo financeiro é vinculada de forma única ao pagamento que a ativou.

## Pagamento PIX

### RN11 — Criação e reutilização da cobrança

- O único método implementado é `PIX` e o provedor configurado é o Asaas.
- A criação usa o período mensal vigente na data da solicitação.
- Se já houver participação ativa no período, uma nova cobrança é recusada.
- Cobranças `PENDING` vencidas do usuário e período são marcadas como `EXPIRED` antes da seleção de uma cobrança reutilizável.
- Um pagamento `PENDING` já reservado deve ser reutilizado; se seus dados PIX estiverem completos e válidos, eles são devolvidos sem criar outro QR.
- A reserva local e a criação no provedor possuem proteção contra concorrência.
- O QR PIX estático expira em até 30 minutos e nunca ultrapassa o fim do período.
- Falha definitiva antes de obter referência do provedor leva o pagamento a `FAILED`; resultado externo inconclusivo não deve provocar criação automática duplicada.

### RN12 — Estados de pagamento

- `PENDING`: cobrança criada ou reservada, ainda sem confirmação financeira; não autoriza participação.
- `PAID`: recebimento confirmado e associado ao fluxo de ativação da participação.
- `EXPIRED`: prazo local do PIX encerrado; ainda pode ser confirmado pela reconciliação quando todas as demais condições forem válidas.
- `CANCELLED`: estado persistível para cobrança cancelada e não elegível como pagamento novo.
- `FAILED`: criação definitivamente malsucedida antes da conclusão do PIX.

### RN13 — Consulta pelo usuário

- O histórico pessoal lista somente pagamentos `PAID`, do mais recente para o mais antigo.
- `current-pix` devolve apenas a cobrança `PENDING` do período atual que tenha referência, payload, QR e expiração futura.
- A consulta de status e a reconciliação exigem que o pagamento pertença ao usuário autenticado.
- Uma cobrança `PENDING` vencida é apresentada com estado efetivo `EXPIRED` quando consultada.

### RN14 — Webhook do Asaas

- O webhook deve ser autenticado pelo token dedicado configurado no ambiente, comparado em tempo constante.
- Somente o provedor conhecido é aceito.
- Eventos diferentes de `PAYMENT_RECEIVED` são reconhecidos e ignorados.
- Um `PAYMENT_RECEIVED` só é processado quando representar pagamento `PIX` com estado Asaas `RECEIVED` e dados coerentes.
- A correlação principal usa o identificador do QR estático em `providerReference`; valor, moeda, método, provedor e período também são validados.
- Evento sem pagamento local correspondente é reconhecido e ignorado, sem ativar usuário algum.

### RN15 — Confirmação e ativação

- A confirmação aceita um pagamento local `PENDING` ou `EXPIRED` elegível.
- A transição para `PAID` registra `providerPaymentId`, `providerEventId` quando disponível e `paidAt`.
- Na mesma transação serializável, o sistema cria a `Participation ACTIVE` vinculada ao pagamento.
- Se já houver participação do usuário para o período vinculada a outro pagamento, a confirmação é tratada como conflito financeiro.
- `providerPaymentId` e `providerEventId` não podem ser reutilizados entre pagamentos.
- Eventos repetidos com os mesmos identificadores são idempotentes; dados divergentes são rejeitados.
- A confirmação pode ocorrer por webhook ou reconciliação, mantendo as mesmas verificações de equivalência e integridade.

### RN16 — Reconciliação pontual

- O usuário pode pedir a verificação de uma cobrança própria no Asaas quando o pagamento e o período forem elegíveis.
- A busca no provedor usa a referência do QR estático e exige exatamente uma correspondência coerente.
- Somente o estado externo `RECEIVED` confirma o pagamento; demais estados permanecem sem ativação.
- A reconciliação possui cooldown de dois minutos por pagamento e rate limit no endpoint.
- Se o webhook chegar depois de uma reconciliação válida, o evento completa a correlação sem duplicar pagamento ou participação.
- Não existe polling, cron financeiro ou confirmação automática periódica de pagamentos.

## Palpites e transparência

### RN17 — Criação de palpite

- Apenas usuário autenticado com participação ativa no período da fixture pode criar palpite.
- O placar previsto contém gols do mandante e do visitante, inteiros entre 0 e 20.
- O par `(userId, fixtureId)` é único.
- A fixture deve existir e estar aberta.
- A criação é recusada se já houver palpite do usuário para a fixture.
- MVP não integra o contrato atual de criação.

### RN18 — Fechamento por kickoff e status

- Uma fixture fecha para palpites quando o kickoff é menor ou igual ao horário atual, ou quando o status é `LIVE` ou `FT`.
- O fechamento é individual por fixture; não ocorre de uma só vez para toda a rodada.
- A proteção definitiva é aplicada no backend, independentemente do estado exibido no frontend.
- Após o fechamento, criação, edição e exclusão são recusadas.

### RN19 — Edição e exclusão

- Somente o dono pode editar ou excluir um palpite.
- A edição aceita `homeGoals`, `awayGoals` ou ambos e exige ao menos um dos campos.
- A edição exige que a fixture continue aberta e que a participação aplicável continue ativa.
- A exclusão exige que a fixture continue aberta.

### RN20 — Meus palpites

- A listagem retorna somente palpites da conta autenticada e não inclui fixtures sem palpite.
- O endpoint ordena pela criação do palpite em ordem decrescente.
- A separação entre ativos e histórico e o filtro visual de rodada são feitos no frontend.

### RN21 — Transparência

- Antes do fechamento, a transparência retorna somente o palpite do usuário autenticado, quando existir.
- Se o usuário não tiver palpite antes do fechamento, nenhum palpite alheio é revelado.
- A partir do fechamento, todos os palpites da fixture podem ser exibidos, mesmo que o usuário não tenha participado.
- A lista é ordenada pelo nome do usuário e, em seguida, pela data de criação do palpite.
- O resultado final só é exposto quando a fixture está `FT` e possui ambos os gols preenchidos.

## Pontuação e classificação

### RN22 — Pontuação do placar

- Placar exato vale 3 pontos.
- Acerto do vencedor ou do empate sem placar exato vale 1 ponto.
- Erro do vencedor ou do empate vale 0 ponto.
- Sem placar final completo, o cálculo devolve 0 ponto.
- No cálculo atual, `scorePoints` e `totalPoints` do palpite recebem o mesmo valor.
- Campos de MVP permanecem no banco, mas não participam da entrada nem da pontuação atual.

### RN23 — Processamento de resultado

- Somente fixture existente, com status `FT`, placar completo e `processedAt` vazio pode ser processada.
- O processamento calcula todos os palpites da fixture, atualiza standings dos usuários afetados e preenche `processedAt`.
- A atualização ocorre em transação e usa uma alteração condicional de `processedAt` como trava contra concorrência.
- Uma fixture já processada retorna `alreadyProcessed` sem recalcular.

### RN24 — Consolidação do standing

- Existe no máximo um `Standing` por usuário e temporada.
- A consolidação considera palpites de fixtures `FT` da temporada.
- São acumulados pontos naturais, placares exatos, vencedores corretos e erros.
- `adjustmentPoints` é preservado durante o recálculo.
- `totalPoints` é materializado como pontos naturais mais `adjustmentPoints`.

### RN25 — Posição oficial

- A classificação usa uma política única de ordenação, nesta sequência:
  1. `totalPoints` decrescente;
  2. `exactScores` decrescente;
  3. `correctWinners` decrescente;
  4. `wrongPredictions` crescente;
  5. `createdAt` crescente.
- A posição é o índice da lista ordenada acrescido de um.
- O campo legado `Standing.position` não é fonte da posição oficial nem da posição mostrada no Admin.
- Não existe `id` como critério adicional de desempate.
- Ranking público, posição pessoal e detalhe administrativo devem derivar da mesma política.

### RN26 — Estatísticas pessoais

- As estatísticas consideram a temporada ativa.
- Média e acurácia consideram palpites de fixtures processadas conforme o cálculo do serviço.
- Melhor e pior rodada são obtidas pela soma de pontos das fixtures processadas; em empate, prevalece o menor número da rodada.
- A posição atual segue a ordem oficial do ranking.

## Sincronização automática

### RN27 — Scheduler de resultados

- O scheduler é acionado a cada cinco minutos, com sobreposição impedida por `waitForCompletion`.
- Antes de consultar o banco por fixtures pendentes, ele consulta na ESPN os jogos da Premier League em uma janela de datas ao redor do dia atual.
- Em memória, fingerprints identificam mudanças relevantes de status ou placar.
- Sem mudança de fingerprint, não há reconciliação local naquele ciclo.
- Há uma reconciliação completa na inicialização e, depois, no máximo uma tentativa completa por dia; em falha da consulta ESPN, essa tentativa completa ainda pode ocorrer.
- Quando há mudanças, apenas os identificadores afetados limitam a sincronização e a busca local.
- O scheduler não executa reconciliação financeira nem consulta contínua de pagamentos.

## Administração e segurança

### RN28 — Papéis e proteção

- Existem `Role.USER` e `Role.ADMIN`.
- Cadastro público sempre cria `USER`.
- As rotas de `/api/v1/admin` exigem `JwtAuthGuard`, `RolesGuard` e `Role.ADMIN`.
- Endpoints esportivos antigos de sincronização e processamento também verificam explicitamente o papel administrativo.
- Não há promoção ou rebaixamento de administrador pela interface ou por endpoint público.

### RN29 — Operação administrativa

- O dashboard e as listagens administrativas são consultas sob demanda; não criam polling ou atividade periódica no banco.
- Usuários, pagamentos e participações possuem busca, filtros e paginação conforme seus DTOs.
- Pendências financeiras são pagamentos `PAID` sem participação ou sem participação `ACTIVE` correspondente.
- A área de pendências é observacional: não marca pagamento como pago, não altera valor, não estorna e não ativa participação manualmente.
- O detalhe de usuário não expõe senha, tokens de recuperação ou segredos de pagamento.
- A classificação apresentada no detalhe administrativo é calculada dinamicamente pela política oficial.

### RN30 — Desativação e reativação

- Somente contas `USER` podem ser alteradas por esses endpoints; contas `ADMIN` são protegidas.
- Desativar preenche `disabledAt`, incrementa `authVersion` e remove token e expiração de recuperação de senha.
- O incremento invalida imediatamente JWTs anteriores em novas requisições protegidas.
- Desativar preserva palpites, standings, pagamentos, participações e histórico.
- Reativar remove `disabledAt`; o histórico permanece intacto.
- Repetir o estado atual é tratado como conflito.
- Cada alteração ocorre em transação serializável e cria `AdminAuditLog`.
- No frontend, a desativação exige confirmação explícita antes da mutação.

### RN31 — Exclusão segura

- A exclusão administrativa é destinada a conta de teste elegível e exige a confirmação literal `EXCLUIR`.
- O administrador não pode excluir a própria conta nem qualquer conta `ADMIN`.
- A exclusão é bloqueada por pagamento `PAID`, `PENDING` ou `EXPIRED`.
- Também bloqueiam a exclusão: participação vinculada a pagamento, participação `ACTIVE` e histórico em que o alvo seja ator de auditoria administrativa.
- Quando não há bloqueadores, participações sem pagamento, pagamentos `FAILED` ou `CANCELLED`, palpites, standings e o usuário podem ser removidos na mesma transação.
- A ação `USER_DELETED` é registrada pelo administrador antes da remoção do alvo.
- Quando um `USER` não pode ser excluído, a alternativa indicada é desativar a conta.

### RN32 — Integridade da API

- A validação global remove campos não autorizados, transforma tipos e rejeita propriedades extras.
- Parâmetros identificadores relevantes são validados como UUID v4.
- Configurações sensíveis são obtidas do ambiente e não devem aparecer em respostas ou logs.
- Em produção, CORS depende de origem configurada.
- Swagger é habilitado fora de produção.
- O backend aplica limites gerais e limites mais restritos nos fluxos sensíveis.

## Limitações deliberadas do escopo atual

- Não há pontuação funcional por MVP.
- Não há CRUD administrativo manual de competições, times, fixtures ou resultados.
- Não há promoção de `USER` para `ADMIN` pela aplicação.
- Não há mutação financeira manual no painel administrativo.
- Não há prêmio, rateio, carteira, saque, odds ou aposta.
- `SyncLog` existe no schema, mas não participa do fluxo atual de sincronização.
