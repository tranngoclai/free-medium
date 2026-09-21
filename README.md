# FreeMedium

Chrome extension (Manifest V3) that lets you read paywalled Medium articles via the [Freedium](https://freedium-mirror.cfd) mirror, without leaving the Medium page.

## Demo

**1. A member-only story on Medium** — the floating **Read for free** button appears bottom-right.

![Member-only story on Medium with the Read for free button](docs/screenshots/01-medium-member-only-original.jpg)

**2. Same tab, one click later** — the article is rendered from Freedium inside a full-screen overlay. **Show original** toggles back to Medium.

![Article unlocked inside the Freedium overlay](docs/screenshots/02-freedium-overlay-unlocked.jpg)

## How it works

- On any Medium article a floating **Read for free** button appears; the article is loaded from Freedium inside a full-screen overlay.
- Article pages open the overlay automatically; home, tag and profile pages keep it closed.
- The Freedium iframe is prefetched at `document_start`, so it is usually ready by the time the page is.
- Medium's SPA navigation (`history.pushState`) is tracked so the overlay follows you from the feed into an article.
- Works on `medium.com`, `*.medium.com` and custom-domain Medium publications.

## Install (unpacked)

1. Clone this repo.
2. Open `chrome://extensions`, enable **Developer mode**.
3. Click **Load unpacked** and select the repo folder.

## Self-hosted auto-updates

Unpacked extensions never auto-update. Every `v*` tag runs the [Release workflow](.github/workflows/release.yml), which packs a signed `.crx`, attaches it to a GitHub Release and publishes the update site to **https://freemedium.tranlight.dev**:

| File | Purpose |
|---|---|
| `updates.xml` | Omaha update manifest Chrome polls (`update_url` in `manifest.json`) |
| `free-medium-<version>.crx` | Signed package referenced by `updates.xml` |

- Extension ID: `ikbpjibhddfjalgppjekkmdihdfpnpbk` (derived from the signing key, stored as the `CRX_PRIVATE_KEY` repo secret — never commit the `.pem`).
- Release: bump `version` in `manifest.json`, commit, then `git tag v<version> && git push --tags`. The workflow fails if the tag and manifest disagree.
- Local dry run: `UPDATE_HOST=https://freemedium.tranlight.dev scripts/build-release-site.sh key.pem site`.

Chrome on macOS/Windows only installs and updates off-store `.crx` files through enterprise policy. The free route is [Chrome Enterprise Core](https://support.google.com/chrome/a/answer/9116814): enroll the browser, then add the extension by ID with update URL `https://freemedium.tranlight.dev/updates.xml` under *Apps & extensions*.

## Project layout

```
manifest.json
src/
  shared-constants.js       host, element IDs, labels, event names
  medium-page-detection.js  is this Medium? is this an article?
  freedium-connection.js    URL rewriting + preconnect
  overlay-ui.js             OverlayUi class (button, overlay, iframe, loader)
  content.js                entry point: prefetch → SPA sync → init
  medium-history-hook.js    MAIN-world patch of history.pushState/replaceState
  freedium-frame.js         runs inside the Freedium iframe, dismisses its "Support" modal
styles/overlay.css
images/
scripts/build-release-site.sh   pack .crx + generate updates.xml (used by CI)
.github/workflows/release.yml   tag → GitHub Release + Pages deploy
```

Content scripts can't use ES modules, so the isolated-world scripts share a `globalThis.FreeMedium` namespace and are loaded in the order listed in `manifest.json`.

## Disclaimer

For personal/educational use. Please support writers you enjoy by subscribing to Medium.
