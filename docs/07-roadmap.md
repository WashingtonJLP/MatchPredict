# Roadmap

Este documento separa o que já existe no código das evoluções ainda abertas. Ele não representa compromisso de prazo.

## Concluído

### Conta e autenticação

- [x] Cadastro público sempre como `USER`.
- [x] Login e proteção de rotas com JWT.
- [x] Política de senha forte.
- [x] Recuperação e redefinição de senha por e-mail.
- [x] Consulta e atualização do perfil.
- [x] Desativação de conta com revogação de sessões por `authVersion`.

### Jogos e competições

- [x] Modelagem e sincronização local de liga, temporada, times, jogadores, fixtures e resultados.
- [x] Fluxo local de palpites para a Premier League.
- [x] Jogos do dia por data em `America/Sao_Paulo`.
- [x] Catálogo público de competições nacionais e internacionais.
- [x] Consulta de temporada atual e classificação esportiva.
- [x] Visualização de grupos e mata-mata quando suportados pela competição.
- [x] Cache adaptativo e tolerância a falhas parciais nas consultas à ESPN.

### Palpites e transparência

- [x] Criação, edição e exclusão de palpite próprio.
- [x] Um palpite por usuário e fixture.
- [x] Bloqueio individual por kickoff e status.
- [x] Exigência de participação mensal ativa para criar e editar.
- [x] Página de palpites ativos e histórico.
- [x] Transparência com ocultação antes do fechamento.
- [x] Resultado final e pontos na experiência de transparência.

### Pontuação e classificação

- [x] Pontuação por placar exato, vencedor/empate e erro.
- [x] Processamento idempotente de fixtures encerradas.
- [x] Consolidação de standings por temporada.
- [x] Suporte a `adjustmentPoints` materializado em `totalPoints`.
- [x] Política única de ordenação do ranking.
- [x] Posição dinâmica no ranking público, posição pessoal e detalhe administrativo.
- [x] Estatísticas pessoais, incluindo média, acurácia e melhor/pior rodada.

### Rodadas

- [x] Área de rodadas com seleção de competição, temporada e rodada.
- [x] Ranking, destaques e desempenho individual por rodada sem ajustes administrativos.
- [x] Proteção de transparência nas estatísticas de rodadas futuras ou em andamento.

### Participação mensal e PIX

- [x] `ParticipationPeriod` por mês calendário em `America/Sao_Paulo`.
- [x] `Participation` como fonte da autorização para palpitar.
- [x] Valor mensal fixo armazenado em centavos.
- [x] Criação e retomada de QR PIX estático no Asaas.
- [x] Estados locais de pagamento e histórico de pagamentos confirmados.
- [x] Webhook autenticado para `PAYMENT_RECEIVED`.
- [x] Ativação transacional e idempotente da participação.
- [x] Consulta de status, `current-pix` e reconciliação pontual.
- [x] Cooldown, retry controlado e recuperação quando o webhook atrasa.

### Administração

- [x] Área administrativa protegida por `Role.ADMIN`.
- [x] Dashboard com indicadores do mês e atividade recente.
- [x] Listagem, busca, filtros e detalhe de usuários.
- [x] Classificação e desempenho corretos no detalhe do usuário.
- [x] Consulta de pagamentos e participações.
- [x] Fila observacional de pendências financeiras.
- [x] Auditoria por `AdminAuditLog`.
- [x] Desativação e reativação com preservação de histórico.
- [x] Confirmação explícita antes da desativação.
- [x] Análise de impacto e exclusão restrita de conta de teste elegível.
- [x] Navegação desktop e navegação mobile com atalhos e drawer acessível.

### Infraestrutura e qualidade

- [x] Frontend Next.js e backend NestJS em TypeScript.
- [x] PostgreSQL/Neon com Prisma e migrations versionadas.
- [x] Dockerfiles multi-stage e Docker Compose.
- [x] Cloudflare Tunnel previsto na composição de produção.
- [x] Swagger fora de produção.
- [x] Testes automatizados relevantes no backend e testes unitários direcionados no frontend.
- [x] Scheduler de resultados com gate ESPN/fingerprint para reduzir atividade no Neon.

## Parcialmente concluído

### Múltiplas competições

A experiência pública já permite navegar por várias competições, incluindo jogos, classificações e torneios. O jogo de palpites persistido, seu processamento e seu ranking continuam concentrados na Premier League. Expandir palpites para outras competições permanece uma evolução distinta.

### Temporadas

O banco e as integrações suportam temporadas, mas não há uma experiência completa de navegação histórica dos palpites, standings e campeões de temporadas anteriores.

### Jogadores e MVP

Jogadores são sincronizados e os campos de MVP permanecem no schema. Criação, edição e pontuação por MVP não fazem parte do fluxo funcional.

### Sincronizações operacionais

Há endpoints protegidos, scheduler e logs da aplicação. O modelo `SyncLog` ainda não é preenchido e o painel não possui controle visual de sincronizações nem uma tela dedicada às falhas esportivas.

### Estatísticas

As métricas principais estão implementadas. Comparações históricas, sequências e outras análises avançadas ainda não existem.

## Próximos passos

Estes itens já estavam alinhados à direção do projeto e continuam pertinentes:

1. decidir se os campos de MVP serão removidos em trabalho próprio ou transformados em funcionalidade completa;
2. implementar histórico navegável de temporadas e campeões;
3. persistir informações úteis de sincronização ou remover `SyncLog` em uma decisão de modelagem específica;
4. oferecer visibilidade operacional das sincronizações sem introduzir mutações financeiras no Admin;
5. melhorar a atualização visual de telas sensíveis ao kickoff;
6. ampliar testes de integração e fluxos end-to-end do frontend;
7. avaliar a expansão do jogo de palpites para outras competições já presentes no catálogo.

## Futuro

### Experiência do participante

- [ ] Perfil público de participantes.
- [ ] Upload de avatar personalizado.
- [ ] Compartilhamento de classificação.
- [ ] Sequências de acertos.
- [ ] Conquistas e medalhas.
- [ ] Notificações.

### Competições e histórico

- [ ] Histórico completo de temporadas anteriores.
- [ ] Histórico de campeões.
- [ ] Palpites e rankings para múltiplas competições.
- [ ] Inclusão de novas competições ainda ausentes do catálogo, quando houver demanda.

### Recursos sociais

- [ ] Ligas privadas.
- [ ] Convites por código.
- [ ] Classificação por liga privada.
- [ ] Comentários nas partidas.

### Autenticação e plataforma

- [ ] Login com provedores externos, como Google, GitHub ou Discord.
- [ ] Internacionalização.
- [ ] Aplicativo móvel nativo.

## Fora da direção atual

Não fazem parte do produto implementado nem deste roadmap:

- prêmio, premiação ou rateio;
- carteira ou saque;
- odds ou apostas;
- promoção de `USER` para `ADMIN` pela interface;
- edição manual, marcação como pago, estorno ou alteração de valor de pagamentos;
- ativação financeira manual de participação.

## Decisões já superadas

- O painel administrativo não é mais uma entrega futura: ele já cobre a operação atual, exceto o acompanhamento específico de sincronizações.
- A participação mensal e o pagamento PIX não são mais propostas: o fluxo com Asaas, webhook e reconciliação está implementado.
- A integração esportiva atual é ESPN, não API-Football.
- MVP obrigatório não corresponde ao contrato atual, que aceita somente placar.
- O repositório está orientado a containers e Cloudflare Tunnel; referências antigas a uma aplicação ainda não iniciada ou a uma topologia Vercel/Railway não representam o estado atual.
