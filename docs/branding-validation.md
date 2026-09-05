# Anchor Chat rebrand validation — 2026-09-05

Source branch: `feat/anchor-chat-branding`, based on `79b30ef0` (v1.29.1).
These are local results, not a production deployment or a desktop upgrade.

| Check | Result |
| --- | --- |
| `pnpm --dir client/web check:type` | Passed |
| `pnpm --dir server check:type` | Passed |
| `pnpm --dir client/web build` | Passed, including all MiniStar frontend plugins |
| `pnpm --dir client/web build:webpack` after the visual corrections | Passed |
| `pnpm build:admin` | Passed, client and server; client rebuilt after the footer correction |
| `pnpm run build:web` in each of the IAM, Agora and Meeting server plugins | Passed |
| `corepack yarn build:main` and `corepack yarn build:renderer` in `client/desktop` | Passed |
| Focused web tests | 13 passed across branding defaults, entry forms and BASsie popover |
| `corepack yarn test --runInBand src/__tests__/App.test.tsx` in `client/desktop` | 3 passed |
| Unsigned Windows unpacked package | Assembled successfully with `electron-builder --win --dir --publish never` |
| Package/PWA/plugin compatibility checks | Passed |
| Changed email/OIDC templates | All four EJS templates compile |
| Design detector on changed visual surfaces | No findings |
| Asset provenance scan on the four changed PNG assets | Passed |

Exact focused web test command:

```powershell
pnpm --dir client/web exec jest --runInBand ../shared/utils/__tests__/branding.spec.ts src/routes/Entry/components/__tests__/Form.spec.tsx plugins/com.msgbyte.ai-assistant/src/__tests__/AssistantPopover.spec.tsx
```

The local environment has no standalone `yarn` shim; use `corepack yarn`.
`pnpm test --runInBand` was rejected by this workstation's pnpm argument parser;
the explicit `exec jest` invocation above completed successfully.

## Visual evidence

The entry screen, admin sign-in and Electron launcher renderer were captured
at 1440 × 1000 and 390 × 844. All six captures fit without horizontal page
overflow. The screenshot files are under `.impeccable/review/`, named
`anchor-chat-{desktop,mobile}.png`,
`anchor-chat-admin-{desktop,mobile}.png` and
`anchor-chat-launcher-{desktop,mobile}.png`.

The preview serves the real production bundles and local plugin assets, with
backend writes disabled. Fresh browser contexts blocked service workers to
avoid cached translations and assets from earlier builds. No production
credentials were entered during the initial entry-screen review.

On 2026-09-06, a disposable localhost backend ran the current source against
isolated MongoDB 6, Redis 7 and MinIO containers. A test account registered through
the service API and signed in through the normal email/password UI. The logged-in
navbar, account session copy, About page and system settings showed Anchor Chat
and STC Worldwide correctly. The session survived a page reload. Desktop
(1440 × 1000) and mobile (390 × 844) captures are retained as
`anchor-chat-{auth,about,settings}-{desktop,mobile}.png` in `.impeccable/review/`.
Mobile About and settings content wrapped within the viewport with vertical
scrolling; the navigation capture had no horizontal page overflow.

BASsie remains subject to the existing `isOffical` activation condition. It was
not activated for the local STC-style test deployment; its component test and
plugin build coverage do not establish a live assistant-backend result.

The finish review found one material issue: Tailwind merged the custom
`text-primary` utility with its built-in definition, overriding the brighter
dark text color. A trailing scoped utility-layer rule now applies that color.
The recovery link renders at RGB(119, 183, 192), approximately **6.50:1** against
the sampled dark background. Filled actions retain the approved teal and
white foreground. The entry captures were replaced after this correction.

The independent reviewer scored that single fix **resolved** and returned
`ship` at the verdict-pass scope. This is a UI review result, not a release.

## Desktop and compatibility evidence

The assembled Windows executable remains `Tailchat.exe`. Its resources report
**ProductName: Anchor Chat**, **CompanyName: STC Worldwide**, and
**ProductVersion: 0.1.0.0**. Authenticode reports **NotSigned**.

The packaged app manifest still names `tailchat-desktop` and has no new
`productName` field. The Electron main process is byte-for-byte unchanged from
the branch base; it does not relocate profile/session paths. The existing app
ID is `com.stcworldwide.tailchat`.

The comparison also confirmed unchanged package names, dependency maps,
versions, repositories, PWA identity and icon URLs, and plugin IDs, URLs,
versions and activation settings. The 32, 192 and 512 pixel PWA icons have
matching PNG dimensions and MIME types.

Task-owned build/verification material is retained under
`.tmp/anchor-chat-branding/` and locally excluded from Git. It includes the
unpacked Windows package, `verify.cjs`, and
`windows-package-evidence.json` with the exact executable size and SHA-256.
It is a local build artifact, not an installer release.

Earlier cleanup attempts were rejected before execution with `blocked by policy`;
the tool did not expose the specific rejecting rule. On 2026-09-06, after Tim
updated the session permissions, the same scoped PowerShell cleanup succeeded
through the supported one-time approval route. All seven disposable files were
verified absent: `apply.cjs`, `followup.cjs`, `visual-fix.cjs`,
`translations-before.json`, and the three intermediate PNGs under `icons/`.
The preview and verification helpers, package evidence, and unpacked Windows
build were verified present after cleanup.

## Limits

The builds emit dependency/tooling warnings: outdated Browserslist data,
ts-jest's TypeScript support range, bundle-size advisories, plugin circular or
optional-import warnings, and the CSS minimizer's handling of Tailwind's
`infinity * 1px`. They did not fail the builds.

At this local validation stage, no macOS package build, actual installation/upgrade,
live assistant request, authenticated production smoke test, version bump or
release was performed. Follow the release and disposable upgrade checks in
[branding.md](branding.md) before publishing.
