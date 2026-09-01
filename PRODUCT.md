# Tailchat Product Context

Tailchat is a plugin-first collaboration platform where messaging is the core
workflow. The interface must keep conversations, groups, people, and extension
surfaces easy to scan while supporting dense administrative and operational
tasks.

## Interface authority

- Use official Shadcn/UI components and Base UI behavior as the default web
  component grammar. Keep local wrappers thin, semantic, and accessible.
- Preserve Tailchat's established dark operator-console identity: blue-black
  grounds, charcoal surfaces, cool-blue emphasis, restrained one-pixel
  boundaries, compact neutral typography, and Lucide-style outline icons.
- Prefer clear hierarchy and information density over decorative effects.
  Avoid glows, glass panels, gradient text, ornamental grids, and unnecessary
  motion.
- Desktop navigation may remain persistently visible. Mobile navigation must be
  a dismissible drawer with both an explicit close control and backdrop
  dismissal.
- Dense data tables may scroll horizontally on narrow screens, but the page
  itself must not overflow. Overflow chrome must stay visually integrated with
  the dark surface system.
- Every shared control, action label, empty state, confirmation, and pagination
  affordance must follow the active locale.

## Migration boundary

New and migrated web UI should not add Ant Design, Arco Design, Tushan, or
framework-specific legacy styling. Compatibility code may remain only at an
external plugin contract boundary and must render through the modern local
design system wherever practical.
