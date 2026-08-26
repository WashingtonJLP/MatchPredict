# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Primary users are football fans, especially Premier League fans, who want to register score predictions for matches and track their performance across the competition.

The product must remain simple and accessible for casual users who may not want a complex fantasy-sports or betting-style experience.

## Product Purpose

MatchPredict is a full-stack football prediction platform focused on Premier League matches. It lets authenticated users view synchronized fixtures, submit score predictions before kickoff, follow their active and historical predictions, and compare performance through points, rankings, statistics, and prediction transparency.

Success means users can quickly understand which matches are available, make predictions with confidence, see when prediction rules lock, and understand how their score affects the ranking.

## Positioning

MatchPredict is primarily a football prediction and competition product with a transparent participant ranking. Although it is also a full-stack portfolio project, the interface should behave first like a real product for users rather than a technical demo.

Its distinguishing mechanism is a focused Premier League prediction loop: authenticated score predictions, ESPN-backed fixture data, transparent post-kickoff prediction visibility, automated scoring, and a clear ranking experience.

## Operating Context

The core user journey is:

1. Create an account or sign in.
2. Browse Premier League fixtures.
3. Submit or edit a score prediction before the match locks.
4. Track active predictions and historical predictions.
5. Review transparency, standings, personal statistics, and rules.

The current public experience is centered on the active Premier League season. Administrative capabilities exist mainly as protected backend endpoints for synchronizing league, team, player, fixture, and result data.

The project is already in production. UI and UX improvements should be incremental, compatible with the existing application, and avoid business-rule changes unless explicitly requested.

## Capabilities and Constraints

Implemented capabilities include user registration, JWT login, password recovery by email, authenticated profile management, fixture browsing with filters and pagination, prediction creation/editing/deletion before lock, "Meus Palpites", match prediction transparency, result display, automated score processing, standings, user statistics, and protected administrative synchronization endpoints.

Confirmed product constraints:

- User-facing interface and copy must remain in Brazilian Portuguese.
- The current league focus is the Premier League.
- Fixture and result data are obtained through ESPN APIs.
- Users predict match scores.
- Scoring and ranking must remain clear and easy to understand.
- Existing business rules and functional behavior must not be broken by UI or UX work.
- The current stack is Next.js frontend and NestJS backend.
- There is no complete frontend admin panel in the current version.
- MVP prediction and MVP scoring are modeled but not implemented in the functional prediction flow.
- The data model supports multiple leagues and seasons, but the current product experience focuses on the active Premier League season.

## Brand Commitments

The product name is MatchPredict.

The project already has visual identity and logo assets that must be considered before proposing visual changes:

- `docs/images/MatchPredict.png`
- `frontend/public/MatchPredict.png`
- `frontend/src/app/icon.svg`
- `frontend/src/components/shared/brand-mark.tsx`

Future redesign work should make the application more modern, consistent, pleasant, and professional without descaracterizing MatchPredict.

## Evidence on Hand

Repository evidence includes:

- `README.md`: product overview, stack, architecture, deployment notes, current limitations, and security notes.
- `docs/01-visao-geral.md`: product goals, implemented functionality, architecture summary, central rules, and limitations.
- `docs/02-requisitos-funcionais.md`: implemented functional requirements and out-of-scope functionality.
- `docs/03-regras-de-negocio.md`: business rules for predictions, visibility, scoring, ranking, and synchronization.
- `docs/04-modelagem-do-banco.md`: data model.
- `docs/05-endpoints.md`: API endpoints.
- `docs/06-arquitetura.md`: architecture.
- `docs/07-roadmap.md`: future evolution.
- `frontend/src/features/landing/landing-page.tsx`: current public landing surface and product copy.
- `frontend/src/app/globals.css`: current design tokens and theme variables.

Do not fabricate testimonials, user counts, press, betting claims, prize claims, licensing status, or commercial availability beyond what the repository and user confirm.

## Product Principles

Keep prediction entry fast, obvious, and forgiving before the match locks.

Make scoring, ranking, and transparency understandable without requiring users to inspect technical documentation.

Preserve trust: prediction visibility, lock timing, results, and ranking changes should feel explainable and fair.

Treat MatchPredict as a real consumer product for football fans, while preserving its clean full-stack architecture as supporting evidence.

Evolve the UI incrementally and safely because the project is already in production.

## Accessibility & Inclusion

The product should remain accessible to casual users and Brazilian Portuguese speakers. Future UI work should favor clear language, predictable controls, responsive layouts, and understandable status messaging around prediction availability, match state, scoring, and ranking.
