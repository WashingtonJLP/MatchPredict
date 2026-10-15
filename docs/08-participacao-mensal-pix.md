# Participação mensal via PIX

## Visão geral

O MatchPredict usa uma participação mensal para autorizar a criação e a edição de palpites. O pagamento é feito por PIX, com QR estático individual gerado pelo Asaas.

Os três registros têm responsabilidades diferentes:

- `ParticipationPeriod` representa o mês e o valor aplicável;
- `Payment` representa a cobrança e sua confirmação financeira;
- `Participation` representa a autorização efetiva do usuário naquele período.

```text
Payment PENDING
  → QR PIX estático do Asaas
  → PAYMENT_RECEIVED ou reconciliação válida
  → Payment PAID
  → Participation ACTIVE
  → autorização para palpitar no período
```

`Payment PENDING` não autoriza palpites. Mesmo um `Payment PAID` só integra o fluxo correto quando possui a `Participation ACTIVE` correspondente. A verificação de autorização consulta a participação, não o estado visual do frontend.

## Valor e período

O valor atual é definido no backend:

- R$ 25,00;
- `2_500` centavos;
- moeda `BRL`;
- método `PIX`.

Valores monetários são persistidos como inteiros em centavos. O cliente não envia nem escolhe o valor.

O período segue o mês calendário em `America/Sao_Paulo`:

- `referenceYear` e `referenceMonth` identificam o mês;
- `startsAt` representa a meia-noite local do primeiro dia;
- `endsAt` representa, como limite exclusivo, a meia-noite local do primeiro dia do mês seguinte;
- `(referenceYear, referenceMonth)` é único.

`ParticipationPeriodsService.getOrCreate()` cria o período corrente com status `OPEN` e o valor fixo, ou reutiliza o registro já existente. A operação trata concorrência de criação pela unicidade do mês.

## Período exigido por uma fixture

A autorização para um palpite é definida pelo kickoff da fixture:

```text
period.startsAt <= fixture.kickoff < period.endsAt
```

Para criar ou editar, deve existir uma `Participation ACTIVE` do usuário nesse período, e o `ParticipationPeriod` deve permanecer `OPEN`.

Isso é independente da data em que o usuário abre a tela. Uma fixture de outro mês exige a participação correspondente ao mês de seu kickoff. A exclusão de um palpite próprio ainda aberto não executa novamente a verificação de participação.

As regras normais de fechamento continuam válidas: kickoff alcançado, `LIVE` ou `FT` bloqueiam alterações mesmo que a participação esteja ativa.

## ParticipationPeriod

O período contém:

- referência de ano e mês;
- início e fim em UTC correspondentes aos limites de `America/Sao_Paulo`;
- `participationFeeCents`;
- status `OPEN` ou `CLOSED`.

O status `CLOSED` impede que uma participação autorize palpites e torna o pagamento inelegível à confirmação/reconciliação normal.

## Participation

Uma participação contém usuário, período, status, data de ativação e um `paymentId` opcional.

Regras estruturais:

- existe no máximo uma participação por usuário e período;
- um pagamento pode ser associado a no máximo uma participação;
- `ACTIVE` autoriza, desde que o período esteja aberto;
- `CANCELLED` não autoriza;
- a participação financeira criada após confirmação fica vinculada ao pagamento que a ativou.

## Payment

O pagamento local registra:

- usuário e período;
- valor, moeda e método;
- estado local;
- provedor;
- identificadores de correlação;
- reserva de criação externa;
- payload PIX, imagem do QR e expiração;
- data de pagamento e datas de auditoria.

### Estados locais

| Estado | Significado na implementação |
| --- | --- |
| `PENDING` | Cobrança reservada/criada, sem confirmação; não autoriza palpites |
| `PAID` | Recebimento validado pelo fluxo financeiro |
| `EXPIRED` | Prazo do QR encerrado; pode ser reconciliável enquanto o período estiver aberto |
| `CANCELLED` | Estado modelado para cobrança cancelada; não autoriza nem é reutilizado como pendente |
| `FAILED` | Criação externa terminou com falha classificada como definitiva |

Uma leitura de status pode apresentar `EXPIRED` para um registro ainda persistido como `PENDING` cuja expiração já passou. Ao solicitar outro PIX, pendências vencidas do usuário e período são persistidas como `EXPIRED` antes da criação de uma nova tentativa.

## Identificadores de correlação

| Campo | Origem e função |
| --- | --- |
| `Payment.id` | UUID local; também enviado como `externalReference` ao criar o QR |
| `providerReference` | `id` do QR estático; existe antes do recebimento e corresponde a `pixQrCodeId` |
| `providerPaymentId` | ID do pagamento criado pelo Asaas após o recebimento |
| `providerEventId` | ID único do webhook que confirmou o recebimento; pode ficar nulo quando a primeira confirmação veio da reconciliação |
| `providerCreationStartedAt` | Reserva local que impede duas criações externas concorrentes |

`providerPaymentId` e `providerEventId` são únicos. O par `(provider, providerReference)` também é único.

No webhook, a busca local usa `provider + providerReference`. Na reconciliação, além dessa referência, o backend exige que o `externalReference` retornado pelo Asaas seja igual ao `Payment.id` local.

## Criação do PIX

O endpoint `POST /api/v1/payments/pix` usa a conta autenticada; não aceita `userId`, valor ou estado no corpo.

Fluxo:

1. verifica se o provider está configurado;
2. obtém ou cria o período correspondente ao instante atual;
3. valida que o valor persistido do período continua igual a 2.500 centavos;
4. procura participação ativa e recusa nova cobrança se ela já existir;
5. marca como `EXPIRED` qualquer pendência vencida do mesmo usuário e período;
6. reutiliza o `PENDING` atual ou cria um novo;
7. conquista uma reserva condicional por `providerCreationStartedAt`;
8. solicita o QR estático ao Asaas;
9. persiste referência, payload, imagem e expiração;
10. devolve somente os dados necessários para o pagamento.

A migration mantém no máximo um `Payment PENDING` por usuário e período por meio de índice parcial único. A preparação usa transação serializável e retry limitado para conflitos concorrentes. Somente a requisição que conquista a reserva chama o Asaas.

### QR PIX estático

O provider chama `POST /v3/pix/qrCodes/static` com:

- chave PIX recebedora configurada no backend;
- valor `25.00`;
- formato `ALL`;
- `allowsMultiplePayments: false`;
- expiração explícita;
- `externalReference` igual ao UUID local do pagamento;
- descrição do mês/ano, sem dados pessoais do usuário.

O MatchPredict não cria `Customer`, Checkout ou Payment Link para esse fluxo. “Estático” é a modalidade da API; não significa um QR global compartilhado. Cada tentativa elegível tem sua própria referência no Asaas.

A resposta deve conter `id`, `encodedImage` e `payload`. O frontend aceita a imagem somente como Base64 PNG válido e monta localmente `data:image/png;base64,...`; o payload é exibido como PIX copia e cola.

A expiração solicitada ao Asaas é o menor instante entre 30 minutos após a criação e `endsAt`. A resposta só é aceita se trouxer uma expiração futura que não ultrapasse o fim do período. Não existe cron para marcar expiração.

### Reutilização e tentativas inconclusivas

Se houver um PIX `PENDING` com referência, payload, imagem e expiração futura, a API o retorna sem nova chamada externa.

Se a criação externa já foi reservada ou possui referência, mas o payload local não está reutilizável, a API retorna `PIX_CREATION_INCONCLUSIVE` e não executa retry cego.

Erros HTTP 4xx classificados como definitivos, exceto `408`, `409`, `425` e `429`, levam a tentativa sem referência a `FAILED`. Timeout, falha de rede, resposta ambígua ou falha de persistência permanecem inconclusivos para evitar duplicar um QR que possa ter sido criado externamente. A resolução desse caso fica fora do fluxo automático do usuário.

## Confirmação pelo webhook

Rota:

```text
POST /api/v1/payments/webhook/asaas
```

O webhook não usa JWT de usuário. Ele é autenticado pelo header `asaas-access-token`, comparado em tempo constante com `ASAAS_WEBHOOK_TOKEN`.

Somente `PAYMENT_RECEIVED` pode confirmar. O evento precisa conter:

- identificadores de evento e pagamento;
- estado Asaas `RECEIVED`;
- método `PIX`;
- `pixQrCodeId` correspondente à referência local;
- valor positivo representável em centavos.

Depois da correlação, o serviço também valida provedor, método, moeda `BRL`, valor de 2.500 centavos, valor do período e período `OPEN`.

Eventos diferentes de `PAYMENT_RECEIVED` são reconhecidos e ignorados. Evento autenticado de operação sem pagamento local correspondente também é ignorado. Um `PAYMENT_RECEIVED` inconsistente é rejeitado e não ativa participação.

## Transação de ativação

A confirmação por webhook ou reconciliação converge para a mesma rotina:

1. abre transação serializável;
2. lê o pagamento e seu vínculo atual;
3. aceita transição somente de `PENDING` ou `EXPIRED`, ou valida idempotência se já estiver `PAID`;
4. atualiza o pagamento para `PAID` e registra os identificadores disponíveis e `paidAt`;
5. verifica se já existe participação do usuário no período;
6. cria a `Participation ACTIVE` vinculada ao pagamento;
7. conclui os dois efeitos na mesma transação.

Conflitos de serialização têm retry limitado. Reenvio equivalente é idempotente. Identificadores divergentes, participação vinculada a outro pagamento ou reutilização de identificador financeiro produzem conflito em vez de duplicação.

Portanto:

- `PENDING` nunca autoriza;
- uma confirmação válida muda o pagamento para `PAID` e cria a participação;
- a autorização posterior continua dependendo de `Participation ACTIVE` em período `OPEN`.

## Consulta de status, histórico e current-pix

| Endpoint | Comportamento |
| --- | --- |
| `GET /api/v1/participations/me/current` | Retorna situação da participação e descritor do mês atual |
| `GET /api/v1/payments/me` | Lista somente pagamentos `PAID` do usuário, do mais recente para o mais antigo |
| `GET /api/v1/payments/me/current-pix` | Retorna o `PENDING` válido do mês atual ou `null`; não chama o Asaas |
| `GET /api/v1/payments/:paymentId/status` | Retorna estado local efetivo, `paidAt` e expiração de cobrança própria |
| `POST /api/v1/payments/pix` | Cria ou retoma o PIX mensal |
| `POST /api/v1/payments/:paymentId/reconcile` | Consulta pontualmente o Asaas para cobrança própria elegível |

O histórico não expõe referências do provedor, payload do webhook ou credenciais.

## Reconciliação quando o webhook atrasa

A reconciliação aceita pagamentos próprios com método, moeda, valor, provedor e referência corretos, associados a período `OPEN`, nos estados `PENDING`, `EXPIRED` ou `PAID`.

Para `PENDING` ou `EXPIRED`, o backend consulta o Asaas por `pixQrCodeId`, com limite de duas respostas:

- nenhuma correspondência: retorna `not_received` sem ativar;
- mais de uma correspondência: rejeita como ambígua;
- uma correspondência: valida método, valor, moeda, referência, `externalReference` e identificador externo;
- somente estado Asaas `RECEIVED` confirma;
- demais estados reconhecidos permanecem sem ativação.

Se o pagamento já está `PAID`, a reconciliação retorna `already_paid` somente após confirmar que a participação vinculada está `ACTIVE`.

### Cooldown e atualização da tela

- O endpoint permite 3 requisições por minuto.
- O serviço mantém cooldown de dois minutos por pagamento em memória e devolve `retryAfterSeconds`; tentativas antecipadas recebem `429`.
- O frontend respeita esse prazo para desabilitar nova tentativa manual.
- Enquanto o PIX exibido permanece `PENDING`, o frontend consulta o status local a cada 30 segundos.
- O polling para quando o estado deixa de ser `PENDING` e não roda em background.
- Uma tentativa automática de reconciliação é agendada para 90 segundos após a criação e ocorre apenas uma vez por pagamento enquanto a página está montada; se a aba estiver oculta, aguarda voltar a ficar visível.
- A query de status possui um retry de cliente para falha de consulta.
- O botão manual continua disponível fora do cooldown.

Quando a confirmação é detectada, as queries de participação, histórico e `current-pix` são invalidadas para atualizar a interface.

Não existe polling, cron ou job financeiro no backend. A atividade descrita acima existe somente enquanto a página de participação está aberta no navegador.

## Quando já existe um registro elegível

### Participação ativa

Se já existe `Participation ACTIVE` para o usuário e período, a criação de outro PIX é recusada com conflito. O usuário já está autorizado e não deve gerar nova cobrança.

### Pagamento pendente válido

O mesmo pagamento e os mesmos dados do QR são reutilizados. Não há nova chamada ao Asaas.

### Pagamento pendente vencido

O registro é marcado como `EXPIRED` durante uma nova solicitação e pode ser criado um novo `PENDING`. O pagamento expirado ainda pode ser reconciliado se o período continuar `OPEN` e o Asaas comprovar recebimento válido.

### Pagamento pago sem participação ativa

Esse estado é inconsistente com o fluxo transacional normal. O Admin o lista como pendência financeira observacional; não existe botão para ativar manualmente, marcar como pago, alterar valor ou estornar.

## Segurança

- Endpoints pessoais exigem JWT e restringem consultas ao `userId` autenticado.
- Valor, moeda, método e identidade do usuário vêm do servidor.
- O webhook usa token dedicado, com 32 a 255 caracteres, sem espaços e diferente da API key.
- Apenas os hosts exatos de sandbox e produção do Asaas são aceitos, coerentes com o prefixo da chave.
- Chamadas Asaas usam timeout de 15 segundos e não seguem redirecionamentos.
- `providerPaymentId`, `providerEventId`, `(provider, providerReference)`, `(userId, periodId)` da participação e o vínculo `paymentId` possuem proteções de unicidade.
- Segredos permanecem no backend e não são enviados ao navegador.
- Logs registram resultado operacional e identificadores locais necessários, não valores de credenciais.
- A descrição enviada ao QR não contém nome, e-mail, CPF ou outro dado pessoal do pagador.

Variáveis usadas pelo backend, sem valores:

```dotenv
ASAAS_API_KEY=<configurado no ambiente>
ASAAS_BASE_URL=<URL oficial coerente com o ambiente>
ASAAS_PIX_ADDRESS_KEY=<chave da conta recebedora>
ASAAS_WEBHOOK_TOKEN=<token dedicado do webhook>
```

## Responsabilidades

### MatchPredict

- definir período, valor e elegibilidade;
- criar e persistir o pagamento local;
- solicitar e exibir o QR estático;
- autenticar e validar webhook;
- correlacionar registros locais e externos;
- reconciliar sob demanda;
- mudar `Payment` para `PAID` e criar `Participation ACTIVE` de forma atômica;
- expor status e histórico sem segredos;
- preservar idempotência e indicar inconsistências para revisão administrativa.

### Asaas

- gerar o QR PIX estático;
- receber e registrar a transação PIX;
- atribuir os identificadores externos;
- emitir o evento `PAYMENT_RECEIVED`;
- permitir consulta do pagamento pela referência do QR.

O MatchPredict não executa estorno, reembolso ou alteração financeira no Asaas. Essas operações não fazem parte do fluxo implementado.

## Configuração de ambiente

O adapter aceita somente:

- sandbox: `https://api-sandbox.asaas.com/v3`, com chave de sandbox;
- produção: `https://api.asaas.com/v3`, com chave de produção.

Combinação cruzada entre URL e prefixo de chave é recusada. A chave PIX e o token de webhook também são obrigatórios para o provider ser considerado configurado.

Nenhuma credencial, payload privado ou valor real de variável de ambiente deve ser incluído na documentação ou versionado.

## Banco e migrations

A fundação do fluxo foi criada pela migration `20261005120000_add_monthly_participations`, que adicionou enums, tabelas, FKs restritivas, constraints de valor e datas, unicidades de correlação e o índice parcial de um `PENDING` por usuário e período.

O painel administrativo e seus índices foram adicionados posteriormente sem alterar as regras financeiras. Esta documentação não pressupõe execução manual de migration nem informa estado operacional de um banco específico.
