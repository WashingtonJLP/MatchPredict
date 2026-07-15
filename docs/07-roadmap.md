# Roadmap

## Objetivo

Este documento apresenta o planejamento evolutivo do MatchPredict.

O desenvolvimento será dividido em versões, permitindo a entrega incremental de funcionalidades e facilitando a evolução da plataforma.

---

# Versão 1.0 (MVP)

Objetivo: disponibilizar uma plataforma funcional de bolão da Premier League.

## Funcionalidades

### Usuários

- [ ] Cadastro
- [ ] Login
- [ ] Autenticação JWT
- [ ] Perfil do usuário

---

### Campeonato

- [ ] Premier League
- [ ] Temporada
- [ ] Sincronização automática das partidas
- [ ] Atualização automática dos resultados

---

### Palpites

- [ ] Registrar palpite
- [ ] Editar palpite antes do início da partida
- [ ] Escolher o MVP da partida
- [ ] Bloqueio automático após início do jogo

---

### Pontuação

- [ ] Acerto do vencedor
- [ ] Acerto do placar exato
- [ ] Acerto do MVP
- [ ] Cálculo automático da pontuação

---

### Ranking

- [ ] Classificação geral
- [ ] Ranking da temporada
- [ ] Atualização automática

---

### Administração

- [ ] Painel administrativo
- [ ] Sincronização manual da API
- [ ] Gerenciamento das temporadas
- [ ] Logs de sincronização

---

### Infraestrutura

- [ ] Deploy Front-end (Vercel)
- [ ] Deploy Back-end (Railway)
- [ ] PostgreSQL (Neon)
- [ ] Swagger
- [ ] Variáveis de ambiente

---

# Versão 1.1

Melhorias na experiência do usuário.

## Funcionalidades

- [ ] Avatar personalizado
- [ ] Histórico de palpites
- [ ] Estatísticas do usuário
- [ ] Melhor sequência de acertos
- [ ] Perfil público

---

# Versão 2.0

Expansão das competições.

## Funcionalidades

- [ ] Bundesliga
- [ ] La Liga
- [ ] Serie A
- [ ] Brasileirão
- [ ] Copa do Mundo
- [ ] Copa Libertadores

---

# Versão 2.5

Experiência social.

## Funcionalidades

- [ ] Ligas privadas
- [ ] Convites
- [ ] Compartilhamento do ranking
- [ ] Perfil dos participantes

---

# Versão 3.0

Recursos avançados.

## Funcionalidades

- [ ] Dashboard administrativo
- [ ] Estatísticas avançadas
- [ ] Histórico completo das temporadas
- [ ] Histórico de campeões
- [ ] Sistema de notificações
- [ ] Aplicativo Mobile

---

# Ideias Futuras

As funcionalidades abaixo fazem parte do planejamento de longo prazo e poderão ser implementadas conforme a evolução do projeto.

- [ ] Sistema de conquistas
- [ ] Medalhas por desempenho
- [ ] Ranking global
- [ ] Ranking por liga
- [ ] Comentários nas partidas
- [ ] Integração com Google OAuth
- [ ] Login com GitHub
- [ ] Login com Discord
- [ ] Modo escuro
- [ ] Internacionalização (i18n)

---

# Status do Projeto

| Documento | Status |
|------------|--------|
| Visão Geral | ✅ |
| Requisitos Funcionais | ✅ |
| Regras de Negócio | ✅ |
| Modelagem do Banco | ✅ |
| Endpoints | ✅ |
| Arquitetura | ✅ |
| Roadmap | ✅ |

---

# Próximos Passos

Com a documentação concluída, o desenvolvimento será iniciado na seguinte ordem:

1. Configuração do ambiente.
2. Criação da API utilizando NestJS.
3. Configuração do Prisma ORM.
4. Integração com PostgreSQL (Neon).
5. Implementação da autenticação.
6. Sincronização da API-Football.
7. Desenvolvimento do Front-end.
8. Deploy da aplicação.