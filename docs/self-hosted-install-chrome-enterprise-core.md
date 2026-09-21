# Installing FreeMedium from the self-hosted update URL (Chrome Enterprise Core)

Chrome on macOS/Windows refuses to install or auto-update `.crx` files that are not
from the Chrome Web Store unless the browser is enterprise-managed. Chrome Enterprise
Core (CEC) is Google's free browser-management tier and counts as "managed" without
any MDM. One-time setup is ~30–60 minutes; afterwards every `v*` tag of this repo
reaches your browsers automatically.

What you need:

- A domain you control (DNS access) — used to create the Google admin account.
- Admin (sudo) access on each Mac you enroll.

Reference values for this repo:

| | |
|---|---|
| Extension ID | `ikbpjibhddfjalgppjekkmdihdfpnpbk` |
| Update URL | `https://freemedium.tranlight.dev/updates.xml` |

---

## 1. Create a Chrome Enterprise Core account

1. Open <https://enterprise.google.com/chrome/chrome-browser-cloud-management/> and click **Sign up** (free).
   - If you already have a Google Workspace / Cloud Identity admin account for the
     domain, skip to step 3 and enable it from **Admin console → Billing → Buy or
     upgrade → Chrome Enterprise Core → Get started**.
2. Choose **Domain-verified** and enter your domain (e.g. `tranlight.dev`). Google asks
   you to prove ownership with a DNS **TXT** record (`google-site-verification=…`).
   Add it at your DNS provider (Cloudflare: *DNS only*, TTL auto), wait a few minutes,
   click **Verify**.
3. Finish the wizard. You now have a Super Admin account like `admin@tranlight.dev`
   and access to <https://admin.google.com>.

## 2. Generate a browser enrollment token

1. Admin console → **Menu ☰ → Chrome browser → Managed browsers**
   (older consoles: **Devices → Chrome → Managed browsers**).
2. Leave the top-level organizational unit selected, click **Enroll**.
3. **Copy enrollment token to clipboard** → **Done**. Keep it somewhere safe; it is
   reusable for every browser you want to enroll.

## 3. Enroll Chrome on macOS (no MDM needed)

The token must be at the device level, so it needs `sudo`:

```bash
sudo mkdir -p /Library/Google/Chrome
echo "PASTE_TOKEN_HERE" | sudo tee /Library/Google/Chrome/CloudManagementEnrollmentToken >/dev/null
sudo chmod 644 /Library/Google/Chrome/CloudManagementEnrollmentToken
```

Quit Chrome completely (⌘Q) and reopen it. Verify:

- `chrome://management` shows *Your browser is managed by tranlight.dev*.
- `chrome://policy` lists a **Cloud machine** policy source.
- Admin console → **Managed browsers** now lists this Mac (may take a minute).

Optional: to stop Chrome from starting unmanaged when enrollment fails, also create
`/Library/Google/Chrome/CloudManagementEnrollmentOptions` containing the text
`Mandatory` (no file extension). Not needed for personal use.

Windows equivalent (run as admin):

```powershell
reg add HKLM\SOFTWARE\Policies\Google\Chrome /v CloudManagementEnrollmentToken /t REG_SZ /d "PASTE_TOKEN_HERE" /f
```

## 4. Add the extension from the custom update URL

1. Admin console → **Menu ☰ → Chrome browser → Apps & extensions → Users & browsers**
   tab (older consoles: **Devices → Chrome → Apps & extensions**).
2. Select the organizational unit that contains your browser (top-level is fine).
3. Hover the **+** button (bottom-right) → **Add Chrome app or extension by ID**.
4. Enter `ikbpjibhddfjalgppjekkmdihdfpnpbk`, choose **From a custom URL**, and enter
   `https://freemedium.tranlight.dev/updates.xml`. **Save**.
5. In the row that appears, set **Installation policy**:
   - **Force install** — installed silently on every enrolled browser, cannot be
     removed by the user, always kept up to date. Recommended.
   - **Allow install** — user installs it once from `chrome://extensions` (paste the
     ID is not enough; use *Force install* if you just want it to appear).
6. **Save** (top-right).

## 5. Verify on the Mac

1. `chrome://policy` → **Reload policies**. `ExtensionInstallForcelist` (or
   `ExtensionSettings`) should list the ID with your update URL.
2. `chrome://extensions` → **Update**. FreeMedium appears with the version from
   `updates.xml` and the *Managed by your organization* badge. Remove any unpacked
   copy of the extension first so the two don't run side by side.
3. Open any Medium article — the **Read for free** button should be there.

## 6. Shipping updates

Nothing to do on the browser side. Bump `version` in `manifest.json`, commit, tag
`v<version>`, push. CI publishes the new `.crx` and `updates.xml`; Chrome checks the
update URL every few hours (or immediately via `chrome://extensions → Update`).

## Troubleshooting

| Symptom | Check |
|---|---|
| `chrome://management` says not managed | Token file path/permissions; Chrome fully quit and relaunched; token not expired/revoked in **Managed browsers → Enrollment tokens** |
| Policy shows but extension never installs | The update URL must return `updates.xml` over HTTPS with a valid cert (`curl -I https://freemedium.tranlight.dev/updates.xml` → 200). ID in the XML must match the ID in the policy |
| "This extension is not listed in the Chrome Web Store and may have been added without your knowledge" | The browser isn't seen as managed; re-check enrollment (step 3) |
| Old version stays | Tag version must equal `manifest.version`; CI fails otherwise. Then `chrome://extensions → Update` |
| Want to leave management | Admin console → **Managed browsers** → delete the browser, then `sudo rm /Library/Google/Chrome/CloudManagementEnrollmentToken` and relaunch Chrome |

Sources: [Enroll cloud-managed browsers](https://support.google.com/chrome/a/answer/9301891) ·
[View and configure apps and extensions](https://support.google.com/chrome/a/answer/6177447) ·
[Sign up for Chrome Enterprise Core](https://support.google.com/chrome/a/answer/9301420) ·
[ExtensionInstallForcelist policy](https://chromeenterprise.google/policies/extension-install-forcelist/)
