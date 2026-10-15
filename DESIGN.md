---
name: MatchPredict
description: Um produto de palpites de futebol claro, com entrada rápida de placar, classificação transparente e estados em verde de campo.
colors:
  pitch-ink: "#0f172a"
  pitch-ink-dark: "#020617"
  paper: "#f8fafc"
  card: "#ffffff"
  text: "#1e293b"
  line: "#e2e8f0"
  muted: "#f1f5f9"
  muted-text: "#64748b"
  field-green: "#22c55e"
  field-green-deep: "#16a34a"
  goal-amber: "#f59e0b"
  error-red: "#dc2626"
  info-blue: "#0284c7"
typography:
  display:
    fontFamily: "Arial, sans-serif"
    fontSize: "3rem"
    fontWeight: 800
    lineHeight: 1.1
    letterSpacing: "normal"
  headline:
    fontFamily: "Arial, sans-serif"
    fontSize: "2.25rem"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "normal"
  title:
    fontFamily: "Arial, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: "normal"
  body:
    fontFamily: "Arial, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.75
    letterSpacing: "normal"
  label:
    fontFamily: "Arial, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 700
    lineHeight: 1.4
    letterSpacing: "0.025em"
  navigation:
    fontFamily: "Arial, sans-serif"
    fontSize: "1rem"
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: "normal"
rounded:
  sm: "4.8px"
  md: "6.4px"
  lg: "8px"
  xl: "11.2px"
  2xl: "14.4px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
  2xl: "48px"
components:
  button-primary:
    backgroundColor: "{colors.pitch-ink}"
    textColor: "#ffffff"
    rounded: "{rounded.xl}"
    padding: "0 24px"
    height: "48px"
  button-accent:
    backgroundColor: "{colors.field-green}"
    textColor: "#052e16"
    rounded: "{rounded.xl}"
    padding: "0 28px"
    height: "48px"
  button-outline:
    backgroundColor: "transparent"
    textColor: "{colors.text}"
    rounded: "{rounded.xl}"
    padding: "0 24px"
    height: "48px"
  card-standard:
    backgroundColor: "{colors.card}"
    textColor: "{colors.text}"
    rounded: "{rounded.2xl}"
    padding: "24px"
  input-score:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.text}"
    rounded: "{rounded.xl}"
    padding: "0 16px"
    height: "56px"
---

# Sistema de design do MatchPredict

## Direção visual

**Norte criativo: “A central do dia de jogo”.**

O MatchPredict deve transmitir calma, confiança e leitura operacional. A interface precisa ser simples para o torcedor casual e estruturada o bastante para um produto competitivo de classificação. O sistema atual combina molduras em slate, estados de confirmação em verde, cards compactos e texto direto em português do Brasil.

A função vem antes da decoração. A energia visual está nos placares, posições, troféus, ícones relacionados ao futebol e elevações discretas de interação. Páginas públicas podem ser mais persuasivas; superfícies autenticadas e administrativas devem permanecer previsíveis e orientadas à tarefa.

Características principais:

- autoridade em slate e realces de estado em verde;
- cards claros sobre canvas suave, com equivalentes coerentes no tema escuro;
- placares, pontos e posições com forte peso tipográfico;
- controles arredondados, alvos de toque confortáveis e foco visível;
- layouts responsivos que empilham conteúdo e preservam navegação completa no mobile.

## Cores

A paleta é orientada ao produto: slate estabelece autoridade, verde de campo comunica ação e sucesso, e azuis acinzentados reduzem o ruído de tarefas repetitivas.

### Primárias

- **Pitch Ink (`#0f172a`)**: marca, navegação, comandos padrão, overlays e estados selecionados.
- **Night Pitch (`#020617`)**: fundo mais profundo do tema escuro.

### Secundárias

- **Field Green (`#22c55e`)**: ação, foco, sucesso, partidas ao vivo, palpites registrados e dados importantes.
- **Deep Field Green (`#16a34a`)**: sucesso forte, toast e apoio aos gráficos.

### Estados

- **Goal Amber (`#f59e0b`)**: aviso e cautela.
- **Result Red (`#dc2626`)**: erro, estado negativo e ação destrutiva.
- **Fixture Info Blue (`#0284c7`)**: informação contextual e toast informativo.

### Neutras

- **Match Paper (`#f8fafc`)**: fundo principal claro.
- **Card White (`#ffffff`)**: cards, popovers e barras claras.
- **Score Text (`#1e293b`)**: texto, títulos e dados fortes.
- **Quiet Line (`#e2e8f0`)**: bordas e divisores.
- **Muted Turf (`#f1f5f9`)**: painéis secundários, skeletons, cabeçalhos e hover.
- **Muted Commentary (`#64748b`)**: metadados, ajuda e navegação inativa.

Regras:

- **Verde significa ação ou estado.** Não usar Field Green como decoração genérica.
- **Slate representa autoridade.** Não introduzir outra cor dominante de marca.
- **Tema escuro mantém semântica.** As variáveis mudam contraste, mas preservam a função das cores.

## Tipografia

Arial, com fallback `sans-serif`, é a família única para conteúdo, navegação, dados, controles e overlays. A hierarquia depende de peso, tamanho e espaçamento, não de múltiplas famílias.

| Nível | Especificação | Uso |
| --- | --- | --- |
| Display | 800, 48–60 px, `line-height: 1.1` | Hero e títulos de maior destaque |
| Headline | 700, 30–36 px, `line-height: 1.2` | Cabeçalhos de página e seção |
| Title | 600, 20 px, `line-height: 1.3` | Cards e módulos compactos |
| Body | 400, 16 px, `line-height: 1.75` | Explicações, estados vazios e erros |
| Label | 700, 12 px, tracking `0.025em` | Status, tabelas e metadados |

Regras:

- **Peso do placar.** Pontos, posições, valores e placares usam os pesos mais fortes porque são os fatos de leitura mais rápida.
- **Uma família.** Não carregar webfont enquanto Arial continuar sendo a família oficial.
- Texto longo deve manter largura confortável, próxima de 650 px quando a composição permitir.

## Layout

- Conteúdo público usa em geral `max-w-6xl`; dashboards usam `max-w-7xl`.
- Padding horizontal típico: 16 px no mobile, 24 px em telas pequenas e 32 px em telas grandes.
- Seções públicas usam ritmo vertical mais amplo; áreas operacionais usam 24–40 px.
- Grids passam de uma coluna para duas ou três conforme o espaço.
- Cards de partida preservam colunas flexíveis para os times e uma coluna central estável para placar ou “VS”.
- Tabelas administrativas viram cards com pares rótulo/valor abaixo de `md`; a tabela completa aparece a partir desse breakpoint.

### Navegação autenticada

O shell principal usa sidebar fixa de 288 px a partir de `lg`. No mobile, mantém header sticky, faixa horizontal rolável de atalhos e drawer lateral com a navegação completa.

### Navegação administrativa

O Admin usa sidebar fixa de 256 px a partir de `lg`, sem substituir a experiência desktop. Abaixo de `lg`, mantém duas camadas complementares:

- faixa horizontal rolável para alternância rápida entre áreas administrativas;
- botão de 44 × 44 px que abre drawer modal com todas as páginas, “Voltar ao produto” e “Sair”.

A rota atual deve permanecer destacada e usar `aria-current="page"`. A faixa precisa indicar discretamente quando existe conteúdo fora do viewport sem provocar overflow global.

## Elevação e profundidade

O sistema é plano por padrão. Sombras aparecem em cards, navegação, drawers, dialogs, toasts e hover para comunicar hierarquia ou interação.

- **Quiet Surface** — `0 1px 2px rgb(15 23 42 / 0.05)`: cards e containers compactos.
- **Interactive Lift** — `0 10px 15px -3px rgb(15 23 42 / 0.10), 0 4px 6px -4px rgb(15 23 42 / 0.10)`: hover e ações elevadas.
- **Overlay Panel** — `0 25px 50px -12px rgb(15 23 42 / 0.25)`: drawers e modais.
- **Toast Lift** — `0 1.25rem 2.5rem -1rem rgb(15 23 42 / 0.35)`: notificações prioritárias.

Elevação e translação devem confirmar interatividade; conteúdo estático permanece discreto.

## Formas

Controles pequenos usam cantos de 8 a 12 px. Cards, dialogs, painéis de placar e ícones usam aproximadamente 14 px. Pills totalmente arredondadas ficam reservadas para status e metadados curtos.

Bordas são visíveis, mas silenciosas: normalmente 1 px em Quiet Line. Borda verde aparece para foco, hover relevante ou palpite registrado.

## Componentes

### Botões

- altura mínima usual de 44 a 48 px;
- ação primária em Pitch Ink com texto branco;
- ação de destaque em Field Green com texto verde-escuro;
- foco com anel verde de 3 a 4 px em baixa opacidade;
- variantes outline e ghost permanecem neutras até a interação;
- ações destrutivas usam tratamento vermelho e confirmação quando o efeito for difícil de reverter.

### Chips de estado

- texto de 12 px, forte e geralmente categórico;
- verde para sucesso, ao vivo, ativo ou registrado;
- neutro para fechado/inativo;
- âmbar para revisão ou atenção;
- vermelho para falha, desativação ou destruição.

### Cards e containers

- fundo Card White sobre Match Paper no tema claro;
- equivalentes definidos pelos tokens no tema escuro;
- 20–24 px de padding em cards de aplicação e 24–32 px em cards públicos;
- sombra leve em repouso;
- elevação no hover somente quando houver ação ou relevância de varredura.

### Campos

- inputs de placar são grandes, centralizados, fortes e têm 56 px de altura;
- foco altera borda e anel para Field Green;
- erro usa Result Red;
- estado desabilitado reduz ênfase e remove interação;
- formulários mobile não devem reduzir fonte ou alvo de toque para “fazer caber”.

### Navegação

- navegação pública desktop é horizontal e textual;
- áreas autenticadas usam sidebar com ícone e rótulo em desktop;
- faixas horizontais mobile usam overflow local, nunca overflow global da página;
- drawers apresentam navegação completa e fecham ao selecionar uma opção;
- itens ativos permanecem identificáveis por cor, fundo e semântica.

### Dialogs e drawers

- overlay em Pitch Ink translúcido;
- painel com fundo de popover, cantos arredondados e sombra Overlay Panel;
- Escape e clique no overlay fecham sem confirmar ações;
- foco inicial deve ser explícito para operações destrutivas e permanecer na ação segura;
- foco fica contido no modal e retorna ao acionador após fechar;
- documento fica sem scroll enquanto o drawer modal está aberto;
- conteúdo excedente usa scroll interno;
- ações empilham no mobile e podem alinhar horizontalmente em telas maiores.

O drawer do Admin usa a primitive `Dialog` do Base UI. O componente compartilhado de dialog mantém semântica modal, captura de foco e restauração para os demais fluxos.

### Tabelas

- desktop: container arredondado, cabeçalho muted em caixa alta e linhas divididas;
- mobile: cards com `dl`, rótulos e valores;
- tabelas largas podem usar overflow local com foco por teclado;
- conteúdo, e-mail e IDs longos devem quebrar linha sem alargar a página.

### Toasts

- sucesso em Deep Field Green;
- erro em Result Red;
- aviso em Goal Amber;
- informação em Fixture Info Blue;
- em telas de até 600 px, largura calculada a partir do viewport e sem mínimo fixo.

## Conteúdo e estados

- Toda copy voltada ao usuário deve estar em português do Brasil.
- Estados de participação e pagamento devem distinguir claramente `PENDING`, `PAID`, `EXPIRED`, `CANCELLED`, `FAILED`, `ACTIVE` e `CANCELLED` da participação.
- A interface não pode sugerir que um pagamento `PENDING` autoriza palpites.
- Ações destrutivas devem explicar o impacto e exigir decisão explícita.
- Loading, vazio e erro devem usar os componentes compartilhados e não alterar a estrutura da página de forma abrupta.

## Acessibilidade e responsividade

- foco visível em todos os controles;
- alvos de toque de pelo menos 44 × 44 px para ações principais e navegação;
- navegação por teclado em dialogs, drawers e tabelas roláveis;
- `aria-current="page"` para navegação ativa;
- `aria-label` em botões apenas com ícone;
- informação de status não depende somente de cor;
- `prefers-reduced-motion` deve ser respeitado em movimentos programáticos quando aplicável;
- layouts devem permanecer utilizáveis desde 320 px sem rolagem horizontal global.

## Fazer

- preservar a identidade slate/verde/branco;
- manter entrada de placar grande e óbvia antes do fechamento;
- usar cards e tabelas em fluxos de alta varredura;
- deixar participação, fechamento, transparência e classificação explicáveis;
- preservar densidade e hierarquia das áreas logada e administrativa;
- validar estados claros e escuros ao alterar tokens ou componentes compartilhados.

## Evitar

- alegações de aposta, prêmio, comercialização, depoimentos ou imprensa sem evidência;
- verde usado como padrão decorativo sem semântica;
- hero oversized em páginas de trabalho;
- nova família tipográfica enquanto Arial for a decisão vigente;
- ocultar horário de fechamento, participação necessária ou efeito de ranking;
- reduzir fontes e touch targets para acomodar mais ações;
- transformar a navegação mobile em bottom navigation sem decisão de produto específica.
