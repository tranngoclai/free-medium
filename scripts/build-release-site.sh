#!/usr/bin/env bash
# Packs the extension into a signed .crx and generates the self-hosting site
# (updates.xml + index.html) that Chrome polls for updates.
#
# Usage: scripts/build-release-site.sh <private-key.pem> <out-dir>
# Env:   UPDATE_HOST  base URL where <out-dir> will be served (no trailing slash)
set -euo pipefail

KEY="${1:?private key .pem path}"
OUT="${2:?output dir}"
HOST="${UPDATE_HOST:?UPDATE_HOST env required, e.g. https://freemedium.tranlight.dev}"

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
VERSION="$(node -p "require('$ROOT/manifest.json').version")"
STAGE="$(mktemp -d)"

# Only ship what the browser needs.
cp -R "$ROOT/manifest.json" "$ROOT/src" "$ROOT/styles" "$ROOT/images" "$STAGE/"

# Chrome derives the extension ID from the public key: sha256(DER SPKI)[:16] in a-p alphabet.
EXT_ID="$(openssl rsa -in "$KEY" -pubout -outform DER 2>/dev/null | openssl dgst -sha256 -binary | head -c 16 | xxd -p | tr '0-9a-f' 'a-p')"
CRX_NAME="free-medium-${VERSION}.crx"

mkdir -p "$OUT"
npx --yes crx@5 pack "$STAGE" -o "$OUT/$CRX_NAME" -p "$KEY"
cp "$OUT/$CRX_NAME" "$OUT/free-medium-latest.crx"

# Update manifest polled by Chrome (Omaha "gupdate" format).
cat > "$OUT/updates.xml" <<XML
<?xml version="1.0" encoding="UTF-8"?>
<gupdate xmlns="http://www.google.com/update2/response" protocol="2.0">
  <app appid="${EXT_ID}">
    <updatecheck codebase="${HOST}/${CRX_NAME}" version="${VERSION}"/>
  </app>
</gupdate>
XML

cat > "$OUT/index.html" <<HTML
<!doctype html>
<meta charset="utf-8">
<title>FreeMedium updates</title>
<h1>FreeMedium ${VERSION}</h1>
<p>Extension ID: <code>${EXT_ID}</code></p>
<p>Update manifest: <a href="updates.xml">updates.xml</a></p>
<p>Package: <a href="${CRX_NAME}">${CRX_NAME}</a></p>
<p>Source: <a href="https://github.com/tranngoclai/free-medium">github.com/tranngoclai/free-medium</a></p>
HTML

# Some hosts need this to serve .crx with the right MIME type; harmless elsewhere.
printf '/*.crx\n  Content-Type: application/x-chrome-extension\n' > "$OUT/_headers"
touch "$OUT/.nojekyll"

echo "version=$VERSION" >> "${GITHUB_OUTPUT:-/dev/null}"
echo "ext_id=$EXT_ID"   >> "${GITHUB_OUTPUT:-/dev/null}"
echo "crx=$OUT/$CRX_NAME" >> "${GITHUB_OUTPUT:-/dev/null}"
echo "Built $CRX_NAME (id $EXT_ID) -> $OUT"
rm -rf "$STAGE"
