// Decides whether the current page is Medium and whether it is an article.
(() => {
  const FM = (globalThis.FreeMedium ??= {});

  function isMediumHost(hostname = location.hostname) {
    const host = hostname.toLowerCase();
    return host === "medium.com" || host.endsWith(".medium.com");
  }

  // Custom-domain publications (e.g. blog.example.com) are still Medium under
  // the hood; they can only be recognised from the rendered <head>.
  function isMediumPageDom() {
    const canonical = document.querySelector('link[rel="canonical"]');
    if (canonical?.href.includes("medium.com/")) {
      return true;
    }

    return Boolean(
      document.querySelector(
        'meta[property="al:ios:app_name"][content="Medium"],' +
          'meta[property="al:android:package"][content="com.medium.reader"]'
      )
    );
  }

  function isMediumPage() {
    return isMediumHost() || isMediumPageDom();
  }

  // Medium article URLs end in a 12-hex-char post id, either as a slug suffix
  // ("/@user/my-post-1a2b3c4d5e6f", "/pub/my-post-1a2b3c4d5e6f") or bare
  // ("/p/1a2b3c4d5e6f"). Home, tag, search and profile pages never have it.
  function isArticleUrl(url = document.URL) {
    const { pathname } = new URL(url);
    return /(?:^\/p\/|-)[0-9a-f]{12}\/?$/i.test(pathname);
  }

  FM.detection = Object.freeze({
    isMediumHost,
    isMediumPageDom,
    isMediumPage,
    isArticleUrl,
  });
})();
