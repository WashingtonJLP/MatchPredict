# MatchPredict

MatchPredict é uma plataforma full-stack de palpites de futebol focada na Premier League. Usuários autenticados acompanham partidas sincronizadas, registram palpites de placar antes do kickoff e acompanham ranking, estatísticas, transparência e histórico dos seus palpites.

![MatchPredict](docs/images/MatchPredict.png)

## Destaques

- Cadastro, login JWT e recuperação de senha por e-mail.
- Listagem de partidas com filtros, paginação, status, rodada, times e placar quando disponível.
- Criação, edição e exclusão de palpites antes do bloqueio por kickoff/status.
- Página "Meus Palpites" exibindo exclusivamente palpites já feitos pelo usuário, separados entre ativos e histórico por rodada.
- Transparência de palpites por partida, respeitando ocultação antes do kickoff.
- Pontuação automática: 3 pontos por placar exato, 1 por vencedor/empate correto e 0 por erro.
- Ranking geral, ranking do usuário autenticado e estatísticas individuais.
- Sincronização administrativa de liga, times, jogadores, partidas e resultados via ESPN.
- Scheduler backend para atualizar resultados e processar fixtures encerradas.
- Deploy com Docker Compose, backend, frontend e Cloudflare Tunnel.

## Stack

### Frontend

- Next.js 15
- React 19
- TypeScript
- Tailwind CSS
- TanStack Query
- Axios
- React Hook Form
- Zod
- Lucide React
- Sonner

### Backend

- NestJS 11
- TypeScript
- Prisma ORM
- PostgreSQL
- JWT com Passport
- Class Validator e Class Transformer
- Swagger
- NestJS Schedule
- NestJS Throttler
- Nodemailer

### Infraestrutura

- PostgreSQL/Neon
- Docker
- Docker Compose
- TrueNAS
- Cloudflare Tunnel
- ESPN APIs como fonte de dados esportivos

## Arquitetura

```text
Usuario
  -> Frontend Next.js
  -> API NestJS (/api/v1)
  -> Prisma ORM
  -> PostgreSQL

API NestJS
  -> ESPN APIs para dados esportivos
  -> SMTP para recuperação de senha
  -> Scheduler para resultados e processamento de pontuação
```

O frontend é separado do backend e consome a API REST por services HTTP. O backend concentra autenticação, validação, regras de negócio, sincronização esportiva, processamento de resultados e persistência.

## Principais módulos

- `Auth`: cadastro, login, recuperação e redefinição de senha.
- `Users`: perfil e estatísticas do usuário autenticado.
- `Football`: listagem e sincronização de dados esportivos.
- `Predictions`: criação, edição, exclusão, transparência e processamento de palpites.
- `Standings`: ranking geral e posição do usuário.
- `Email`: envio SMTP de recuperação de senha.
- `Prisma`: acesso ao banco PostgreSQL.

## Documentação

- [Visão geral](docs/01-visao-geral.md)
- [Requisitos funcionais](docs/02-requisitos-funcionais.md)
- [Regras de negócio](docs/03-regras-de-negocio.md)
- [Modelagem do banco](docs/04-modelagem-do-banco.md)
- [Endpoints da API](docs/05-endpoints.md)
- [Arquitetura](docs/06-arquitetura.md)
- [Roadmap](docs/07-roadmap.md)

## Execução local

### Pré-requisitos

- Node.js 20+
- npm
- PostgreSQL acessível localmente ou via Neon

### Backend

```bash
cd backend
npm install
cp .env.example .env
npx prisma generate
npm run start:dev
```

Configure `backend/.env` com valores reais no ambiente local. Não versione secrets.

Variáveis principais:

```env
PORT=3000
DATABASE_URL=<postgresql-url>
JWT_SECRET=<jwt-secret>
FRONTEND_URL=http://localhost:3001
EMAIL_PROVIDER=smtp
SMTP_HOST=<smtp-host>
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=<smtp-user>
SMTP_PASSWORD=<smtp-password>
EMAIL_FROM="MatchPredict <no-reply@example.com>"
ESPN_API_URL=https://site.api.espn.com/apis/site/v2
ESPN_CORE_API_URL=https://sports.core.api.espn.com/v2
ESPN_LEAGUE=eng.1
ESPN_COUNTRY=England
ESPN_LEAGUE_LOGO=<league-logo-url>
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Variável pública usada pelo frontend:

```env
NEXT_PUBLIC_API_URL=http://localhost:3000/api/v1
```

## Docker

O repositório possui `compose.yaml` com três serviços principais:

- `backend`: API NestJS exposta localmente em `127.0.0.1:3001` no host.
- `frontend`: aplicação Next.js exposta em `3002` no host.
- `cloudflared`: túnel Cloudflare usando configuração local em `./cloudflared`.

Exemplo de execução:

```bash
docker compose up --build
```

Antes de usar Docker, configure os arquivos de ambiente locais esperados pelo compose e mantenha secrets fora do Git.

## Scripts úteis

Backend:

```bash
cd backend
npm run lint
npm run build
npm test
npm run test:e2e
```

Frontend:

```bash
cd frontend
npm run lint
npm run build
```

## Segurança

- JWT é usado para proteger rotas autenticadas.
- Rotas administrativas exigem usuário com papel `ADMIN`.
- DTOs usam validação com whitelist e bloqueio de campos não permitidos.
- Recuperação de senha armazena apenas hash do token.
- Exemplos de ambiente neste README usam placeholders e não devem conter credenciais reais.
- Arquivos `.env` locais devem permanecer fora dos commits.

## Estado atual e limitações

- A pontuação atual considera apenas placar previsto.
- MVP existe na modelagem, mas não está implementado no fluxo funcional de palpite ou pontuação.
- A modelagem suporta ligas e temporadas, mas a experiência atual é focada na temporada ativa da Premier League.
- Existem endpoints administrativos no backend, mas ainda não há painel administrativo completo no frontend.
- `SyncLog` existe no schema, mas ainda não é usado para registrar sincronizações reais.

## Licença

Projeto de portfólio. Defina uma licença formal antes de distribuir ou reutilizar em outro contexto.
