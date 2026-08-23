# MatchPredict

## Visão geral

MatchPredict é uma plataforma full-stack de palpites de futebol. O sistema permite que usuários criem uma conta, autentiquem-se, acompanhem partidas sincronizadas, registrem palpites de placar antes do início dos jogos e acompanhem pontuação, ranking, estatísticas e transparência dos palpites.

A versão atual está focada na Premier League e utiliza dados esportivos obtidos por integração com APIs da ESPN. A modelagem já contempla ligas, temporadas, times, partidas, jogadores, palpites e standings, mas a experiência pública atual é concentrada na temporada ativa.

O projeto foi construído como aplicação de portfólio com separação clara entre frontend, backend e banco de dados. O frontend consome a API do backend, o backend concentra autenticação, regras de negócio, sincronização, processamento de resultados e persistência, e o PostgreSQL armazena os dados da aplicação.

## Objetivos do projeto

- Oferecer uma experiência simples para palpites de futebol por placar.
- Bloquear criação, edição e exclusão de palpites quando a partida inicia ou entra em estado não editável.
- Automatizar sincronização de partidas, resultados e processamento de pontuação.
- Exibir ranking e estatísticas da temporada ativa.
- Dar transparência aos palpites de cada partida depois do início do jogo.
- Manter uma arquitetura compreensível e demonstrável como projeto full-stack.

## Funcionalidades implementadas

- Cadastro e login de usuários com JWT.
- Recuperação e redefinição de senha por e-mail.
- Perfil do usuário autenticado.
- Listagem de partidas com filtros e paginação.
- Registro, edição e exclusão de palpites antes do bloqueio.
- Página "Meus Palpites" mostrando apenas palpites já feitos pelo usuário, separados entre ativos e histórico.
- Transparência de palpites por partida.
- Sincronização administrativa de liga, times, partidas, jogadores e resultados a partir da ESPN.
- Scheduler para atualização periódica de resultados e processamento de fixtures finalizadas.
- Cálculo de pontuação por placar.
- Ranking geral e ranking do usuário autenticado.
- Estatísticas do usuário.
- Documentação de API via Swagger em ambiente de desenvolvimento.

## Escopo atual

O escopo funcional atual cobre a jornada principal do usuário:

1. criar conta ou entrar;
2. consultar partidas;
3. registrar palpites antes do kickoff;
4. acompanhar palpites ativos e histórico;
5. consultar transparência, ranking e estatísticas.

As funcionalidades administrativas existem principalmente como endpoints protegidos para sincronização e processamento. Não há, nesta versão, um painel administrativo completo no frontend.

## Tecnologias

### Frontend

- Next.js
- React
- TypeScript
- Tailwind CSS
- TanStack Query
- Axios
- React Hook Form
- Zod
- Lucide React
- Sonner

### Backend

- NestJS
- TypeScript
- Prisma ORM
- JWT com Passport
- Class Validator e Class Transformer
- Swagger
- NestJS Schedule
- NestJS Throttler
- Nodemailer

### Banco de dados

- PostgreSQL
- Neon em ambiente hospedado

### Dados esportivos

- APIs da ESPN

### Deploy e infraestrutura

- Docker
- Docker Compose
- TrueNAS
- Cloudflare Tunnel

## Arquitetura resumida

O frontend Next.js entrega a interface pública e autenticada. Ele usa services HTTP e hooks de dados para consumir a API REST do backend.

O backend NestJS expõe os módulos de autenticação, usuários, futebol, palpites e standings. Ele aplica as regras de negócio, valida entradas por DTOs, protege rotas autenticadas com JWT e restringe rotas administrativas a usuários `ADMIN`.

O Prisma centraliza o acesso ao PostgreSQL. A integração com a ESPN alimenta liga, times, jogadores, partidas e resultados. O processamento de resultados calcula pontuação e atualiza standings da temporada ativa.

## Regras centrais

- Um usuário só pode criar, editar ou excluir palpite próprio antes do kickoff e enquanto a partida não estiver `LIVE` nem `FT`.
- Cada usuário pode ter apenas um palpite por partida.
- A pontuação atual é baseada no placar: 3 pontos para placar exato, 1 ponto para acerto de vencedor ou empate, 0 para erro.
- Palpites de outros usuários ficam ocultos antes do início da partida e são liberados pela regra de transparência depois do kickoff ou quando a partida está ao vivo.

## Limitações conhecidas

- A modelagem possui campos e relações para MVP, mas o fluxo funcional atual de palpite e pontuação por MVP não está implementado.
- A modelagem suporta mais de uma liga e temporada, mas o produto atual trabalha com a temporada ativa como foco principal.
- O frontend não possui painel administrativo completo.
- O model `SyncLog` existe no schema, mas ainda não é usado de forma efetiva para registrar sincronizações.
- Histórico completo de temporadas anteriores, ligas privadas, convites, notificações, OAuth, aplicativo mobile e internacionalização permanecem como evoluções futuras.
