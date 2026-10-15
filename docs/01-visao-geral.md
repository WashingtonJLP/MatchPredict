# MatchPredict

## Visão geral

MatchPredict é uma plataforma full-stack de palpites de futebol. O produto reúne calendário de jogos, palpites de placar, transparência após o início das partidas, pontuação, classificação entre participantes, consulta de competições e uma participação mensal vinculada a pagamento via PIX.

A aplicação separa a experiência do participante da operação administrativa. Usuários comuns acompanham jogos, registram palpites e consultam seu desempenho. Administradores acompanham usuários, pagamentos, participações, pendências financeiras e auditoria, além de poderem desativar, reativar ou excluir contas dentro das restrições de segurança existentes.

## Proposta do produto

O MatchPredict busca oferecer uma experiência simples e verificável para uma competição de palpites:

- reunir jogos de diferentes competições em uma interface única;
- aceitar um palpite de placar por usuário e partida enquanto a edição estiver permitida;
- fechar palpites de acordo com o kickoff e o estado da partida;
- tornar os palpites transparentes no momento definido pelas regras do produto;
- calcular pontos e ordenar a classificação de forma consistente;
- controlar a elegibilidade mensal por meio de uma participação ativa;
- registrar pagamentos PIX e reconciliar seu estado com o provedor;
- dar suporte operacional por meio de uma área administrativa protegida.

## Principais funcionalidades

### Conta e autenticação

- cadastro público de usuários comuns;
- login com JWT;
- recuperação e redefinição de senha por e-mail;
- consulta e atualização do perfil;
- invalidação de sessões quando uma conta é desativada ou reativada.

### Jogos, palpites e transparência

- consulta de jogos por data e de partidas da temporada ativa;
- criação, edição e exclusão de palpites próprios antes do bloqueio;
- área de palpites ativos e histórico do usuário;
- bloqueio de alterações conforme kickoff e estado da partida;
- visualização dos palpites dos demais participantes somente após a liberação prevista pela regra de transparência;
- processamento de resultados e atribuição de pontos.

### Classificação e competições

- classificação da temporada ativa e posição do usuário autenticado;
- estatísticas individuais de desempenho;
- classificação, destaques e desempenho individual por rodada, calculados sob demanda;
- catálogo de competições nacionais e internacionais;
- consulta de temporadas, classificações esportivas e fases eliminatórias quando a competição oferece esses dados.

### Participação mensal e PIX

- período de participação baseado no mês calendário em `America/Sao_Paulo`;
- cobrança mensal de R$ 25,00, armazenada como 2.500 centavos;
- criação e retomada de pagamento PIX;
- histórico e consulta de status dos pagamentos;
- confirmação por webhook e reconciliação pontual com o Asaas;
- ativação da participação após a confirmação de um pagamento elegível.

Um pagamento `PENDING` não autoriza palpites. A autorização efetiva depende de uma `Participation` com status `ACTIVE` no período correspondente à partida.

### Área administrativa

A área `/admin` é restrita a contas `ADMIN` e oferece:

- visão geral com indicadores operacionais;
- listagem e detalhe de usuários, incluindo classificação e desempenho;
- consulta de pagamentos e participações;
- acompanhamento de pendências financeiras;
- auditoria de ações administrativas;
- desativação e reativação de contas com preservação do histórico;
- análise prévia e exclusão definitiva somente quando as restrições de segurança permitem.

O cadastro público sempre cria uma conta `USER`; não existe promoção para `ADMIN` pela interface.

## Fluxo básico do usuário

1. O usuário cria uma conta ou entra com suas credenciais.
2. Consulta os jogos disponíveis e o período mensal correspondente.
3. Obtém uma participação ativa para o período por meio do fluxo de pagamento PIX.
4. Registra ou ajusta palpites enquanto a partida ainda está aberta.
5. Após o kickoff, acompanha o jogo e a transparência dos palpites.
6. Com o resultado processado, consulta seus pontos, estatísticas e posição na classificação.

## Arquitetura em alto nível

- O frontend em Next.js e React entrega as experiências pública, autenticada e administrativa.
- O backend em NestJS expõe uma API REST sob `/api/v1`, aplica autenticação, autorização e regras de negócio e integra os serviços externos.
- O Prisma centraliza o acesso ao PostgreSQL, hospedado no Neon no ambiente de produção.
- A ESPN fornece dados de jogos, resultados e competições.
- O Asaas é o provedor usado no fluxo de pagamentos PIX.
- Um scheduler sincroniza resultados e processa partidas concluídas, com verificações que evitam trabalho recorrente desnecessário no banco.
- Docker e Docker Compose organizam a execução dos serviços do projeto.

## Escopo atual

O produto implementa a jornada principal de cadastro, participação mensal, palpites, transparência, pontuação e classificação, além da operação administrativa correspondente. A modelagem ainda contém campos para MVP de jogador, mas esse componente não participa da pontuação funcional atual.

Recursos como ligas privadas, convites, premiações, carteira, saques, odds, apostas, aplicativo móvel nativo e internacionalização não fazem parte da implementação atual.
