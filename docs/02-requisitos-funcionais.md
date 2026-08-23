# Requisitos Funcionais

Este documento descreve os requisitos funcionais implementados atualmente no MatchPredict. O código do backend e do frontend é a fonte de verdade para esta versão da documentação.

## RF01 - Cadastro de usuário

O sistema deve permitir que um visitante crie uma conta informando nome, e-mail e senha.

- O e-mail deve ter formato válido e ser único.
- A senha deve ter entre 8 e 72 caracteres, com ao menos uma letra maiúscula, uma letra minúscula e um número.
- A senha deve ser armazenada de forma criptografada.
- A resposta de cadastro não deve retornar senha nem campos de recuperação de senha.
- Novos usuários são criados com papel `USER`.

## RF02 - Login

O sistema deve permitir login com e-mail e senha.

- O e-mail deve ser normalizado antes da autenticação.
- Credenciais inválidas devem ser recusadas.
- Em caso de sucesso, a API retorna um token JWT.
- As rotas autenticadas devem usar `Authorization: Bearer <token>`.

## RF03 - Recuperação de senha

O sistema deve permitir que um usuário solicite recuperação de senha por e-mail.

- A solicitação recebe um e-mail e retorna uma mensagem genérica, exista ou não usuário com aquele e-mail.
- Quando o usuário existe, o backend gera um token, armazena apenas o hash do token e define prazo de expiração.
- O link de recuperação e enviado por SMTP.
- A redefinição exige token, nova senha e confirmacao da senha.
- Token inexistente, expirado ou ja consumido deve ser recusado.
- Após redefinir a senha, o token e a expiração são removidos.

## RF04 - Perfil do usuário

O sistema deve permitir que o usuário autenticado consulte e atualize seu próprio perfil.

- A consulta retorna os dados públicos do usuário autenticado.
- A atualização permite alterar nome e, quando aplicável, senha.
- Para troca de senha pelo perfil, a senha atual deve ser validada.
- A nova senha deve seguir a mesma política de segurança do cadastro.

## RF05 - Visualizacao de partidas

O sistema deve permitir que usuários autenticados visualizem partidas sincronizadas.

- A listagem de partidas suporta filtros por status, rodada, time e intervalo de datas.
- A listagem suporta paginação por `page` e `limit`.
- As partidas são ordenadas por kickoff em ordem crescente.
- Cada partida inclui dados dos times mandante e visitante, campeonato, temporada, rodada, status, kickoff, placar quando disponível e indicador se ainda aceita palpite.

## RF06 - Criação de palpites

O sistema deve permitir que o usuário autenticado registre um palpite para uma partida.

- O palpite contém partida, gols do mandante e gols do visitante.
- Os gols devem ser números inteiros não negativos.
- Cada usuário pode ter apenas um palpite por partida.
- O usuário só pode criar palpite antes do kickoff e enquanto a partida não estiver `LIVE` nem `FT`.
- Não há campo funcional de MVP no contrato atual de criação de palpite.

## RF07 - Edição de palpites

O sistema deve permitir que o usuário autenticado edite um palpite próprio.

- Somente o dono do palpite pode edita-lo.
- A edição segue a mesma regra de bloqueio da criação: kickoff futuro e status diferente de `LIVE` e `FT`.
- A edição permite alterar apenas o placar previsto.
- Palpites de partidas iniciadas, ao vivo ou encerradas não podem ser editados.

## RF08 - Exclusão de palpites

O sistema deve permitir que o usuário autenticado exclua um palpite próprio.

- Somente o dono do palpite pode exclui-lo.
- A exclusão segue a mesma regra de bloqueio da criação e edição.
- Palpites de partidas iniciadas, ao vivo ou encerradas não podem ser excluidos.

## RF09 - Meus Palpites

O sistema deve permitir que o usuário autenticado consulte exclusivamente os palpites que ele ja registrou.

- A página "Meus Palpites" usa a rota `GET /api/v1/predictions/my`.
- A API retorna apenas palpites do usuário autenticado.
- A página não deve buscar nem exibir partidas sem palpite do usuário.
- No frontend atual, os palpites são organizados em "Seus palpites ativos" e "Histórico de palpites".
- Palpites ativos são aqueles que ainda podem ser alterados pela regra atual.
- O histórico contém os palpites que não podem mais ser alterados e pode ser filtrado por rodada no frontend.

## RF10 - Transparência de palpites

O sistema deve permitir consultar palpites associados a uma partida respeitando a regra de transparência.

- Antes do kickoff, um usuário autenticado deve ver apenas o próprio palpite naquela partida.
- Antes do kickoff, se o usuário não fez palpite, a resposta deve ocultar palpites de outros usuários.
- Após o kickoff ou quando a partida estiver `LIVE`, os palpites da partida podem ser exibidos.
- Para partidas encerradas, o retorno pode incluir resultado final e pontuação calculada quando disponível.

## RF11 - Resultados das partidas

O sistema deve armazenar e exibir resultados sincronizados das partidas.

- Partidas encerradas possuem status `FT` e placar final quando a fonte de dados fornece o resultado.
- O frontend pode mostrar resultado final em cards de palpites e transparência quando a partida está encerrada e há placar disponível.
- O processamento de resultados depende de fixtures encerradas com placar final.

## RF12 - Cálculo de pontuação

O sistema deve calcular pontuação dos palpites de partidas finalizadas.

- Placar exato vale 3 pontos.
- Acerto do vencedor ou empate sem placar exato vale 1 ponto.
- Erro do resultado vale 0 ponto.
- Palpites sem partida encerrada ou sem placar final não recebem pontuação.
- A pontuação atual é baseada apenas no placar previsto; não há pontuação funcional por MVP.

## RF13 - Processamento de resultados e ranking

O sistema deve processar partidas encerradas e atualizar os rankings.

- O processamento considera partidas com status `FT` e ainda não processadas.
- Cada palpite da partida recebe pontuação de placar, total, indicador de placar exato e indicador de vencedor correto.
- A fixture processada recebe `processedAt`.
- Os standings dos usuários são recalculados com base nos palpites processados da temporada ativa.
- O processamento deve ser idempotente para evitar reprocessar fixtures já marcadas como processadas.

## RF14 - Ranking geral

O sistema deve disponibilizar ranking da temporada ativa.

- O ranking geral é público.
- A ordenação considera total de pontos, placares exatos, vencedores corretos, palpites errados e data de criação do standing.
- A resposta inclui posição, usuário e estatísticas acumuladas.

## RF15 - Ranking do usuário autenticado

O sistema deve permitir que o usuário autenticado consulte sua própria posição no ranking.

- A consulta retorna os dados do standing do usuário na temporada ativa.
- Quando o usuário ainda não possui standing, a resposta representa pontuação zerada conforme a regra do backend.

## RF16 - Estatísticas do usuário

O sistema deve permitir que o usuário autenticado consulte suas estatísticas.

- As estatísticas incluem pontos, quantidade de palpites, placares exatos, vencedores corretos, erros e aproveitamento.
- O retorno considera os palpites e standings da temporada ativa.
- A página de estatísticas do frontend consome esses dados para apresentar o desempenho do usuário.

## RF17 - Sincronização de dados esportivos

O sistema deve permitir que administradores sincronizem dados esportivos.

- Apenas usuários `ADMIN` podem acionar rotas de sincronização.
- A sincronização atual usa APIs da ESPN.
- Existem rotas administrativas para sincronizar liga, times, partidas, jogadores e resultados.
- A sincronização de resultados também pode acionar processamento de fixtures finalizadas.

## RF18 - Tarefas automáticas

O sistema deve executar rotina automática para manter resultados e pontuação atualizados.

- O backend possui scheduler que periodicamente sincroniza resultados.
- A rotina processa fixtures encerradas ainda não processadas.
- Falhas devem ser registradas em logs da aplicação sem expor credenciais.

## RF19 - Permissoes administrativas

O sistema deve diferenciar usuários comuns e administradores.

- Usuários `USER` podem usar as funcionalidades autenticadas comuns.
- Usuários `ADMIN` podem acessar endpoints de sincronização e processamento administrativo.
- A verificação administrativa é feita no backend com base no papel presente no usuário autenticado.
- Não há interface administrativa completa implementada no frontend atual.

## RF20 - Paginas do frontend

O frontend deve oferecer as principais telas de uso do produto.

- Landing page pública.
- Cadastro, login, esqueci minha senha e redefinição de senha.
- Dashboard autenticado.
- Partidas.
- Meus Palpites.
- Transparência.
- Ranking e estatísticas.
- Perfil.
- Regras.

## Funcionalidades fora do escopo atual

Os itens abaixo podem existir parcialmente na modelagem ou no roadmap, mas não estão implementados como fluxo funcional completo nesta versão:

- Palpite de MVP e pontuação por MVP.
- Interface administrativa completa.
- CRUD manual de ligas, temporadas, times e partidas pelo frontend.
- Histórico navegável de temporadas anteriores.
- Ligas privadas, convites, notificações, OAuth, aplicativo mobile e internacionalização.
- Uso efetivo do model `SyncLog` para registrar cada sincronização.
