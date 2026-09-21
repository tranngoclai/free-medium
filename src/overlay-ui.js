// Owns every DOM node the extension injects (toggle button, full-screen
// overlay, iframe, loader) and the state transitions between them.
(() => {
  const FM = (globalThis.FreeMedium ??= {});
  const { IDS, LABELS } = FM.constants;

  function createLoader() {
    const loader = document.createElement("div");
    loader.id = IDS.loader;

    const spinner = document.createElement("div");
    spinner.className = "fm-spinner";

    const text = document.createElement("div");
    text.className = "fm-loader-text";
    text.textContent = LABELS.loading;

    const bar = document.createElement("div");
    bar.className = "fm-loader-bar";

    loader.append(spinner, text, bar);
    return loader;
  }

  class OverlayUi {
    constructor() {
      this.open = false;

      this.overlay = document.createElement("div");
      this.overlay.id = IDS.overlay;

      this.iframe = document.createElement("iframe");
      this.iframe.id = IDS.iframe;

      this.loader = createLoader();
      this.overlay.append(this.iframe, this.loader);

      this.button = document.createElement("button");
      this.button.id = IDS.button;
      this.button.textContent = LABELS.buttonClosed;

      // Attached at construction rather than on init(): the iframe may be
      // prefetched at document_start and can finish loading before
      // DOMContentLoaded, in which case a later listener would miss it.
      this.iframe.addEventListener("load", () => this.#onIframeLoaded());
    }

    get hasLoadedUrl() {
      return Boolean(this.iframe.src);
    }

    // Points the iframe at `url` and shows the loader until it finishes.
    load(url) {
      this.loader.classList.remove("is-hidden");
      this.iframe.classList.remove("is-loaded");
      this.iframe.src = url;
    }

    #onIframeLoaded() {
      // `src` is empty for the initial about:blank; ignore that one.
      if (!this.hasLoadedUrl) return;
      this.loader.classList.add("is-hidden");
      this.iframe.classList.add("is-loaded");
    }

    setOpen(open) {
      this.open = open;
      this.overlay.classList.toggle("is-open", open);
      document.documentElement.style.overflow = open ? "hidden" : "";
      this.button.textContent = open ? LABELS.buttonOpen : LABELS.buttonClosed;
    }

    toggle() {
      this.setOpen(!this.open);
    }

    // Mount on <html>, not <body>: Medium's React hydration rewrites <body>
    // shortly after DOMContentLoaded and would throw our nodes away with it.
    mount({ withButton = true } = {}) {
      const root = document.documentElement;
      if (!this.overlay.isConnected) root.appendChild(this.overlay);
      if (withButton && !this.button.isConnected) root.appendChild(this.button);
    }

    // Defensive fallback: if the page still detaches our nodes (e.g. a full
    // <html> child replacement), re-attach them without recreating the iframe
    // so the in-flight Freedium load is preserved.
    keepMounted() {
      const observer = new MutationObserver(() => {
        if (!this.overlay.isConnected || !this.button.isConnected) {
          this.mount();
        }
      });
      observer.observe(document.documentElement, { childList: true });
      if (document.body) {
        observer.observe(document.body, { childList: true });
      }
    }
  }

  FM.OverlayUi = OverlayUi;
})();
