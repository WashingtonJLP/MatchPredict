---
name: MatchPredict
description: A clean Premier League prediction product with fast score entry, transparent rankings, and field-green status cues.
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
    fontFamily: "Geist, Arial, sans-serif"
    fontSize: "3rem"
    fontWeight: 800
    lineHeight: 1.1
    letterSpacing: "normal"
  headline:
    fontFamily: "Geist, Arial, sans-serif"
    fontSize: "2.25rem"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "normal"
  title:
    fontFamily: "Geist, Arial, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: "normal"
  body:
    fontFamily: "Geist, Arial, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.75
    letterSpacing: "normal"
  label:
    fontFamily: "Geist, Arial, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 700
    lineHeight: 1.4
    letterSpacing: "0.025em"
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

# Design System: MatchPredict

## Overview

**Creative North Star: "The Matchday Control Room"**

MatchPredict should feel like a calm, trustworthy football operations surface: clear enough for a casual fan, structured enough for a competitive ranking product. The existing system uses crisp slate framing, field-green confirmation states, compact cards, and direct Portuguese product copy to keep the prediction loop easy to scan.

The interface is functional before it is decorative. Visual energy comes from score emphasis, ranking movement, trophy and football-adjacent icons, and restrained hover lift rather than large illustrations or ornamental effects. Public pages can be more persuasive, but logged-in surfaces should stay dense, predictable, and work-focused.

**Key Characteristics:**
- Slate authority with green match-state highlights.
- White card surfaces over a pale app canvas.
- Large, bold score and ranking numerals.
- Rounded, touch-friendly controls with visible focus rings.
- Responsive layouts that collapse into stacked cards and horizontal mobile navigation.

## Colors

The palette is a light, product-led football system: deep slate provides authority, field green marks progress and action, and soft blue-gray surfaces keep repeated prediction tasks quiet.

### Primary
- **Pitch Ink**: The main brand and command color for navigation marks, default buttons, hero backgrounds, overlays, and selected sidebar states.
- **Night Pitch**: The dark-mode page background and deepest contrast layer.

### Secondary
- **Field Green**: The accent for calls to action, live/status pills, focus rings, success states, registered predictions, score totals, and key chart data.
- **Deep Field Green**: The stronger success/toast green and secondary chart green.

### Tertiary
- **Goal Amber**: Warning and caution color, especially toast warnings and chart status.
- **Result Red**: Destructive actions, errors, and negative status.
- **Fixture Info Blue**: Informational toast treatment.

### Neutral
- **Match Paper**: Main application background.
- **Card White**: Cards, popovers, navigation bars, and sidebar surfaces in light mode.
- **Score Text**: Default foreground, headings, labels, and strong table content.
- **Quiet Line**: Borders, dividers, table rows, and container outlines.
- **Muted Turf**: Soft panels, skeletons, table headers, hover backgrounds, and closed status pills.
- **Muted Commentary**: Secondary copy, metadata, labels, and inactive navigation.

### Named Rules

**The Green Means Action Rule.** Field Green is reserved for action, success, focus, live status, registered predictions, and important score feedback; do not use it as general decoration.

**The Slate Owns Authority Rule.** Pitch Ink carries brand, navigation selection, hero authority, and primary commands. Avoid introducing another dominant brand hue.

## Typography

**Display Font:** Geist with Arial and sans-serif fallback.
**Body Font:** Geist with Arial and sans-serif fallback.
**Label/Mono Font:** Geist with sans-serif fallback.

**Character:** Geist gives MatchPredict a compact, technical, and modern product voice. The system relies on weight contrast rather than ornate type: very bold scores and headings, medium labels, and relaxed body text.

### Hierarchy
- **Display** (800, 48px to 60px, 1.1): Hero product name and major page titles.
- **Headline** (700, 30px to 36px, 1.2): Section titles and dashboard page headers.
- **Title** (600, 20px, 1.3): Card titles, ranking module titles, and compact section headings.
- **Body** (400, 16px, 1.75): Supporting explanation, fixture descriptions, and empty/error copy. Keep readable prose around 650px.
- **Label** (700, 12px, 0.025em, uppercase when categorical): Table headers, status labels, eyebrow text, score labels, and metadata.

### Named Rules

**The Score Weight Rule.** Scores, points, positions, and stat values should use the boldest weights available because they are the product's fastest-scanned facts.

## Layout

Pages use centered containers with `max-w-6xl` for public content and `max-w-7xl` for app dashboards. The common horizontal padding is 16px on mobile, 24px on small screens, and 32px on large screens. Major public sections use 64px to 96px vertical padding; app pages use tighter 24px to 40px vertical padding.

Grid layouts are pragmatic and responsive. Landing sections move from one column to two or three columns at tablet and desktop sizes. Match cards use a stable three-column score structure with flexible team columns and an auto-sized central score or "VS" block. Tables become card-style definition lists on mobile and full tables from medium screens upward.

Dashboard navigation is a fixed 288px sidebar on large screens, a sticky top bar with horizontal scrolling tabs on mobile, and a drawer for the full mobile menu.

## Elevation & Depth

The system is flat by default with light structural shadows. Depth appears on cards, navigation panels, drawers, dialogs, toast notifications, and hover states; it should support hierarchy and interaction, not create a glossy visual language.

### Shadow Vocabulary
- **Quiet Surface** (`0 1px 2px rgb(15 23 42 / 0.05)`): Default cards, sidebar, brand marks, and compact containers.
- **Interactive Lift** (`0 10px 15px -3px rgb(15 23 42 / 0.10), 0 4px 6px -4px rgb(15 23 42 / 0.10)`): Card hover and elevated action buttons.
- **Overlay Panel** (`0 25px 50px -12px rgb(15 23 42 / 0.25)`): Drawers, modals, and ranking panel emphasis.
- **Toast Lift** (`0 1.25rem 2.5rem -1rem rgb(15 23 42 / 0.35)`): High-priority notification layer.

### Named Rules

**The Lift Confirms Interactivity Rule.** Translation and shadow growth should appear on clickable or scan-focused cards only; static sections stay flat.

## Shapes

The form language is rounded and touch-friendly. Small controls use 8px to 12px corners, while cards, dialogs, score panels, and icon containers use approximately 14px. Fully rounded pills are reserved for status chips and short metadata labels.

Borders are visible but quiet, usually a single 1px Quiet Line stroke. Accent borders appear only when a prediction is registered, a card is hovered, a focus state is active, or a status needs emphasis.

## Components

### Buttons
- **Shape:** Rounded and touch-friendly, usually rounded-xl with a 44px to 48px minimum height.
- **Primary:** Pitch Ink background with white text; used for default commands, account creation, saving predictions, and selected navigation.
- **Accent:** Field Green background with dark green text; used for public calls to action and positive momentum.
- **Hover / Focus:** Hover darkens the fill or introduces a muted background. Focus uses a 3px to 4px Field Green ring at reduced opacity.
- **Secondary / Ghost / Destructive:** Outline and ghost buttons stay neutral until hover. Destructive buttons use red-tinted backgrounds rather than full red blocks unless the action must be unmistakable.

### Chips
- **Style:** Compact rounded-full or rounded-lg labels with bold 12px text, uppercase for status semantics.
- **State:** Field Green chips indicate live, registered, success, or actionable states. Muted chips indicate closed or inactive states.

### Cards / Containers
- **Corner Style:** Soft rounded containers, usually 14px.
- **Background:** Card White on Match Paper; Muted Turf for lower-priority inner panels.
- **Shadow Strategy:** Quiet Surface at rest, Interactive Lift on hover when the card is actionable or ranking-focused.
- **Border:** Quiet Line by default; Field Green border only for hover or registered-prediction emphasis.
- **Internal Padding:** 20px to 24px in app cards, 24px to 32px in public landing cards.

### Inputs / Fields
- **Style:** Score fields are large, centered, and bold with a 56px height, pale background, visible border, and rounded-xl corners.
- **Focus:** Border switches to Field Green and a soft green ring appears.
- **Error / Disabled:** Error states use Result Red borders/rings; disabled controls reduce opacity and remove pointer interaction.

### Navigation
- **Style:** Navigation is sticky or fixed, card-white, and border-led. Desktop public navigation is horizontal and text-based; logged-in navigation uses a fixed sidebar with icon-plus-label links.
- **States:** Active sidebar links use Pitch Ink fill and white text. Mobile tab links use muted backgrounds for active states and horizontal overflow for dense navigation.

### Dialogs
- **Style:** Dialogs sit on a Pitch Ink translucent overlay with blur, use Card White popovers, rounded 14px corners, and Overlay Panel shadow.
- **Behavior:** Escape closes the dialog, outer click dismisses it, and actions stack on mobile before aligning horizontally on larger screens.

### Tables
- **Style:** Desktop tables live inside rounded card containers with muted uppercase headers and divided rows.
- **Mobile:** Tables become bordered cards with label/value definition rows for readability.

## Do's and Don'ts

### Do:
- **Do** keep user-facing copy in Brazilian Portuguese.
- **Do** use Field Green for prediction success, focus, ranking emphasis, and primary public momentum.
- **Do** keep prediction entry controls large, centered, and obviously editable before lock.
- **Do** preserve the slate/green/white identity when adding new screens.
- **Do** use cards and tables for scan-heavy app workflows rather than marketing-style compositions.

### Don't:
- **Don't** add betting, prize, commercial, testimonial, or press claims that the product context does not confirm.
- **Don't** turn Field Green into a decorative background pattern or secondary brand world.
- **Don't** replace the functional dashboard density with oversized hero treatments.
- **Don't** introduce a second typeface unless the product identity is intentionally redesigned.
- **Don't** hide lock timing, prediction status, or ranking consequences behind vague labels.
