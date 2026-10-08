# ParticipaÃ§Ã£o mensal via PIX

## Arquitetura

A participaÃ§Ã£o mensal custa R$ 25,00 (2.500 centavos), definidos exclusivamente
pelo backend. Cada `Payment` local recebe um QR PIX estÃ¡tico Asaas exclusivo, com
valor fixo, expiraÃ§Ã£o e `allowsMultiplePayments: false`:

```text
Payment PENDING
  -> POST /v3/pix/qrCodes/static
  -> providerReference = qrCode.id
  -> encodedImage + payload
  -> pagamento PIX
  -> PAYMENT_RECEIVED
  -> payment.pixQrCodeId encontra providerReference
  -> providerPaymentId = payment.id
  -> Payment PAID
  -> Participation ACTIVE
```

"EstÃ¡tico" Ã© a modalidade da API Asaas; o MatchPredict nÃ£o reutiliza um QR global.
Cada tentativa local elegÃ­vel possui sua prÃ³pria referÃªncia Asaas.

Essa modalidade nÃ£o exige criar previamente uma cobranÃ§a ou um Customer. Quando o
PIX Ã© recebido, o Asaas importa os dados do pagador e cria a cobranÃ§a. Por isso o
MatchPredict nÃ£o chama `POST /customers`, nÃ£o coleta CPF/CNPJ e nÃ£o usa Checkout ou
Payment Link. A `addressKey` pertence Ã  conta recebedora Asaas; ela nÃ£o Ã© um dado
do usuÃ¡rio/pagador.

## PerÃ­odo e autorizaÃ§Ã£o

Uma participaÃ§Ã£o autoriza palpites para fixtures cujo `kickoff`, interpretado em
`America/Sao_Paulo`, pertence ao intervalo mensal `[startsAt, endsAt)`. O backend
continua exigindo `Participation ACTIVE` para criar ou editar um palpite. `PENDING`
e o estado visual do frontend nunca autorizam.

O fechamento por `kickoff <= agora`, `LIVE` ou `FT` continua sendo verificado antes
da autorizaÃ§Ã£o mensal. A funcionalidade nÃ£o altera transparÃªncia, ScoreEngine,
`Standing.adjustmentPoints`, ESPN, Daily Games ou `PredictionResultsScheduler`.

## CriaÃ§Ã£o do QR

O adapter `AsaasPaymentProvider` aceita exclusivamente as combinaÃ§Ãµes oficiais:

- Sandbox: `https://api-sandbox.asaas.com/v3` com chave `$aact_hmlg_...`;
- ProduÃ§Ã£o: `https://api.asaas.com/v3` com chave `$aact_prod_...`.

CombinaÃ§Ãµes cruzadas, configuraÃ§Ã£o incompleta e hosts parecidos ou arbitrÃ¡rios sÃ£o
rejeitados. Em ambos os ambientes, a criaÃ§Ã£o usa `POST /v3/pix/qrCodes/static`:

- autenticaÃ§Ã£o: header `access_token`;
- headers adicionais: `Content-Type: application/json`, `Accept: application/json`
  e `User-Agent` identificado como Sandbox ou ProduÃ§Ã£o conforme a configuraÃ§Ã£o;
- `addressKey`: `ASAAS_PIX_ADDRESS_KEY`;
- `value`: `25.00`;
- `format`: `ALL`;
- `allowsMultiplePayments`: `false`;
- `expirationDate`: instante UTC explÃ­cito;
- `externalReference`: UUID opaco do `Payment` local;
- `description`: mÃªs/ano da participaÃ§Ã£o, sem dados pessoais.

A resposta utilizada contÃ©m `id`, `encodedImage`, `payload` e `expirationDate`. O
backend persiste esses dados para que um refresh possa retomar o mesmo QR sem nova
chamada externa. O frontend aceita somente imagem PNG Base64 e monta localmente a
URL `data:image/png;base64,...`; o payload Ã© exibido como PIX Copia e Cola.

O QR vale 30 minutos, limitado ao `endsAt` do perÃ­odo. QR expirado nÃ£o Ã© reutilizado.
A expiraÃ§Ã£o Ã© observada em leituras e na prÃ³xima solicitaÃ§Ã£o; nÃ£o existe cron para
alterar status.

## Identificadores

- `Payment.id`: identidade interna e `externalReference` opaca;
- `Payment.providerReference`: `qrCode.id`, conhecido antes do pagamento;
- `Payment.providerPaymentId`: `payment.id` da cobranÃ§a criada automaticamente,
  preenchido somente no `PAYMENT_RECEIVED` aceito;
- `Payment.providerEventId`: ID do evento Asaas que efetivou a transiÃ§Ã£o para
  `PAID`.

O `externalReference` Ã© apenas auxiliar. A ativaÃ§Ã£o nÃ£o depende de sua propagaÃ§Ã£o
para a cobranÃ§a criada automaticamente.

## ConcorrÃªncia e timeout inconclusivo

O endpoint de QR estÃ¡tico nÃ£o documenta idempotency key. O backend cria/reutiliza o
`Payment PENDING`, protegido pelo Ã­ndice parcial de um pendente por usuÃ¡rio/perÃ­odo,
e conquista a criaÃ§Ã£o externa com um `updateMany` condicional sobre
`providerCreationStartedAt`. Somente o vencedor chama o Asaas.

Se ocorrer timeout, falha de rede, resposta 5xx/ambÃ­gua, resposta 2xx invÃ¡lida ou
falha ao persistir uma resposta bem-sucedida, o `Payment` permanece `PENDING` com a
reserva de criaÃ§Ã£o. Uma nova requisiÃ§Ã£o retorna `PIX_CREATION_INCONCLUSIVE` e nÃ£o
faz retry externo cego. Erros 4xx definitivos (exceto estados potencialmente
ambÃ­guos como 408, 409, 425 e 429) marcam a tentativa como `FAILED` e permitem uma
nova tentativa local.

Essa escolha pode deixar uma tentativa inconclusiva bloqueada atÃ© conciliaÃ§Ã£o
manual. A integraÃ§Ã£o assume esse risco operacional sem fazer retry cego. Deve-se
confirmar com o suporte Asaas: "ApÃ³s timeout na criaÃ§Ã£o de um QR Code PIX estÃ¡tico
individual via `POST /v3/pix/qrCodes/static`, existe mecanismo oficial de
idempotÃªncia ou consulta segura pelo `externalReference` que permita descobrir se o
QR foi criado antes de tentar novamente?".

## Webhook

Rota pÃºblica: `POST /api/v1/payments/webhook/asaas`.

O webhook Ã© autenticado pelo token prÃ³prio configurado no painel Asaas. O adapter
compara em tempo constante o header `asaas-access-token` com
`ASAAS_WEBHOOK_TOKEN`. Esse token deve ter 32 a 255 caracteres, sem espaÃ§os, e nÃ£o
pode ser a API Key.

Somente `PAYMENT_RECEIVED` pode ativar a participaÃ§Ã£o, e apenas quando:

- `payment.status === RECEIVED`;
- `payment.billingType === PIX`;
- `payment.pixQrCodeId` corresponde a exatamente um `providerReference` local do
  provider `asaas`;
- `payment.value === 25.00`;
- mÃ©todo, moeda, valor local e perÃ­odo estÃ£o consistentes;
- o estado local aceita a transiÃ§Ã£o.

A atualizaÃ§Ã£o de `Payment` e o `upsert` de `Participation ACTIVE` ocorrem na mesma
transaÃ§Ã£o. O ID do evento, o ID da cobranÃ§a e as constraints tornam o processamento
idempotente. Reenvio idÃªntico retorna HTTP 200 sem duplicar participaÃ§Ã£o.

| Evento/condiÃ§Ã£o Asaas                                          | Resultado local                                                                     |
| ---------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| `PAYMENT_RECEIVED` + `RECEIVED` + `PIX` + validaÃ§Ãµes completas | `PAID` e `Participation ACTIVE`                                                     |
| `PAYMENT_CREATED`                                                | Sem efeito; permanece `PENDING`                                                     |
| `PAYMENT_CONFIRMED`                                              | Sem efeito; nÃ£o ativa                                                              |
| `PAYMENT_OVERDUE`                                                | Sem efeito                                                                          |
| `PAYMENT_DELETED`                                                | Sem efeito nesta arquitetura; nÃ£o hÃ¡ regra segura de cancelamento do QR estÃ¡tico |
| `PAYMENT_REFUNDED` e variaÃ§Ãµes                                 | Sem efeito nesta versÃ£o; refund/estorno estÃ¡ fora do escopo funcional             |
| Evento desconhecido/nÃ£o relevante                               | HTTP 200, sem efeito                                                                |
| QR local expirado antes do pagamento                             | `EXPIRED` em leitura/nova tentativa, sem cron                                       |
| Falha definitiva na criaÃ§Ã£o                                    | `FAILED`                                                                            |

Eventos autenticados de outras operaÃ§Ãµes da conta, inclusive `pixQrCodeId`
desconhecido, sÃ£o reconhecidos sem efeito para nÃ£o bloquear a fila geral do Asaas.
Payload `PAYMENT_RECEIVED` inconsistente Ã© rejeitado e nunca ativa participaÃ§Ã£o.

## Endpoints MatchPredict

Todos usam o prefixo global `/api/v1`:

- `GET /participations/me/current`: situaÃ§Ã£o mensal do usuÃ¡rio autenticado;
- `GET /payments/me`: histÃ³rico do usuÃ¡rio autenticado;
- `GET /payments/me/current-pix`: retoma somente do banco o QR atual vÃ¡lido;
- `GET /payments/:paymentId/status`: status local de pagamento prÃ³prio;
- `POST /payments/pix`: cria ou retoma o QR mensal, sem aceitar valor ou `userId`;
- `POST /payments/webhook/asaas`: webhook autenticado do Asaas.

O polling de 30 segundos existe somente no navegador, enquanto `/participation`
estÃ¡ montada, a aba estÃ¡ visÃ­vel e o pagamento estÃ¡ `PENDING`. Ele consulta apenas
o status local. NÃ£o existe polling, worker, cron ou reconciliaÃ§Ã£o periÃ³dica no
backend.

## ConfiguraÃ§Ã£o

Somente o backend usa estas variÃ¡veis:

```dotenv
ASAAS_API_KEY=
ASAAS_BASE_URL=
ASAAS_PIX_ADDRESS_KEY=
ASAAS_WEBHOOK_TOKEN=
```

`ASAAS_BASE_URL` deve ser exatamente `https://api-sandbox.asaas.com/v3` ou
`https://api.asaas.com/v3`, coerente com o prefixo da API Key.
`ASAAS_PIX_ADDRESS_KEY` deve ser uma chave PIX cadastrada na mesma conta/ambiente.
`ASAAS_WEBHOOK_TOKEN` Ã© definido pelo operador no cadastro do webhook e nunca deve
ser igual Ã  API Key. Nenhuma dessas variÃ¡veis Ã© enviada ao frontend ou registrada
em logs.

## Sandbox

O teste manual oficial usa o payload retornado pelo QR em
`POST /v3/pix/qrCodes/pay`. Esse endpoint cria a cobranÃ§a simulada, associa
`pixTransaction`/`pixQrCodeId` e dispara os eventos do fluxo Sandbox. O MatchPredict
nÃ£o expÃµe endpoint para essa simulaÃ§Ã£o e nÃ£o a executa automaticamente.

O webhook local precisa de URL HTTPS pÃºblica apontando exatamente para
`/api/v1/payments/webhook/asaas`; Cloudflare Tunnel ou ngrok sÃ£o opÃ§Ãµes citadas na
documentaÃ§Ã£o Asaas. Nenhum tÃºnel Ã© instalado ou iniciado pelo projeto.

## Migration

A migration aplicada `20261005120000_add_monthly_participations` inclui as tabelas
e constraints da fundaÃ§Ã£o, unicidade de `(provider, provider_reference)`, unicidade
dos IDs de pagamento/evento Asaas, reserva de criaÃ§Ã£o e o Ã­ndice parcial de um
`PENDING` por usuÃ¡rio/perÃ­odo. O Neon atual registra sete migrations aplicadas e
nenhuma pendente na Ãºltima verificaÃ§Ã£o operacional.

## DocumentaÃ§Ã£o oficial reconfirmada

- [Criar QR Code estÃ¡tico](https://docs.asaas.com/reference/create-static-qrcode)
- [Fluxo de QR Code estÃ¡tico](https://docs.asaas.com/docs/creating-a-static-qr-code)
- [Eventos de pagamento](https://docs.asaas.com/docs/payment-events)
- [Receber eventos no webhook](https://docs.asaas.com/docs/receive-asaas-events-at-your-webhook-endpoint)
- [FAQ de webhooks](https://docs.asaas.com/docs/webhooks-faq)
- [Testar pagamento de QR PIX](https://docs.asaas.com/docs/testing-pix-qr-code-payment)
- [AutenticaÃ§Ã£o](https://docs.asaas.com/docs/authentication)
