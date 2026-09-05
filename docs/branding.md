# Anchor Chat by STC Worldwide

Anchor Chat is the STC Worldwide chat product, based on the Tailchat fork.
The shared AI assistant is **BASsie**, independent of its model or provider.
Anchor Desktop is a separate product; the Electron shell in this repository is
the desktop client for **Anchor Chat**.

This branch implements the rebrand. It is not a release or a production migration.

## Presentation

`client/shared/utils/branding.ts` owns the core web names and legacy default-name
handling. Empty names and the old `Tailchat` default display as Anchor Chat;
custom server names are preserved. The app title includes Anchor Chat even when
a deployment has its own name. The entry header, navigation, About panel and
admin show the STC Worldwide attribution.

The white anchor on teal (`#087c8c`) is the approved Anchor family mark from
`../stcdesk/public/anchor.svg`. Its source is copied to
`client/web/assets/images/logo.svg`, `client/desktop/assets/icon.svg`, and the
existing admin asset path. Web icons are rendered at 32, 192 and 512 pixels from
that vector. Desktop PNG, ICO and ICNS assets use the approved Anchor Desktop
exports of the same mark. This is asset reuse, with no image-model generation.

The existing light/dark surfaces, system typography, layout, controls, keyboard
behavior and plugin theme overrides remain the interface authority. Default
actions use the Anchor teal accent. BASsie labels and request identity belong
to the existing assistant plugin; its ID, activation rules and service endpoint
are unchanged. The rebrand does not provision a new assistant backend or enable
that plugin on additional deployments.

## Compatibility contract

Keep these names and values stable:

- Repository `STC-Worldwide/tailchat`, package/workspace names, SDK names and exports.
- Deployment `https://chat.stc-worldwide.com`, `/opt/tailchat`, GHCR image names,
  MongoDB/Redis/MinIO identities, volumes and credentials.
- `tailchat.manifest`, API routes, socket/IPC events, `_isTailchat`, plugin IDs,
  persisted server records, localStorage keys and authentication data.
- PWA `start_url`, icon URLs, scope and service worker behavior. Correct the
  512-pixel icon's MIME type to `image/png`; its URL and dimensions stay stable.
- Electron app ID `com.stcworldwide.tailchat`, runtime package name
  `tailchat-desktop`, and Windows executable `Tailchat.exe`. The release app
  manifest deliberately does not introduce `productName`, and the main process
  does not call `app.setName` or relocate `userData`/`sessionData`. Changing the
  electron-builder display name must not create a fresh profile.
- Release versions and updater/signing configuration. STC artifacts remain
  unsigned until STC has its own signing identity.

The desktop launcher's built-in server points to STC. User-added servers and
their URLs remain intact. Help and project links point to STC; the About page
retains an explicitly labelled upstream attribution. Historical documentation
and third-party integration names may still say Tailchat.

## Verification and release

Run the core web type check, branding/entry/assistant component tests, full web
build (including MiniStar plugins), server type check, admin build and Electron
renderer/main build and launcher tests. Regenerate core translations with
`node build/script/scanTranslation.js` and
`node build/script/buildPublicTranslation.js` from `client/`. The public locales
are ignored build output in this checkout and are rebuilt by webpack.

Inspect the real entry screen at desktop and mobile sizes, admin sign-in, and
the desktop launcher. Before releasing desktop packages, run the existing
Windows/macOS build workflow and a disposable upgrade check that compares the
old/new profile path, saved servers, cookies and window state. No installation,
version bump, publication or production configuration write is part of this
source change. Release through [the STC runbook](../deploy/stc/README-STC.md).
