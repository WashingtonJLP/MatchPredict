# MatchPredict Backend

Backend NestJS do MatchPredict.

## Instalação

```bash
npm install
```

## Configuração

Crie um arquivo `.env` na pasta `backend` usando `.env.example` como base.

Variáveis principais:

```env
PORT=3000
DATABASE_URL=
JWT_SECRET=
FRONTEND_URL=http://localhost:3001

EMAIL_PROVIDER=smtp
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=
SMTP_PASSWORD=
EMAIL_FROM=MatchPredict <matchpredict.app@gmail.com>
```

## Configurar Gmail SMTP

1. Crie uma conta Gmail exclusiva para o projeto.

Exemplo:

```text
matchpredict.app@gmail.com
```

2. Ative a autenticação em duas etapas na conta Google.

3. Gere uma Senha de App para o projeto.

4. Adicione as credenciais no `.env`:

```env
SMTP_USER=matchpredict.app@gmail.com
SMTP_PASSWORD=sua-senha-de-app
EMAIL_FROM=MatchPredict <matchpredict.app@gmail.com>
```

Nunca use a senha normal da conta Google em `SMTP_PASSWORD`. Use apenas a Senha de App.

## Executar

```bash
npm run start:dev
```

## Testes

```bash
npm test
```

## Build

```bash
npm run build
```
