// Entry point for the isolated-world content script. Wires together page
// detection, the Freedium prefetch and the overlay UI. Loaded last.
(() => {
  const FM = globalThis.FreeMedium;
  const { IDS, URL_CHANGE_EVENT } = FM.constants;
  const { isMediumHost, isMediumPage, isArticleUrl } = FM.detection;
  const { toFreediumUrl, warmUpConnection } = FM.freedium;

  // Created at document_start on medium.com hosts so the Freedium article is
  // already loading in the background by the time the DOM is ready. On custom
  // domains we can't know it's Medium yet, so the UI is created in init().
  let ui = null;
  let initialized = false;
  let trackedUrl = document.URL;
  let refreshScheduled = false;

  function loadCurrentArticle() {
    ui.load(toFreediumUrl(document.URL));
  }

  function startEarlyPrefetch() {
    if (!isMediumHost()) return;

    warmUpConnection();
    ui = new FM.OverlayUi();

    // Only articles get prefetched; on the home feed the overlay stays closed
    // and there is no point loading Freedium's front page in the background.
    if (isArticleUrl()) loadCurrentArticle();

    // An <iframe> only opens its browsing context (and starts the network
    // request) once it is connected to the document, so attach it to <html>
    // right away instead of waiting for <body>. It stays hidden via
    // overlay.css's default (non ".is-open") state.
    ui.mount({ withButton: false });
  }

  // Article pages auto-open the overlay; every other Medium page (home, tags,
  // profiles) keeps it closed so the reader isn't covered by Freedium's index.
  function syncOverlayToCurrentUrl() {
    const isArticle = isArticleUrl();
    if (isArticle) loadCurrentArticle();
    ui.setOpen(isArticle);
  }

  // Medium is a single-page app: clicking from the home feed into an article
  // navigates via history.pushState, so this content script never re-runs.
  // src/medium-history-hook.js (MAIN world) patches the page's real `history`
  // and fires URL_CHANGE_EVENT; popstate reaches this world directly.
  function onUrlChanged() {
    refreshScheduled = false;
    if (document.URL === trackedUrl) return;
    trackedUrl = document.URL;

    // Before init() there is nothing to update; init() reads document.URL.
    if (!initialized || !isMediumPage()) return;
    syncOverlayToCurrentUrl();
  }

  function scheduleUrlSync() {
    if (refreshScheduled) return;
    refreshScheduled = true;
    queueMicrotask(onUrlChanged);
  }

  function init() {
    if (initialized || document.getElementById(IDS.button) || !isMediumPage()) return;
    initialized = true;

    ui ??= new FM.OverlayUi();

    // Manual toggle also works on non-article pages; the iframe is loaded
    // lazily there since the prefetch only covers articles.
    ui.button.addEventListener("click", () => {
      if (!ui.open && !ui.hasLoadedUrl) loadCurrentArticle();
      ui.toggle();
    });

    ui.mount();
    ui.keepMounted();

    const isArticle = isArticleUrl();
    if (isArticle && !ui.hasLoadedUrl) loadCurrentArticle();
    ui.setOpen(isArticle);
  }

  startEarlyPrefetch();

  window.addEventListener(URL_CHANGE_EVENT, scheduleUrlSync);
  window.addEventListener("popstate", scheduleUrlSync);

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
