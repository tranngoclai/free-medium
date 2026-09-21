// Helpers for talking to the Freedium mirror: URL rewriting and connection
// warm-up so the article iframe starts loading as early as possible.
(() => {
  const FM = (globalThis.FreeMedium ??= {});
  const { FREEDIUM_HOST, FREEDIUM_ORIGIN } = FM.constants;

  // Same path/query on the Freedium host, e.g.
  // https://medium.com/@u/post-1a2b3c4d5e6f -> https://freedium-mirror.cfd/@u/post-1a2b3c4d5e6f
  function toFreediumUrl(url) {
    const freedium = new URL(url);
    freedium.host = FREEDIUM_HOST;
    return freedium.href;
  }

  // Safe to call before <head> exists: falls back to <html>.
  function warmUpConnection() {
    const head = document.head || document.documentElement;
    for (const rel of ["preconnect", "dns-prefetch"]) {
      const link = document.createElement("link");
      link.rel = rel;
      link.href = FREEDIUM_ORIGIN;
      link.crossOrigin = "anonymous";
      head.appendChild(link);
    }
  }

  FM.freedium = Object.freeze({ toFreediumUrl, warmUpConnection });
})();
