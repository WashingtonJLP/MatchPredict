# Requisitos Funcionais

## RF01 - Cadastro de Usuário

Descrição:
O sistema deverá permitir que um usuário realize seu cadastro.

Regras:
- Nome obrigatório.
- E-mail único.
- Senha criptografada.
- Validação dos campos.

---

## RF02 - Login

Descrição:
O usuário poderá autenticar-se utilizando e-mail e senha.

Regras:
- JWT.
- Senha criptografada.
- Token com expiração.

---

## RF03 - Visualizar Competição

Descrição:
O usuário poderá visualizar a competição disponível.

Versão 1:
- Premier League.

---

## RF04 - Visualizar Jogos

Descrição:
O sistema exibirá todos os jogos da competição.

Informações:
- Escudos
- Times
- Rodada
- Data
- Horário
- Status

---

## RF05 - Registrar Palpite

Descrição:
O usuário poderá registrar um palpite antes do início da partida.

Campos:
- Gols mandante
- Gols visitante

---

## RF06 - Editar Palpite

Descrição:
O usuário poderá alterar seu palpite enquanto o jogo não iniciar.

---

## RF07 - Bloquear Palpites

Descrição:
Após o início da partida, o sistema bloqueará alterações.

---

## RF08 - Atualizar Resultados

Descrição:
O sistema sincronizará automaticamente os resultados utilizando a API-Football.

---

## RF09 - Calcular Pontuação

Descrição:
Após o término da partida, o sistema calculará automaticamente os pontos.

Regras:
- Placar exato = 3 pontos
- Acertou vencedor/empate = 1 ponto
- Erro = 0 ponto

---

## RF10 - Ranking

Descrição:
O sistema exibirá a classificação dos participantes.

Informações:
- Posição
- Nome
- Pontuação
- Quantidade de acertos

---

## RF11 - Encerrar Temporada

Descrição:
Ao final da temporada, uma nova temporada poderá ser criada, mantendo o histórico da anterior.

---

## RF12 - Histórico

Descrição:
O usuário poderá consultar temporadas anteriores.