# Requisitos Funcionais

Este documento descreve os requisitos funcionais implementados atualmente no MatchPredict. O codigo do backend e do frontend e a fonte de verdade para esta versao da documentacao.

## RF01 - Cadastro de usuario

O sistema deve permitir que um visitante crie uma conta informando nome, e-mail e senha.

- O e-mail deve ter formato valido e ser unico.
- A senha deve ter entre 8 e 72 caracteres, com ao menos uma letra maiuscula, uma letra minuscula e um numero.
- A senha deve ser armazenada de forma criptografada.
- A resposta de cadastro nao deve retornar senha nem campos de recuperacao de senha.
- Novos usuarios sao criados com papel `USER`.

## RF02 - Login

O sistema deve permitir login com e-mail e senha.

- O e-mail deve ser normalizado antes da autenticacao.
- Credenciais invalidas devem ser recusadas.
- Em caso de sucesso, a API retorna um token JWT.
- As rotas autenticadas devem usar `Authorization: Bearer <token>`.

## RF03 - Recuperacao de senha

O sistema deve permitir que um usuario solicite recuperacao de senha por e-mail.

- A solicitacao recebe um e-mail e retorna uma mensagem generica, exista ou nao usuario com aquele e-mail.
- Quando o usuario existe, o backend gera um token, armazena apenas o hash do token e define prazo de expiracao.
- O link de recuperacao e enviado por SMTP.
- A redefinicao exige token, nova senha e confirmacao da senha.
- Token inexistente, expirado ou ja consumido deve ser recusado.
- Apos redefinir a senha, o token e a expiracao sao removidos.

## RF04 - Perfil do usuario

O sistema deve permitir que o usuario autenticado consulte e atualize seu proprio perfil.

- A consulta retorna os dados publicos do usuario autenticado.
- A atualizacao permite alterar nome e, quando aplicavel, senha.
- Para troca de senha pelo perfil, a senha atual deve ser validada.
- A nova senha deve seguir a mesma politica de seguranca do cadastro.

## RF05 - Visualizacao de partidas

O sistema deve permitir que usuarios autenticados visualizem partidas sincronizadas.

- A listagem de partidas suporta filtros por status, rodada, time e intervalo de datas.
- A listagem suporta paginacao por `page` e `limit`.
- As partidas sao ordenadas por kickoff em ordem crescente.
- Cada partida inclui dados dos times mandante e visitante, campeonato, temporada, rodada, status, kickoff, placar quando disponivel e indicador se ainda aceita palpite.

## RF06 - Criacao de palpites

O sistema deve permitir que o usuario autenticado registre um palpite para uma partida.

- O palpite contem partida, gols do mandante e gols do visitante.
- Os gols devem ser numeros inteiros nao negativos.
- Cada usuario pode ter apenas um palpite por partida.
- O usuario so pode criar palpite antes do kickoff e enquanto a partida nao estiver `LIVE` nem `FT`.
- Nao ha campo funcional de MVP no contrato atual de criacao de palpite.

## RF07 - Edicao de palpites

O sistema deve permitir que o usuario autenticado edite um palpite proprio.

- Somente o dono do palpite pode edita-lo.
- A edicao segue a mesma regra de bloqueio da criacao: kickoff futuro e status diferente de `LIVE` e `FT`.
- A edicao permite alterar apenas o placar previsto.
- Palpites de partidas iniciadas, ao vivo ou encerradas nao podem ser editados.

## RF08 - Exclusao de palpites

O sistema deve permitir que o usuario autenticado exclua um palpite proprio.

- Somente o dono do palpite pode exclui-lo.
- A exclusao segue a mesma regra de bloqueio da criacao e edicao.
- Palpites de partidas iniciadas, ao vivo ou encerradas nao podem ser excluidos.

## RF09 - Meus Palpites

O sistema deve permitir que o usuario autenticado consulte exclusivamente os palpites que ele ja registrou.

- A pagina "Meus Palpites" usa a rota `GET /api/v1/predictions/my`.
- A API retorna apenas palpites do usuario autenticado.
- A pagina nao deve buscar nem exibir partidas sem palpite do usuario.
- No frontend atual, os palpites sao organizados em "Seus palpites ativos" e "Historico de palpites".
- Palpites ativos sao aqueles que ainda podem ser alterados pela regra atual.
- O historico contem os palpites que nao podem mais ser alterados e pode ser filtrado por rodada no frontend.

## RF10 - Transparencia de palpites

O sistema deve permitir consultar palpites associados a uma partida respeitando a regra de transparencia.

- Antes do kickoff, um usuario autenticado deve ver apenas o proprio palpite naquela partida.
- Antes do kickoff, se o usuario nao fez palpite, a resposta deve ocultar palpites de outros usuarios.
- Apos o kickoff ou quando a partida estiver `LIVE`, os palpites da partida podem ser exibidos.
- Para partidas encerradas, o retorno pode incluir resultado final e pontuacao calculada quando disponivel.

## RF11 - Resultados das partidas

O sistema deve armazenar e exibir resultados sincronizados das partidas.

- Partidas encerradas possuem status `FT` e placar final quando a fonte de dados fornece o resultado.
- O frontend pode mostrar resultado final em cards de palpites e transparencia quando a partida esta encerrada e ha placar disponivel.
- O processamento de resultados depende de fixtures encerradas com placar final.

## RF12 - Calculo de pontuacao

O sistema deve calcular pontuacao dos palpites de partidas finalizadas.

- Placar exato vale 3 pontos.
- Acerto do vencedor ou empate sem placar exato vale 1 ponto.
- Erro do resultado vale 0 ponto.
- Palpites sem partida encerrada ou sem placar final nao recebem pontuacao.
- A pontuacao atual e baseada apenas no placar previsto; nao ha pontuacao funcional por MVP.

## RF13 - Processamento de resultados e ranking

O sistema deve processar partidas encerradas e atualizar os rankings.

- O processamento considera partidas com status `FT` e ainda nao processadas.
- Cada palpite da partida recebe pontuacao de placar, total, indicador de placar exato e indicador de vencedor correto.
- A fixture processada recebe `processedAt`.
- Os standings dos usuarios sao recalculados com base nos palpites processados da temporada ativa.
- O processamento deve ser idempotente para evitar reprocessar fixtures ja marcadas como processadas.

## RF14 - Ranking geral

O sistema deve disponibilizar ranking da temporada ativa.

- O ranking geral e publico.
- A ordenacao considera total de pontos, placares exatos, vencedores corretos, palpites errados e data de criacao do standing.
- A resposta inclui posicao, usuario e estatisticas acumuladas.

## RF15 - Ranking do usuario autenticado

O sistema deve permitir que o usuario autenticado consulte sua propria posicao no ranking.

- A consulta retorna os dados do standing do usuario na temporada ativa.
- Quando o usuario ainda nao possui standing, a resposta representa pontuacao zerada conforme a regra do backend.

## RF16 - Estatisticas do usuario

O sistema deve permitir que o usuario autenticado consulte suas estatisticas.

- As estatisticas incluem pontos, quantidade de palpites, placares exatos, vencedores corretos, erros e aproveitamento.
- O retorno considera os palpites e standings da temporada ativa.
- A pagina de estatisticas do frontend consome esses dados para apresentar o desempenho do usuario.

## RF17 - Sincronizacao de dados esportivos

O sistema deve permitir que administradores sincronizem dados esportivos.

- Apenas usuarios `ADMIN` podem acionar rotas de sincronizacao.
- A sincronizacao atual usa APIs da ESPN.
- Existem rotas administrativas para sincronizar liga, times, partidas, jogadores e resultados.
- A sincronizacao de resultados tambem pode acionar processamento de fixtures finalizadas.

## RF18 - Tarefas automaticas

O sistema deve executar rotina automatica para manter resultados e pontuacao atualizados.

- O backend possui scheduler que periodicamente sincroniza resultados.
- A rotina processa fixtures encerradas ainda nao processadas.
- Falhas devem ser registradas em logs da aplicacao sem expor credenciais.

## RF19 - Permissoes administrativas

O sistema deve diferenciar usuarios comuns e administradores.

- Usuarios `USER` podem usar as funcionalidades autenticadas comuns.
- Usuarios `ADMIN` podem acessar endpoints de sincronizacao e processamento administrativo.
- A verificacao administrativa e feita no backend com base no papel presente no usuario autenticado.
- Nao ha interface administrativa completa implementada no frontend atual.

## RF20 - Paginas do frontend

O frontend deve oferecer as principais telas de uso do produto.

- Landing page publica.
- Cadastro, login, esqueci minha senha e redefinicao de senha.
- Dashboard autenticado.
- Partidas.
- Meus Palpites.
- Transparencia.
- Ranking e estatisticas.
- Perfil.
- Regras.

## Funcionalidades fora do escopo atual

Os itens abaixo podem existir parcialmente na modelagem ou no roadmap, mas nao estao implementados como fluxo funcional completo nesta versao:

- Palpite de MVP e pontuacao por MVP.
- Interface administrativa completa.
- CRUD manual de ligas, temporadas, times e partidas pelo frontend.
- Historico navegavel de temporadas anteriores.
- Ligas privadas, convites, notificacoes, OAuth, aplicativo mobile e internacionalizacao.
- Uso efetivo do model `SyncLog` para registrar cada sincronizacao.
