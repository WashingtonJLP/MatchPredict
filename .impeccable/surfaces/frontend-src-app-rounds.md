---
version: 1
slug: "frontend-src-app-rounds"
primary_target: "frontend/src/app/rounds"
related_targets: []
---

## Scope

Rota autenticada `/rounds`, modo Operate. O usuário escolhe competição, temporada e rodada para entender rapidamente o desempenho coletivo e individual sem expor palpites ainda privados.

## Direction contract

THESIS: Um boletim de rodada compacto e confiável, organizado pela decisão competição → temporada → rodada; recusa tanto uma tabela crua quanto um hero de marketing desproporcional.

OWN-WORLD: Herda integralmente o slate/navy, verde de ação, cartões brancos, bordas quietas, Arial, cantos arredondados e numerais pesados do dashboard MatchPredict.

STORY: Primeiro o usuário situa a rodada, depois lê seu estado e destaques, confere o próprio desempenho e termina na classificação completa com cobertura de palpites visível.

FIRST VIEWPORT: Cabeçalho de página e um painel de seleção em três campos; abaixo, uma faixa navy de resumo da rodada e cards de destaques que já mostram o mecanismo real, sem dados demonstrativos inventados.

FORM: Extensão operacional direta da linguagem existente, definida pelo briefing detalhado; sem concept tournament porque a composição, hierarquia e identidade já estão fechadas pelo produto. Seed key: brief-pinned.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## Constraints

Responsivo desde 390px; estados vazios, futuros, parciais, concluídos e de erro; nenhuma regra crítica recalculada no frontend; sem nova fonte, raster ou alteração durável no sistema visual.
