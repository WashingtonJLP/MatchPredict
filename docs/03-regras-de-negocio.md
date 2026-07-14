# Regras de Negócio

## RN01 - Cadastro de Usuário

- O e-mail do usuário deve ser único.
- A senha deverá ser armazenada criptografada.
- O usuário deverá informar nome, e-mail e senha para realizar o cadastro.
- Não será permitido o cadastro com e-mail já existente.

---

## RN02 - Autenticação

- Apenas usuários autenticados poderão registrar palpites.
- O acesso será realizado utilizando e-mail e senha.
- Após autenticação, será gerado um token JWT.
- O token deverá ser enviado em todas as requisições protegidas.

---

## RN03 - Competições

- Inicialmente o sistema suportará apenas a Premier League.
- A arquitetura deverá permitir a inclusão de novas competições sem necessidade de alterações estruturais.
- Cada competição possuirá sua própria temporada.
- Cada competição possuirá seu próprio ranking.

---

## RN04 - Temporadas

- Apenas uma temporada poderá estar ativa por competição.
- Ao término da temporada, ela será encerrada.
- Uma nova temporada será criada automaticamente ou manualmente pelo administrador.
- O histórico da temporada anterior deverá ser preservado.
- O ranking será reiniciado para a nova temporada.

---

## RN05 - Jogos

- Os jogos serão sincronizados através da API-Football.
- Apenas jogos da temporada ativa serão exibidos aos usuários.
- O sistema deverá atualizar automaticamente os resultados das partidas.
- Jogos adiados deverão manter os palpites registrados.
- Jogos cancelados não gerarão pontuação.

---

## RN06 - Registro de Palpites

- O usuário poderá registrar apenas um palpite por partida.
- O palpite deverá conter:
  - Gols do mandante.
  - Gols do visitante.
  - MVP previsto da partida (opcional, caso habilitado).
- O usuário poderá editar seu palpite enquanto a partida não iniciar.

---

## RN07 - Encerramento dos Palpites

- Os palpites serão bloqueados no momento em que a partida iniciar.
- Após o bloqueio não será permitido:
  - editar o palpite;
  - excluir o palpite;
  - alterar o MVP escolhido.

---

## RN08 - Pontuação

### Placar Exato

Caso o usuário acerte exatamente o placar da partida:

+3 pontos

### Resultado Correto

Caso o usuário acerte apenas o vencedor da partida ou o empate:

+1 ponto

### Erro

Caso o usuário não acerte o vencedor nem o placar:

0 pontos

---

## RN09 - MVP da Partida

- O usuário deverá selecionar obrigatoriamente um MVP para cada palpite.
- Apenas jogadores pertencentes aos dois times da partida poderão ser selecionados.
- O MVP poderá ser alterado enquanto a partida estiver com status **NS (Not Started)**.
- Caso um jogador escolhido seja cortado da partida antes do início, o usuário poderá alterar sua escolha enquanto os palpites estiverem abertos.
- Após o início da partida não será permitido alterar o MVP.
- O MVP oficial da partida será determinado automaticamente através do maior **rating** retornado pela API-Football.
- Em caso de empate no rating, será aplicada uma regra de desempate definida pelo sistema.
- O usuário que acertar o MVP receberá **2 pontos**.

---

## RN10 - Ranking

- O ranking será calculado automaticamente.
- O ranking será específico da competição e da temporada.
- A classificação será ordenada pela pontuação total.

### Critérios de desempate

1. Maior número de placares exatos.
2. Maior número de vencedores corretos.
3. Maior número de MVPs acertados.
4. Menor quantidade de erros.
5. Ordem alfabética.

---

## RN11 - API Externa

- A API-Football será a fonte oficial dos dados esportivos.
- O sistema não permitirá alteração manual dos resultados das partidas.
- Os dados sincronizados poderão ser armazenados localmente para reduzir chamadas à API.

---

## RN12 - Integridade

- Um usuário não poderá registrar dois palpites para a mesma partida.
- Um jogo encerrado não poderá receber novos palpites.
- A pontuação somente poderá ser calculada após a partida ser finalizada.
- A pontuação de um palpite será calculada apenas uma vez.

---

## RN13 - Auditoria

- Toda alteração de pontuação deverá ser registrada.
- Toda sincronização da API deverá ser registrada em log.
- O sistema deverá registrar a data da última sincronização.
---

## RN14 - Administrador

O sistema possuirá usuários com perfil **ADMIN**.

Apenas administradores poderão:

- Iniciar uma nova temporada.
- Encerrar a temporada ativa.
- Executar sincronizações manuais da API-Football.
- Visualizar os logs de sincronização.
- Gerenciar configurações da aplicação.
- Atualizar manualmente dados de competições, times e partidas quando necessário.
---
## RN15 - Sincronização da API

- O sistema utilizará a API-Football como fonte oficial dos dados esportivos.
- As informações de competições, partidas e resultados serão sincronizadas periodicamente.
- O administrador poderá executar uma sincronização manual sempre que necessário.
- Os dados sincronizados serão armazenados localmente para reduzir o número de chamadas à API.
- Em caso de indisponibilidade temporária da API, o sistema continuará utilizando os últimos dados sincronizados.