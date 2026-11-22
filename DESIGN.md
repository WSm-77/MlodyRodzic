---
name: MłodyRodzic Gov-Care
colors:
  surface: '#f9f9ff'
  surface-dim: '#cfdaf2'
  surface-bright: '#f9f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f0f3ff'
  surface-container: '#e7eeff'
  surface-container-high: '#dee8ff'
  surface-container-highest: '#d8e3fb'
  on-surface: '#111c2d'
  on-surface-variant: '#454651'
  inverse-surface: '#263143'
  inverse-on-surface: '#ecf1ff'
  outline: '#757682'
  outline-variant: '#c5c5d3'
  surface-tint: '#4758aa'
  primary: '#213585'
  on-primary: '#ffffff'
  primary-container: '#3b4d9e'
  on-primary-container: '#bac4ff'
  inverse-primary: '#b9c3ff'
  secondary: '#a73733'
  on-secondary: '#ffffff'
  secondary-container: '#fd776f'
  on-secondary-container: '#710e11'
  tertiary: '#043d6f'
  on-tertiary: '#ffffff'
  tertiary-container: '#285588'
  on-tertiary-container: '#a5caff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dde1ff'
  primary-fixed-dim: '#b9c3ff'
  on-primary-fixed: '#001256'
  on-primary-fixed-variant: '#2d4090'
  secondary-fixed: '#ffdad6'
  secondary-fixed-dim: '#ffb3ad'
  on-secondary-fixed: '#410003'
  on-secondary-fixed-variant: '#871f1f'
  tertiary-fixed: '#d3e3ff'
  tertiary-fixed-dim: '#a3c9ff'
  on-tertiary-fixed: '#001c39'
  on-tertiary-fixed-variant: '#17487a'
  background: '#f9f9ff'
  on-background: '#111c2d'
  surface-variant: '#d8e3fb'
typography:
  headline-xl:
    fontFamily: Inter
    fontSize: 3rem
    fontWeight: '700'
    lineHeight: 3.5rem
    letterSpacing: -0.025em
  headline-xl-mobile:
    fontFamily: Inter
    fontSize: 2rem
    fontWeight: '700'
    lineHeight: 2.5rem
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 2.25rem
    fontWeight: '700'
    lineHeight: 2.75rem
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 1.625rem
    fontWeight: '700'
    lineHeight: 2.125rem
    letterSpacing: -0.015em
  headline-md:
    fontFamily: Inter
    fontSize: 1.5rem
    fontWeight: '600'
    lineHeight: 2rem
    letterSpacing: -0.015em
  headline-sm:
    fontFamily: Inter
    fontSize: 1.25rem
    fontWeight: '600'
    lineHeight: 1.75rem
    letterSpacing: -0.01em
  body-lg:
    fontFamily: Inter
    fontSize: 1.125rem
    fontWeight: '400'
    lineHeight: 1.75rem
    letterSpacing: -0.005em
  body-md:
    fontFamily: Inter
    fontSize: 1rem
    fontWeight: '400'
    lineHeight: 1.5rem
    letterSpacing: '0'
  body-sm:
    fontFamily: Inter
    fontSize: 0.875rem
    fontWeight: '400'
    lineHeight: 1.375rem
    letterSpacing: '0'
  label-lg:
    fontFamily: Inter
    fontSize: 0.9375rem
    fontWeight: '600'
    lineHeight: 1.25rem
    letterSpacing: 0.01em
  label-md:
    fontFamily: Inter
    fontSize: 0.8125rem
    fontWeight: '600'
    lineHeight: 1.125rem
    letterSpacing: 0.02em
  label-sm:
    fontFamily: Inter
    fontSize: 0.75rem
    fontWeight: '600'
    lineHeight: 1rem
    letterSpacing: 0.03em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1.25rem
  gutter-desktop: 2rem
  margin: 1rem
  margin-desktop: 3rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2.5rem
---

## Brand & Style

### Personality & Core Vision
The design system bridges official civic reliability with nurturing parental empathy. It serves exhausted, time-poor parents navigating critical family milestones, administrative procedures, healthcare filings, and child allowances. The emotional tone avoids cold institutional bureaucracy while preserving unquestioned trust, legal certainty, and clarity.

### Style Archetype: Human-Centric Institutionalism (Gov-Civic Warmth)
Drawing from leading public digital standards (such as gov.uk, gov.pl, and USWDS) and modern family-care services:
- **Utmost Cognitive Relief:** Reduced visual noise, generous touch targets, clear sequential steps, and zero ambiguity.
- **Calm Authority:** Authoritative indigo blue balanced with caring coral-peach accents to soften legal procedures into welcoming rituals.
- **Accessibility by Default:** Built to fulfill WCAG 2.1 AAA contrast ratios across text, form controls, and iconography, ensuring readability in sleep-deprived conditions or one-handed mobile usage.

## Colors

The color palette directly honors the reference aesthetic: a rich indigo-cobalt foundation paired with welcoming warm coral accents and soft supportive tones.

### Functional Palette Mapping
- **Primary (`#3B4D9E` - Trust Indigo):** Key interactive buttons, official headers, active step markers, and verified trust badges. Provides institutional assurance without clinical coldness.
- **Secondary (`#F47068` - Warm Coral Peach):** Primary action callouts, high-priority notifications, care-related progress milestones, and empathetic accent details.
- **Tertiary (`#7BA4DC` - Soft Sky Blue):** Informational banners, secondary tags, assistive guides, and calm section dividers.
- **Neutral Dark (`#1E293B` - Deep Slate Navy):** Used for primary typography, crisp border contours, and high-legibility icons.
- **Canvas & Surface Tones:**
  - Base Background: `#F8FAFC` (Slate Tint White) to eliminate harsh screen glare.
  - Card & Container Surface: `#FFFFFF` (Pure White).
  - Subtle Recessed Tiers: `#F1F4F9` for form field wells and step indicator backdrops.
- **State Semantics:**
  - Success / Approved: `#15803D` (Subdued Forest) with `#DCFCE7` tint.
  - Warning / In Review: `#B45309` (Amber Glow) with `#FEF3C7` tint.
  - Critical / Action Required: `#B91C1C` (Crimson Alert) with `#FEE2E2` tint.

## Typography

The type system prioritizes unambiguous legibility and institutional authority through Inter. With tall x-heights, distinct open counters, and optical compensation, Inter excels under rapid skimming on mobile devices.

### Typographic Principles
- **Strict Hierarchy:** Section titles, process guides, and inputs follow deliberate vertical scaling.
- **Tabular Figures:** All numeric displays (dates of birth, PESEL, bank accounts, processing timelines) utilize `font-variant-numeric: tabular-nums` to guarantee vertical scan alignment.
- **Reading Comfort:** Body copy maintains a strict 60–75 character measure with generous line heights to prevent cognitive fatigue.

## Layout & Spacing

The layout is built upon an 8pt mathematical rhythm tailored to high-density administrative workflows that gracefully collapse into thumb-accessible mobile layouts.

### Grid Architecture
- **Mobile (< 768px):** 4-column fluid layout, `1rem` outer margin, `1.25rem` gutter. Primary actions remain sticky within the bottom ergonomic thumb zone (min 48px target).
- **Tablet (768px – 1024px):** 8-column layout, `1.5rem` margins, `1.5rem` gutters.
- **Desktop (> 1024px):** 12-column layout maxing out at `1280px` canvas width, with `3rem` margins and `2rem` gutters. Official forms anchor in a focused 8-column center column with contextual step summaries on the side.

### Spacing Application
- `space-xs` (4px): Micro gaps between icons and labels, badge internal paddings.
- `space-sm` (8px): Gaps between form labels and input fields; tight list items.
- `space-md` (16px): Standard padding within standard cards, stacked field groups.
- `space-lg` (24px): Card paddings on desktop; separation between distinct form sections.
- `space-xl` (40px): Major structural breaks between application chapters.

## Elevation & Depth

This design system avoids excessive floating drop shadows in favor of structured public-sector discipline reinforced by subtle, tactile warmth.

### Elevation Layers
- **Level 0 (Flat / Canvas):** Neutral `#F8FAFC` background.
- **Level 1 (Structural Surfaces & Default Cards):** Pure `#FFFFFF` fill with a crisp `1px solid #E2E8F0` border. No shadow is required on static cards; borders provide high-contrast spatial demarcation.
- **Level 2 (Interactive Floating & Step Trackers):** Applied to active cards, dropdown menus, and date-pickers: `0 4px 12px -2px rgba(59, 77, 158, 0.08), 0 2px 4px -1px rgba(30, 41, 59, 0.04)`. The indigo tint gives depth without looking stark or muddy.
- **Level 3 (Modal Dialogs & Decision Overlays):** Used for official submission confirmations and alert sheets: `0 16px 32px -8px rgba(30, 41, 59, 0.12), 0 4px 8px -2px rgba(59, 77, 158, 0.06)`, framed with a distinct `1px solid #CBD5E1` boundary.

## Shapes

The design system applies a **Rounded (Level 2)** shape standard. Corners use `0.5rem` (8px) as the structural standard, scaling up to `1rem` (16px) for elevated cards and application containers.

### Shape Hierarchy
- **Inputs & Action Buttons (`0.5rem` / 8px):** Retains precise alignment with text baselines while softening sharp administrative edges.
- **Cards, Form Fieldsets & Dialogs (`1rem` / 16px):** Produces a friendly, contained appearance reminiscent of modern physical documents and friendly booklet layouts.
- **Status Tags & Badges (`9999px` / Full Pill):** Used exclusively for status chips (e.g., "Wniosek złożony", "Wymaga podpisu", "Aktywna Karta") to clearly differentiate state metadata from actionable buttons.

## Components

### Buttons
- **Primary Action (Trust Indigo):** Solid `#3B4D9E` fill with `#FFFFFF` text. Minimum height `48px` on mobile, `8px` corner radius. Focus state uses a `3px` visible ring in `#7BA4DC` with a `2px` offset.
- **Urgent / Care Action (Warm Coral):** Solid `#F47068` fill with `#FFFFFF` text for immediate milestones like "Złóż wniosek" or "Zgłoś narodziny".
- **Secondary / Gov Outline:** Transparent fill, `2px solid #3B4D9E` border, `#3B4D9E` text.
- **Tertiary / Link:** Ghost style with underlined text and bold arrow indicators for document downloads.

### Input Fields & Controls
- **Text & Numeric Inputs:** Solid `#FFFFFF` fill, `1.5px solid #CBD5E1` border, 48px height, `8px` rounded corners. Active focus converts border to `2px solid #3B4D9E` with subtle ambient ring.
- **Validation Messages:** Positioned directly beneath the input with high-contrast text and a small SVG indicator (Check or Warning circle).
- **Checkboxes & Radios:** Scaled to `22px x 22px` for tap safety; selected state is saturated in `#3B4D9E` with a bold white checkmark.

### Cards & Application Status Panes
- Structured white containers with `16px` radius and `1px solid #E2E8F0` border.
- Features a designated left status indicator stripe (4px width): Indigo for in-progress, Forest Green for approved, Amber for missing documents.
- Includes a prominent badge, an unambiguous headline (e.g., "Świadczenie Wychowawcze 800+"), submission timestamp, and direct CTA.

### Step-by-Step Flow (Wizard)
- Horizontal step bars on desktop, compact horizontal carousel or segmented counter on mobile ("Krok 2 z 4").
- Completed steps display a solid `#3B4D9E` circular disc with white checkmark; current step displays an indigo outline with a pulsing center indicator; upcoming steps remain neutral `#E2E8F0`.

### Chips & Badges
- Pill-shaped (`rounded-full`), padded with `4px 12px`.
- High-contrast text matching tinted semantic backgrounds (e.g., `#EEF2FF` background with `#3B4D9E` text for institutional notices; `#FFF1F0` background with `#C53B32` for action-required notices).

### Informational Alerts & Guidance Banners
- Non-intrusive full-width or card-level notices with a `4px` left accent border.
- Features dedicated, friendly helper copy providing plain-language legal context for parenting allowances, medical documentation, or civil registry certificates.
