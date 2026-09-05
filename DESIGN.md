---
name: Anchor Chat
description: The Anchor identity within an established compact collaboration interface.
colors:
  primary: "#087c8c"
  primary-hover: "#066675"
  primary-foreground: "#ffffff"
  primary-text-dark: "color-mix(in srgb, var(--tc-primary-color) 55%, white)"
  navbar-light: "oklch(86.9% 0.022 253)"
  sidebar-light: "oklch(92.9% 0.013 256)"
  content-light: "oklch(96.8% 0.007 248)"
  raised-light: "#ffffff"
  body-light: "oklch(37.2% 0.044 257)"
  navbar-dark: "oklch(12.9% 0.042 265)"
  sidebar-dark: "oklch(20.8% 0.042 266)"
  content-dark: "oklch(27.9% 0.041 260)"
  raised-dark: "oklch(37.2% 0.044 257)"
  body-dark: "oklch(93% 0.006 256 / 0.92)"
typography:
  body:
    fontFamily: "-apple-system, BlinkMacSystemFont, Helvetica Neue, PingFang SC, Microsoft YaHei, Source Han Sans SC, Noto Sans CJK SC, WenQuanYi Micro Hei, sans-serif"
  message:
    fontSize: "15px"
    lineHeight: "22px"
  message-compact:
    fontSize: "14px"
    lineHeight: "20px"
  label:
    fontSize: "0.875rem"
    fontWeight: 500
    lineHeight: "1.25rem"
rounded:
  md: "0.375rem"
  lg: "0.5rem"
  xl: "0.75rem"
  badge: "2rem"
spacing:
  "2": "0.5rem"
  "2.5": "0.625rem"
  "3": "0.75rem"
  "4": "1rem"
  "6": "1.5rem"
  "8": "2rem"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.primary-foreground}"
    typography: "{typography.label}"
    rounded: "{rounded.lg}"
    height: "2rem"
    padding: "0 0.625rem"
  input:
    rounded: "{rounded.lg}"
    height: "2rem"
    padding: "0.25rem 0.625rem"
  card:
    rounded: "{rounded.xl}"
    padding: "1rem"
  badge:
    rounded: "{rounded.badge}"
    height: "1.25rem"
    padding: "0.125rem 0.5rem"
---

# Design System: Anchor Chat

## Overview

**Creative North Star: "Operator console"**

Anchor Chat by STC Worldwide retains the compact, task-oriented interface described in [PRODUCT.md](PRODUCT.md). Blue-black and slate surfaces, neutral system typography, restrained boundaries, and outline icons keep conversations and controls easy to scan. The approved white Anchor family mark and teal action color supply the identity; BASsie names the shared assistant.

This is a record of the existing interface after a branding extension, not a redesign. The frontmatter records shared identity and core web defaults. Admin and the Electron launcher retain their own established theme values and sizing. [The branding contract](docs/branding.md) owns naming and compatibility details.

**Key Characteristics:**

- Compact controls and optional compact message density.
- Theme-aware web surfaces with restrained teal emphasis.
- Persistent desktop navigation and dismissible mobile navigation.

Source authority: [web tokens](client/web/src/styles/tailwind.css), [entry layout](client/web/src/routes/Entry/index.tsx), [navbar](client/web/src/routes/Main/Navbar/index.tsx), [BrandMark](client/web/src/components/BrandMark.tsx), [official controls](client/web/src/components/ui/official), [launcher styles](client/desktop/src/renderer/App.css), and [admin styles](server/admin-next/src/client/styles.css). [Validation evidence](docs/branding-validation.md) covers desktop/mobile entry, admin sign-in, and launcher captures. Authenticated layouts are documented from source, not visually verified in this rebrand. The review resolved its single contrast finding; it does not establish a release.

## Colors

### Primary

Anchor teal identifies the family mark and filled primary actions, paired with white labels. Dark web text accents use the brighter mixed teal recorded as `primary-text-dark`; filled actions keep the solid primary token. The reviewed recovery link sampled as `#77b7c0` against `#1c293d` (6.50:1), as recorded in the validation evidence. This sample is not a replacement token.

### Neutral

The web palette steps from the navigation ground through sidebar and content to raised surfaces, with light and dark assignments in the frontmatter. Components consume runtime semantic variables so theme plugins and light/dark switching continue to work. Muted text and control boundaries retain their separate existing tokens.

Admin retains its charcoal ground (`#0b0e14`) and panel (`#12151d`); the launcher retains its blue-black ground (`#0b1020`) and card (`#121a2d`). Their common teal identity does not require identical neutral palettes. Existing danger, warning, success, and state colors retain their semantic roles.

**The Action and Text Rule.** Use the filled-action token for button backgrounds and the theme-aware text-accent token for web links; preserve white labels on filled primary actions.

## Typography

Use the incumbent system stacks. Core web includes CJK fallbacks; admin and launcher use their own system stacks in the linked stylesheets. There is no added display typeface. Web headings follow the existing 24/20/18-pixel hierarchy; controls generally use 14-pixel medium labels. Message typography and its compact alternative are recorded in the frontmatter. Navigation bylines remain quieter and smaller than product names.

## Layout

Core web uses a full-height application layout with independently scrolling regions. The standard sidebar is 16rem wide, with a 3rem collapsed rail and an 18rem mobile drawer. Entry uses a single full-width form region below 768px; above that breakpoint the form region is 34rem wide beside a flexible brand/image area. Form content is capped at 28rem, with 24px padding increasing to 32px at 640px.

The launcher centers its header, server grid, and footer within 42rem, stacking server cards and footer actions below 520px. Admin preserves its 260px desktop sidebar and switches to a dismissible drawer at 940px. Keep dense tables' horizontal scrolling inside their containers. These are surface-specific behaviors, not one universal breakpoint system.

## Elevation & Depth

Tonal steps and thin boundaries supply most hierarchy. Existing cards use a subtle ring; inset web content and floating navigation may use small shadows. Admin overlays and toasts use the existing structural shadow. Retain established overlay behavior without adding decorative glow or glass effects. The sidecar carries extracted shadow and motion values, including web/admin reduced-motion overrides.

## Shapes

Core web controls use gently rounded corners, cards use the larger corner step, and badges use a pill silhouette. Preserve each surface's existing radius scale; admin and launcher define separate scales. Use the approved mark asset without redrawing, recoloring, stretching, or replacing its white anchor silhouette.

## Components

- **Buttons:** reuse the official primary, outline, secondary, ghost, destructive, and link variants. Core web defaults to 32px height; entry forms may enlarge controls. Preserve hover, visible focus, disabled, and invalid states. Core web primary hover uses an 80% primary fill; the darker hover token remains available to existing consumers such as admin.
- **Inputs:** compact, outlined controls with theme-aware boundaries and a visible teal focus ring. Core web uses 16px input text on narrow screens and 14px from 768px. Preserve labels, invalid feedback, and disabled treatment.
- **Cards and badges:** raised surfaces with a light boundary for grouping; compact badges for labels or state. Do not turn every row into a card.
- **Navigation:** compact icon-and-label rows, tonal hover/selected states, truncated long names, and a collapsible desktop rail. Mobile drawers keep both explicit close and backdrop dismissal.
- **Brand mark:** use `BrandMark` beside the product/server name and attribution. Its empty alternative text is intentional when adjacent text supplies the name. The entry header uses a 36px mark; the navbar uses 28px; the desktop entry illustration uses 160px. Preserve custom server names and the shared STC attribution.

## Do's and Don'ts

### Do:

- Do use Anchor Chat by STC Worldwide and BASsie consistently.
- Do reuse the approved white Anchor family mark and existing semantic theme variables.
- Do preserve compact hierarchy, locale-aware labels, visible focus, and mobile drawer dismissal.

### Don't:

- Don't name this repository's Electron client Anchor Desktop; it is the Anchor Chat client.
- Don't add decorative glows, glass panels, gradient text, ornamental grids, or unnecessary motion.
- Don't promote screenshot samples or sidecar preview ramps into new production tokens.
