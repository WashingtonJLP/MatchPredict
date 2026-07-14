# MatchPredict

## Visão Geral

MatchPredict é uma plataforma web de palpites esportivos desenvolvida para permitir que usuários participem de competições de futebol de forma simples, competitiva e automatizada.

Na primeira versão, a plataforma será focada exclusivamente na Premier League. Entretanto, toda a arquitetura será projetada para suportar novas competições futuramente, como La Liga, Bundesliga, Serie A, Brasileirão, Champions League e outras, sem necessidade de reestruturação do sistema.

Os usuários poderão criar uma conta, autenticar-se na plataforma e registrar seus palpites antes do início de cada partida. Cada palpite será composto pelo placar previsto e pela escolha obrigatória do MVP (Most Valuable Player) da partida. Após o encerramento dos jogos, o sistema calculará automaticamente a pontuação dos participantes utilizando os resultados e estatísticas oficiais fornecidos pela API-Football.

A plataforma será organizada por temporadas. Ao final de cada temporada, uma nova poderá ser iniciada, preservando o histórico das anteriores, seus campeões e estatísticas.

Os dados esportivos serão sincronizados automaticamente através da API-Football, enquanto todas as informações da aplicação, como usuários, palpites, temporadas, pontuação e rankings, serão armazenadas em um banco de dados PostgreSQL.

O projeto será desenvolvido seguindo boas práticas de arquitetura de software, com separação entre Front-end e Back-end, utilizando React, NestJS, Prisma ORM e PostgreSQL.

---

## Objetivos

- Desenvolver uma plataforma moderna de palpites esportivos.
- Automatizar a sincronização de dados esportivos através da API-Football.
- Permitir que usuários realizem palpites utilizando placar e MVP da partida.
- Calcular automaticamente a pontuação dos participantes.
- Gerar rankings por competição e temporada.
- Manter o histórico completo das temporadas.
- Desenvolver uma arquitetura escalável para inclusão de novas competições.
- Aplicar boas práticas de arquitetura, desenvolvimento e documentação como projeto de portfólio.

---

## Escopo da Primeira Versão

- Cadastro de usuários.
- Login e autenticação com JWT.
- Competição: Premier League.
- Sincronização automática das partidas.
- Registro de palpites.
- Escolha obrigatória do MVP da partida.
- Atualização automática dos resultados.
- Cálculo automático da pontuação.
- Ranking da temporada.
- Histórico das temporadas.
- Painel administrativo para gerenciamento da competição.

---

## Tecnologias

### Front-end

- React
- TypeScript
- Tailwind CSS
- React Router
- Axios

### Back-end

- NestJS
- TypeScript
- Prisma ORM
- JWT Authentication
- Class Validator
- Swagger

### Banco de Dados

- PostgreSQL
- Neon

### API Externa

- API-Football

---

## Arquitetura

A aplicação será dividida em duas camadas principais:

### Front-end

Responsável pela interface do usuário, autenticação, visualização das partidas, registro dos palpites e exibição dos rankings.

### Back-end

Responsável pelas regras de negócio, autenticação, sincronização da API-Football, gerenciamento das temporadas, cálculo da pontuação, administração da aplicação e comunicação com o banco de dados.

A API-Football será utilizada como fonte oficial dos dados esportivos, enquanto o PostgreSQL será responsável por armazenar todas as informações da aplicação.

---

## Futuras Implementações

- Suporte a múltiplas competições.
- Ligas privadas.
- Convites por código.
- Perfil completo dos jogadores.
- Estatísticas avançadas dos participantes.
- Dashboard administrativo.
- Histórico de campeões.
- Sistema de notificações.
- Aplicativo mobile.
