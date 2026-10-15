# Produto

<!-- impeccable:product-schema 1 -->

## Plataforma

Aplicação web responsiva.

## Público

O público principal é formado por fãs de futebol que desejam registrar palpites de placar, acompanhar jogos e comparar seu desempenho em uma classificação transparente.

O produto deve continuar acessível a participantes casuais. A experiência não deve exigir familiaridade com fantasy sports, mercados financeiros ou apostas.

Administradores formam um público operacional secundário. Eles precisam acompanhar usuários, participações e pagamentos sem receber poderes financeiros manuais que alterem a fonte de verdade do fluxo PIX.

## Objetivo do produto

O MatchPredict oferece uma competição de palpites de futebol simples e verificável. O participante deve conseguir entender rapidamente:

- quais jogos estão disponíveis;
- se possui participação ativa para o período;
- até quando pode criar ou editar um palpite;
- quando os palpites dos demais se tornam visíveis;
- como sua pontuação foi calculada;
- como sua posição na classificação foi formada.

O sucesso da experiência depende de regras previsíveis, feedback claro e confiança na transparência e na classificação.

## Posicionamento

MatchPredict é um produto de palpites e classificação entre participantes. Embora também demonstre uma arquitetura full-stack, a interface deve se comportar como produto de uso real, não como vitrine técnica.

Seus mecanismos centrais são:

- dados esportivos provenientes da ESPN;
- palpites autenticados de placar;
- fechamento individual por kickoff e estado da partida;
- transparência dos palpites após o fechamento;
- pontuação automática e classificação explicável;
- estatísticas e classificação por rodada calculadas sob demanda;
- participação mensal confirmada por pagamento PIX;
- operação administrativa auditada.

O MatchPredict não é uma plataforma de apostas. Prêmio, rateio, carteira, saque e odds não fazem parte do produto implementado.

## Jornada principal

1. Criar uma conta `USER` ou entrar.
2. Consultar jogos e competições.
3. Verificar a participação do mês e, quando necessário, gerar ou retomar o PIX.
4. Após a confirmação, obter `Participation ACTIVE`.
5. Criar ou editar palpites antes do fechamento da fixture.
6. Acompanhar jogos e consultar a transparência quando liberada.
7. Ver pontos, estatísticas e posição na classificação.

O jogo de palpites persistido continua concentrado na temporada ativa da Premier League. A navegação pública de jogos e competições já abrange um catálogo nacional e internacional mais amplo.

A área de Rodadas permite selecionar competição, temporada e rodada para consultar classificação, destaques e desempenho individual calculados sob demanda, sem incluir ajustes administrativos do ranking geral.

## Participação mensal

A participação atual custa R$ 25,00 por mês calendário em `America/Sao_Paulo`.

Decisões de produto:

- pagamento `PENDING` não concede acesso aos palpites;
- a autorização efetiva depende de `Participation ACTIVE` no período do kickoff;
- o fluxo usa QR PIX estático individual do Asaas;
- webhook é o caminho principal de confirmação;
- status e reconciliação pontual ajudam quando o webhook atrasa;
- não há ativação manual, marcação manual como pago, alteração de valor ou estorno no painel.

## Área administrativa

A área `/admin` atende a operação atual com:

- dashboard de indicadores;
- consulta, filtros e detalhe de usuários;
- classificação e desempenho por temporada;
- pagamentos e participações;
- pendências financeiras observacionais;
- auditoria administrativa;
- desativação e reativação de contas `USER`;
- exclusão definitiva somente quando a análise de impacto não encontra bloqueadores.

O cadastro público sempre cria `USER`. Não existe promoção ou rebaixamento de `ADMIN` pela interface. Ações de gestão não podem ser aplicadas indevidamente a contas administrativas, e o administrador não pode excluir a própria conta pelo fluxo de exclusão.

## Capacidades implementadas

- cadastro, login JWT, recuperação de senha e perfil;
- jogos do dia e exploração de competições;
- fixtures com filtros e paginação;
- criação, edição, exclusão e histórico de palpites;
- fechamento por kickoff e status;
- transparência antes/depois do fechamento;
- processamento de resultados e pontuação;
- classificação oficial e estatísticas pessoais;
- participação mensal, PIX, webhook, histórico, status e reconciliação;
- Admin responsivo com auditoria e ações seguras;
- sincronização esportiva e scheduler otimizado para reduzir atividade recorrente no banco.

## Restrições confirmadas

- A linguagem da interface e da documentação de produto é português do Brasil.
- Usuários fazem palpites de placar; MVP não integra o fluxo funcional atual.
- A ESPN é a fonte esportiva e o Asaas é o provedor PIX atual.
- Regras de fechamento, transparência, pontuação e desempate não devem ser alteradas por trabalho visual.
- A posição oficial é dinâmica; o campo legado `Standing.position` não representa a classificação.
- O valor e a autorização mensal vêm do backend, não do estado visual do cliente.
- A área administrativa não possui mutações financeiras.
- O produto não promove usuários comuns a administradores.
- A stack atual é Next.js no frontend, NestJS no backend, Prisma e PostgreSQL/Neon.

## Fora do escopo atual

- palpite e pontuação por MVP;
- ligas privadas e convites;
- premiações e mecanismos de aposta;
- histórico completo navegável de temporadas anteriores;
- OAuth e internacionalização;
- aplicativo móvel nativo;
- CRUD administrativo manual de competições e resultados;
- controle visual de sincronizações esportivas no Admin.

## Princípios de produto

### Rapidez

Registrar ou ajustar um placar deve exigir pouco esforço enquanto a fixture estiver aberta.

### Clareza

Participação, pagamento, estado da partida, fechamento e pontuação devem usar mensagens diretas e estados visuais consistentes.

### Confiança

Palpites alheios não podem ser revelados antes da hora. Resultados, pontos, ajustes e posições precisam ser explicáveis pelas regras documentadas.

### Segurança operacional

Ações destrutivas exigem confirmação, contas desativadas perdem acesso e o histórico financeiro deve ser preservado quando a exclusão não for segura.

### Evolução incremental

Mudanças de interface devem preservar regras de negócio, comportamento desktop, acessibilidade e identidade existente, salvo decisão explícita em trabalho próprio.

## Marca

O nome do produto é MatchPredict. Os ativos e componentes de identidade existentes devem ser considerados antes de alterações visuais:

- `docs/images/MatchPredict.png`;
- `frontend/public/MatchPredict.png`;
- `frontend/src/app/icon.svg`;
- `frontend/src/components/shared/brand-mark.tsx`.

A evolução visual deve tornar a aplicação mais consistente, agradável e profissional sem descaracterizar a marca.

## Acessibilidade e inclusão

A experiência deve favorecer linguagem clara, controles previsíveis, navegação por teclado, foco visível, alvos de toque confortáveis e layouts responsivos. Estados de carregamento, erro, bloqueio, pagamento e confirmação precisam ser compreensíveis sem depender apenas de cor.

## Fontes internas

- `README.md`: entrada técnica e execução do projeto;
- `docs/01-visao-geral.md`: visão geral do produto;
- `docs/02-requisitos-funcionais.md`: capacidades implementadas;
- `docs/03-regras-de-negocio.md`: regras efetivas;
- `docs/04-modelagem-do-banco.md`: entidades e integridade;
- `docs/05-endpoints.md`: contratos HTTP;
- `docs/06-arquitetura.md`: componentes e fluxos;
- `docs/07-roadmap.md`: evolução futura;
- `docs/08-participacao-mensal-pix.md`: fluxo mensal e PIX;
- `DESIGN.md`: decisões visuais e de interação.

Não devem ser inventados depoimentos, números de usuários, cobertura de imprensa, alegações de apostas, prêmios ou disponibilidade comercial sem evidência explícita.
