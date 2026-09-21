// Shared constants for the isolated-world content scripts.
//
// MV3 content scripts cannot use ES modules, so the scripts listed under the
// same `content_scripts` entry in manifest.json share one global scope and
// communicate through the `FreeMedium` namespace. This file is loaded first.
(() => {
  const FM = (globalThis.FreeMedium ??= {});

  FM.constants = Object.freeze({
    FREEDIUM_HOST: "freedium-mirror.cfd",
    FREEDIUM_ORIGIN: "https://freedium-mirror.cfd",

    // Must stay in sync with src/medium-history-hook.js (MAIN world, cannot
    // read this namespace).
    URL_CHANGE_EVENT: "free-medium:urlchange",

    IDS: Object.freeze({
      button: "free-medium__button",
      overlay: "free-medium__overlay",
      iframe: "free-medium__iframe",
      loader: "free-medium__loader",
    }),

    LABELS: Object.freeze({
      buttonOpen: "Show original",
      buttonClosed: "Read for free",
      loading: "Unlocking article…",
    }),
  });
})();
