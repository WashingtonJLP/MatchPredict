# Roadmap

Este documento apresenta o estado atual do MatchPredict e a direção de evolução do projeto. A classificação abaixo considera o que está implementado no código atual.

## Status geral

O MatchPredict já possui um fluxo funcional completo para usuários autenticados criarem palpites de placar, acompanharem partidas, consultarem seus palpites, verem ranking, estatísticas e transparência. A integração esportiva atual usa APIs da ESPN, e o deploy está orientado a Docker, TrueNAS e Cloudflare Tunnel.

## Concluído

### Usuários e autenticação

- [x] Cadastro de usuário.
- [x] Login com JWT.
- [x] Proteção de rotas autenticadas.
- [x] Recuperação de senha por e-mail.
- [x] Redefinição de senha com token temporário.
- [x] Perfil do usuário autenticado.
- [x] Atualização de dados do perfil.
- [x] Política de senha forte.

### Partidas e dados esportivos

- [x] Modelagem de liga, temporada, times, jogadores e partidas.
- [x] Foco inicial na Premier League.
- [x] Sincronização administrativa de liga.
- [x] Sincronização administrativa de times.
- [x] Sincronização administrativa de partidas.
- [x] Sincronização administrativa de jogadores.
- [x] Sincronização administrativa de resultados.
- [x] Listagem autenticada de partidas.
- [x] Filtros por status, rodada, time e intervalo de datas.
- [x] Paginação da listagem de partidas.
- [x] Status de fixtures e placar final quando disponível.

### Palpites

- [x] Criação de palpite por placar.
- [x] Edição de palpite próprio antes do bloqueio.
- [x] Exclusão de palpite próprio antes do bloqueio.
- [x] Um palpite por usuário por partida.
- [x] Bloqueio por kickoff.
- [x] Bloqueio por status `LIVE`.
- [x] Bloqueio por status `FT`.
- [x] Página "Meus Palpites" exibindo apenas palpites já feitos pelo usuário.
- [x] Separação visual entre palpites ativos e histórico.
- [x] Filtro de histórico por rodada no frontend.

### Transparência

- [x] Consulta de palpites por partida.
- [x] Ocultação de palpites de outros usuários antes do kickoff.
- [x] Liberação de palpites após kickoff ou durante partida ao vivo.
- [x] Exibição de resultado final quando a partida está encerrada.

### Pontuação e ranking

- [x] Cálculo de placar exato.
- [x] Cálculo de acerto de vencedor ou empate.
- [x] Cálculo de erro do resultado.
- [x] Processamento de fixtures encerradas.
- [x] Marcação de fixture processada com `processedAt`.
- [x] Atualização de standings.
- [x] Ranking geral da temporada ativa.
- [x] Ranking do usuário autenticado.
- [x] Critérios de desempate por pontos, placares exatos, vencedores corretos, erros e data de criação.

### Estatísticas

- [x] Estatísticas do usuário autenticado.
- [x] Total de palpites.
- [x] Pontos totais.
- [x] Média de pontos.
- [x] Acertos de vencedor.
- [x] Placares exatos.
- [x] Posição atual.
- [x] Melhor e pior rodada com base em palpites processados.

### Infraestrutura e desenvolvimento

- [x] Frontend Next.js.
- [x] Backend NestJS.
- [x] Prisma ORM.
- [x] PostgreSQL.
- [x] Neon como banco hospedado.
- [x] Swagger em ambiente de desenvolvimento.
- [x] Variáveis de ambiente.
- [x] Dockerfiles para frontend e backend.
- [x] Docker Compose com frontend, backend e Cloudflare Tunnel.
- [x] Deploy orientado a TrueNAS e Cloudflare Tunnel.
- [x] Testes automatizados no backend.
- [x] Lint e build configurados no frontend.

## Parcialmente concluído

- [ ] Administração: existem endpoints administrativos no backend, mas ainda não há painel administrativo completo no frontend.
- [ ] Temporadas: a modelagem suporta temporadas e temporada ativa, mas ainda não há experiência completa para navegação histórica de temporadas.
- [ ] Jogadores: a sincronização e a modelagem existem, mas jogadores ainda não compõem um fluxo de palpite funcional.
- [ ] MVP: a modelagem possui campos de MVP, mas criação, edição e pontuação por MVP não estão implementadas no fluxo atual.
- [ ] Logs de sincronização: o model `SyncLog` existe, mas ainda não é usado de forma efetiva pelos serviços.
- [ ] Estatísticas avançadas: existem estatísticas do usuário, mas ainda há espaço para métricas mais detalhadas, comparações e histórico.

## Pendente

### Administração

- [ ] Painel administrativo no frontend.
- [ ] Controle visual de sincronizações.
- [ ] Visualização de falhas de sincronização.
- [ ] CRUD administrativo de ligas, temporadas, times e partidas, se necessário.
- [ ] Uso efetivo de `SyncLog`.

### Experiência do usuário

- [ ] Perfil público de participantes.
- [ ] Avatar personalizado.
- [ ] Compartilhamento de ranking.
- [ ] Melhor sequência de acertos.
- [ ] Conquistas e medalhas.
- [ ] Notificacoes.

### Competições e temporadas

- [ ] Histórico completo de temporadas anteriores.
- [ ] Histórico de campeões.
- [ ] Suporte de produto para múltiplas competições.
- [ ] Bundesliga.
- [ ] La Liga.
- [ ] Serie A.
- [ ] Brasileirão.
- [ ] Copa do Mundo.
- [ ] Copa Libertadores.

### Social

- [ ] Ligas privadas.
- [ ] Convites por código.
- [ ] Ranking por liga.
- [ ] Comentários nas partidas.

### Autenticação e plataforma

- [ ] Login com Google.
- [ ] Login com GitHub.
- [ ] Login com Discord.
- [ ] Internacionalização.
- [ ] Aplicativo mobile.

## Itens que não fazem mais sentido como descritos originalmente

- Deploy em Vercel e Railway não representa a topologia atual documentada, que usa Docker, TrueNAS e Cloudflare Tunnel.
- API-Football não representa a integração atual; o código usa APIs da ESPN.
- MVP obrigatório no palpite não representa o contrato atual, que aceita apenas placar.
- "Desenvolvimento será iniciado" não representa mais o estado do projeto, pois a aplicação já possui frontend, backend, banco, autenticação e fluxos principais implementados.

## Próximos passos recomendados

1. Criar painel administrativo mínimo para acompanhar sincronizações e executar rotinas com mais segurança operacional.
2. Persistir logs reais no model `SyncLog`.
3. Melhorar a atualização visual de páginas sensíveis a horário, como "Meus Palpites", no momento do kickoff.
4. Definir se MVP será removido do modelo ou implementado como funcionalidade real.
5. Evoluir histórico de temporadas antes de adicionar múltiplas competições.
6. Ampliar testes de integração e fluxos end-to-end do frontend.
