<div align="center">

<h1>MatchPredict</h1>

<h3>Uma plataforma de palpites de futebol</h3>

<p>
  Acompanhe jogos e competições, registre seus palpites e dispute posições no ranking.<br>
  O MatchPredict está disponível online.
</p>

<a href="https://matchpredict.com.br">
  <img src="https://img.shields.io/badge/Acessar_MatchPredict-65A30D?style=for-the-badge" alt="Acessar MatchPredict">
</a>

<br><br>

<img src="docs/images/MatchPredict.png" alt="Identidade visual do MatchPredict" width="720">

</div>

MatchPredict é uma plataforma full-stack em que usuários acompanham jogos e competições, participam mensalmente via PIX, registram placares antes do kickoff e consultam transparência, pontuação, classificação e estatísticas. Uma área administrativa protegida reúne a operação de usuários, pagamentos, participações, pendências e auditoria.

## Funcionalidades

- cadastro, login JWT, recuperação de senha e perfil;
- jogos do dia e catálogo de competições nacionais e internacionais via ESPN;
- fixtures locais da Premier League, com filtros e paginação;
- criação, edição e exclusão de palpites antes do fechamento;
- participação mensal obrigatória, com pagamento PIX pelo Asaas;
- webhook, status, `current-pix`, histórico e reconciliação pontual;
- transparência dos palpites após o kickoff;
- pontuação automática, standings e estatísticas pessoais;
- scheduler de resultados com gate por dados da ESPN para reduzir leituras no Neon;
- painel Admin responsivo para usuários, pagamentos, participações, pendências e auditoria.

## Stack

### Frontend

- Next.js 15, React 19 e TypeScript;
- Tailwind CSS;
- TanStack Query e Axios;
- React Hook Form e Zod;
- Base UI, Lucide React, Sonner e `next-themes`.

### Backend

- NestJS 11 e TypeScript;
- Prisma ORM e PostgreSQL/Neon;
- Passport JWT, Class Validator e NestJS Throttler;
- NestJS Schedule;
- Axios, Nodemailer e Swagger;
- ESPN para dados esportivos e Asaas para PIX.

### Infraestrutura

- Docker e Docker Compose;
- Cloudflare Tunnel;
- imagens Node.js 20 Alpine com build multi-stage.

## Estrutura

```text
MatchPredict/
├── backend/        API NestJS, Prisma, migrations e testes
├── frontend/       aplicação Next.js e testes direcionados
├── docs/           documentação funcional e técnica
└── compose.yaml    orquestração dos containers
```

## Arquitetura resumida

```text
Browser
  → Frontend Next.js
  → API NestJS (/api/v1)
  → Prisma
  → PostgreSQL / Neon

API NestJS
  → ESPN: jogos, competições e resultados
  → Asaas: QR PIX, webhook e reconciliação
  → SMTP: recuperação de senha
```

O backend é a fonte de verdade para autorização, período mensal, fechamento de palpites, pontuação, classificação e regras administrativas. Veja [Arquitetura](docs/06-arquitetura.md) para os fluxos completos.

## Documentação

- [Visão geral](docs/01-visao-geral.md)
- [Requisitos funcionais](docs/02-requisitos-funcionais.md)
- [Regras de negócio](docs/03-regras-de-negocio.md)
- [Modelagem do banco](docs/04-modelagem-do-banco.md)
- [Endpoints da API](docs/05-endpoints.md)
- [Arquitetura](docs/06-arquitetura.md)
- [Roadmap](docs/07-roadmap.md)
- [Participação mensal via PIX](docs/08-participacao-mensal-pix.md)

## Execução local

### Pré-requisitos

- Node.js 20+
- npm
- PostgreSQL acessível localmente ou no Neon

### Backend

```bash
cd backend
npm ci
cp .env.example .env
npx prisma generate
npx prisma migrate deploy
npm run start:dev
```

Para manter a combinação já prevista no exemplo de ambiente, o backend usa `http://localhost:3000` e o frontend deve ser iniciado na porta `3001`.

Variáveis principais de `backend/.env`, sempre com valores locais e nunca com credenciais versionadas:

```dotenv
PORT=3000
DATABASE_URL=<url-postgresql>
JWT_SECRET=<segredo-forte>
JWT_EXPIRES_IN=7d

FRONTEND_URL=http://localhost:3001

EMAIL_PROVIDER=smtp
SMTP_HOST=<host-smtp>
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=<usuario-smtp>
SMTP_PASSWORD=<senha-smtp>
EMAIL_FROM=<remetente>

ESPN_API_URL=https://site.api.espn.com/apis/site/v2
ESPN_CORE_API_URL=https://sports.core.api.espn.com/v2
ESPN_SCOREBOARD_API_URL=https://site.web.api.espn.com/apis/site/v2
ESPN_STANDINGS_API_URL=https://site.web.api.espn.com/apis/v2
ESPN_LEAGUE=eng.1
ESPN_COUNTRY=England
ESPN_LEAGUE_LOGO=<url-do-logo>

ASAAS_API_KEY=<configurado-no-ambiente>
ASAAS_BASE_URL=https://api-sandbox.asaas.com/v3
ASAAS_PIX_ADDRESS_KEY=<chave-pix-recebedora>
ASAAS_WEBHOOK_TOKEN=<token-dedicado-do-webhook>
```

`CORS_ORIGINS` e `TRUST_PROXY_HOPS` são opcionais conforme a topologia. O ambiente de produção deve usar a URL e as credenciais Asaas de produção de forma coerente; consulte a documentação específica de PIX antes de configurar.

### Frontend

Crie `frontend/.env.local`:

```dotenv
NEXT_PUBLIC_API_URL=http://localhost:3000/api/v1
```

Depois execute:

```bash
cd frontend
npm ci
npm run dev -- -p 3001
```

- Aplicação: `http://localhost:3001`
- API: `http://localhost:3000/api/v1`
- Swagger, fora de produção: `http://localhost:3000/api/docs`

## Docker Compose

O `compose.yaml` define:

- `backend`: porta `3000` do container exposta em `127.0.0.1:3001`;
- `frontend`: porta `3000` do container exposta em `3002`;
- `cloudflared`: túnel com `network_mode: host` e configuração em `./cloudflared`.

O backend lê `backend/.env`. O build do frontend recebe `NEXT_PUBLIC_API_URL` a partir do ambiente usado pelo Compose.

```bash
docker compose up --build
```

Mantenha `.env`, credenciais do Asaas, configuração privada do túnel e demais segredos fora do Git.

## Scripts úteis

Backend:

```bash
cd backend
npm run build
npm run lint
npm test
npm run test:e2e
```

Frontend:

```bash
cd frontend
npm run build
npm run lint
npm run test:prediction-form
npm run test:transparency
npm run test:match-live-context
npm run test:participation
npm run test:admin
```

## Segurança e papéis

- O cadastro público sempre cria `Role.USER`.
- Rotas autenticadas validam JWT, estado da conta e `authVersion`.
- `/api/v1/admin` exige `Role.ADMIN` no backend.
- A aplicação não oferece promoção de usuário para administrador.
- Webhooks Asaas usam token dedicado; API key e token nunca vão para o frontend.
- DTOs rejeitam campos não declarados.
- Swagger fica desabilitado em produção.

## Escopo atual

- O jogo de palpites persistido está concentrado na temporada ativa da Premier League, embora a navegação pública cubra várias competições.
- A pontuação considera apenas placar; campos de MVP permanecem no schema sem fluxo funcional.
- `SyncLog` está modelado, mas não é preenchido pelos serviços atuais.
- O Admin é observacional para finanças: não marca pagamento como pago, não altera valor, não estorna e não ativa participação manualmente.
- Premiações, rateio, carteira, saque, odds e apostas não fazem parte do produto.

## Licença

Consulte [LICENSE](LICENSE).
