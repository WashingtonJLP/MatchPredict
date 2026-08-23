# Roadmap

Este documento apresenta o estado atual do MatchPredict e a direcao de evolucao do projeto. A classificacao abaixo considera o que esta implementado no codigo atual.

## Status geral

O MatchPredict ja possui um fluxo funcional completo para usuarios autenticados criarem palpites de placar, acompanharem partidas, consultarem seus palpites, verem ranking, estatisticas e transparencia. A integracao esportiva atual usa APIs da ESPN, e o deploy esta orientado a Docker, TrueNAS e Cloudflare Tunnel.

## Concluido

### Usuarios e autenticacao

- [x] Cadastro de usuario.
- [x] Login com JWT.
- [x] Protecao de rotas autenticadas.
- [x] Recuperacao de senha por e-mail.
- [x] Redefinicao de senha com token temporario.
- [x] Perfil do usuario autenticado.
- [x] Atualizacao de dados do perfil.
- [x] Politica de senha forte.

### Partidas e dados esportivos

- [x] Modelagem de liga, temporada, times, jogadores e partidas.
- [x] Foco inicial na Premier League.
- [x] Sincronizacao administrativa de liga.
- [x] Sincronizacao administrativa de times.
- [x] Sincronizacao administrativa de partidas.
- [x] Sincronizacao administrativa de jogadores.
- [x] Sincronizacao administrativa de resultados.
- [x] Listagem autenticada de partidas.
- [x] Filtros por status, rodada, time e intervalo de datas.
- [x] Paginacao da listagem de partidas.
- [x] Status de fixtures e placar final quando disponivel.

### Palpites

- [x] Criacao de palpite por placar.
- [x] Edicao de palpite proprio antes do bloqueio.
- [x] Exclusao de palpite proprio antes do bloqueio.
- [x] Um palpite por usuario por partida.
- [x] Bloqueio por kickoff.
- [x] Bloqueio por status `LIVE`.
- [x] Bloqueio por status `FT`.
- [x] Pagina "Meus Palpites" exibindo apenas palpites ja feitos pelo usuario.
- [x] Separacao visual entre palpites ativos e historico.
- [x] Filtro de historico por rodada no frontend.

### Transparencia

- [x] Consulta de palpites por partida.
- [x] Ocultacao de palpites de outros usuarios antes do kickoff.
- [x] Liberacao de palpites apos kickoff ou durante partida ao vivo.
- [x] Exibicao de resultado final quando a partida esta encerrada.

### Pontuacao e ranking

- [x] Calculo de placar exato.
- [x] Calculo de acerto de vencedor ou empate.
- [x] Calculo de erro do resultado.
- [x] Processamento de fixtures encerradas.
- [x] Marcacao de fixture processada com `processedAt`.
- [x] Atualizacao de standings.
- [x] Ranking geral da temporada ativa.
- [x] Ranking do usuario autenticado.
- [x] Criterios de desempate por pontos, placares exatos, vencedores corretos, erros e data de criacao.

### Estatisticas

- [x] Estatisticas do usuario autenticado.
- [x] Total de palpites.
- [x] Pontos totais.
- [x] Media de pontos.
- [x] Acertos de vencedor.
- [x] Placares exatos.
- [x] Posicao atual.
- [x] Melhor e pior rodada com base em palpites processados.

### Infraestrutura e desenvolvimento

- [x] Frontend Next.js.
- [x] Backend NestJS.
- [x] Prisma ORM.
- [x] PostgreSQL.
- [x] Neon como banco hospedado.
- [x] Swagger em ambiente de desenvolvimento.
- [x] Variaveis de ambiente.
- [x] Dockerfiles para frontend e backend.
- [x] Docker Compose com frontend, backend e Cloudflare Tunnel.
- [x] Deploy orientado a TrueNAS e Cloudflare Tunnel.
- [x] Testes automatizados no backend.
- [x] Lint e build configurados no frontend.

## Parcialmente concluido

- [ ] Administracao: existem endpoints administrativos no backend, mas ainda nao ha painel administrativo completo no frontend.
- [ ] Temporadas: a modelagem suporta temporadas e temporada ativa, mas ainda nao ha experiencia completa para navegacao historica de temporadas.
- [ ] Jogadores: a sincronizacao e a modelagem existem, mas jogadores ainda nao compoem um fluxo de palpite funcional.
- [ ] MVP: a modelagem possui campos de MVP, mas criacao, edicao e pontuacao por MVP nao estao implementadas no fluxo atual.
- [ ] Logs de sincronizacao: o model `SyncLog` existe, mas ainda nao e usado de forma efetiva pelos servicos.
- [ ] Estatisticas avancadas: existem estatisticas do usuario, mas ainda ha espaco para metricas mais detalhadas, comparacoes e historico.

## Pendente

### Administracao

- [ ] Painel administrativo no frontend.
- [ ] Controle visual de sincronizacoes.
- [ ] Visualizacao de falhas de sincronizacao.
- [ ] CRUD administrativo de ligas, temporadas, times e partidas, se necessario.
- [ ] Uso efetivo de `SyncLog`.

### Experiencia do usuario

- [ ] Perfil publico de participantes.
- [ ] Avatar personalizado.
- [ ] Compartilhamento de ranking.
- [ ] Melhor sequencia de acertos.
- [ ] Conquistas e medalhas.
- [ ] Notificacoes.

### Competicoes e temporadas

- [ ] Historico completo de temporadas anteriores.
- [ ] Historico de campeoes.
- [ ] Suporte de produto para multiplas competicoes.
- [ ] Bundesliga.
- [ ] La Liga.
- [ ] Serie A.
- [ ] Brasileirao.
- [ ] Copa do Mundo.
- [ ] Copa Libertadores.

### Social

- [ ] Ligas privadas.
- [ ] Convites por codigo.
- [ ] Ranking por liga.
- [ ] Comentarios nas partidas.

### Autenticacao e plataforma

- [ ] Login com Google.
- [ ] Login com GitHub.
- [ ] Login com Discord.
- [ ] Internacionalizacao.
- [ ] Aplicativo mobile.

## Itens que nao fazem mais sentido como descritos originalmente

- Deploy em Vercel e Railway nao representa a topologia atual documentada, que usa Docker, TrueNAS e Cloudflare Tunnel.
- API-Football nao representa a integracao atual; o codigo usa APIs da ESPN.
- MVP obrigatorio no palpite nao representa o contrato atual, que aceita apenas placar.
- "Desenvolvimento sera iniciado" nao representa mais o estado do projeto, pois a aplicacao ja possui frontend, backend, banco, autenticacao e fluxos principais implementados.

## Proximos passos recomendados

1. Criar painel administrativo minimo para acompanhar sincronizacoes e executar rotinas com mais seguranca operacional.
2. Persistir logs reais no model `SyncLog`.
3. Melhorar a atualizacao visual de paginas sensiveis a horario, como "Meus Palpites", no momento do kickoff.
4. Definir se MVP sera removido do modelo ou implementado como funcionalidade real.
5. Evoluir historico de temporadas antes de adicionar multiplas competicoes.
6. Ampliar testes de integracao e fluxos end-to-end do frontend.
