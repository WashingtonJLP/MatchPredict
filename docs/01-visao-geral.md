# MatchPredict

## Visao geral

MatchPredict e uma plataforma full-stack de palpites de futebol. O sistema permite que usuarios criem uma conta, autentiquem-se, acompanhem partidas sincronizadas, registrem palpites de placar antes do inicio dos jogos e acompanhem pontuacao, ranking, estatisticas e transparencia dos palpites.

A versao atual esta focada na Premier League e utiliza dados esportivos obtidos por integracao com APIs da ESPN. A modelagem ja contempla ligas, temporadas, times, partidas, jogadores, palpites e standings, mas a experiencia publica atual e concentrada na temporada ativa.

O projeto foi construido como aplicacao de portfolio com separacao clara entre frontend, backend e banco de dados. O frontend consome a API do backend, o backend concentra autenticacao, regras de negocio, sincronizacao, processamento de resultados e persistencia, e o PostgreSQL armazena os dados da aplicacao.

## Objetivos do projeto

- Oferecer uma experiencia simples para palpites de futebol por placar.
- Bloquear criacao, edicao e exclusao de palpites quando a partida inicia ou entra em estado nao editavel.
- Automatizar sincronizacao de partidas, resultados e processamento de pontuacao.
- Exibir ranking e estatisticas da temporada ativa.
- Dar transparencia aos palpites de cada partida depois do inicio do jogo.
- Manter uma arquitetura compreensivel e demonstravel como projeto full-stack.

## Funcionalidades implementadas

- Cadastro e login de usuarios com JWT.
- Recuperacao e redefinicao de senha por e-mail.
- Perfil do usuario autenticado.
- Listagem de partidas com filtros e paginacao.
- Registro, edicao e exclusao de palpites antes do bloqueio.
- Pagina "Meus Palpites" mostrando apenas palpites ja feitos pelo usuario, separados entre ativos e historico.
- Transparencia de palpites por partida.
- Sincronizacao administrativa de liga, times, partidas, jogadores e resultados a partir da ESPN.
- Scheduler para atualizacao periodica de resultados e processamento de fixtures finalizadas.
- Calculo de pontuacao por placar.
- Ranking geral e ranking do usuario autenticado.
- Estatisticas do usuario.
- Documentacao de API via Swagger em ambiente de desenvolvimento.

## Escopo atual

O escopo funcional atual cobre a jornada principal do usuario:

1. criar conta ou entrar;
2. consultar partidas;
3. registrar palpites antes do kickoff;
4. acompanhar palpites ativos e historico;
5. consultar transparencia, ranking e estatisticas.

As funcionalidades administrativas existem principalmente como endpoints protegidos para sincronizacao e processamento. Nao ha, nesta versao, um painel administrativo completo no frontend.

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

O frontend Next.js entrega a interface publica e autenticada. Ele usa services HTTP e hooks de dados para consumir a API REST do backend.

O backend NestJS expoe os modulos de autenticacao, usuarios, futebol, palpites e standings. Ele aplica as regras de negocio, valida entradas por DTOs, protege rotas autenticadas com JWT e restringe rotas administrativas a usuarios `ADMIN`.

O Prisma centraliza o acesso ao PostgreSQL. A integracao com a ESPN alimenta liga, times, jogadores, partidas e resultados. O processamento de resultados calcula pontuacao e atualiza standings da temporada ativa.

## Regras centrais

- Um usuario so pode criar, editar ou excluir palpite proprio antes do kickoff e enquanto a partida nao estiver `LIVE` nem `FT`.
- Cada usuario pode ter apenas um palpite por partida.
- A pontuacao atual e baseada no placar: 3 pontos para placar exato, 1 ponto para acerto de vencedor ou empate, 0 para erro.
- Palpites de outros usuarios ficam ocultos antes do inicio da partida e sao liberados pela regra de transparencia depois do kickoff ou quando a partida esta ao vivo.

## Limitacoes conhecidas

- A modelagem possui campos e relacoes para MVP, mas o fluxo funcional atual de palpite e pontuacao por MVP nao esta implementado.
- A modelagem suporta mais de uma liga e temporada, mas o produto atual trabalha com a temporada ativa como foco principal.
- O frontend nao possui painel administrativo completo.
- O model `SyncLog` existe no schema, mas ainda nao e usado de forma efetiva para registrar sincronizacoes.
- Historico completo de temporadas anteriores, ligas privadas, convites, notificacoes, OAuth, aplicativo mobile e internacionalizacao permanecem como evolucoes futuras.
