// Runs in the page's MAIN world (see manifest.json). Content scripts live in
// an isolated world with their own `history` wrapper, so patching
// history.pushState there never intercepts Medium's own SPA navigations.
// This script patches the real page-side `history` and notifies the isolated
// world through a DOM event, which does cross the world boundary.
(() => {
  const EVENT_NAME = "free-medium:urlchange";

  function notify() {
    window.dispatchEvent(new Event(EVENT_NAME));
  }

  ["pushState", "replaceState"].forEach((method) => {
    const original = history[method];
    history[method] = function (...args) {
      const result = original.apply(this, args);
      notify();
      return result;
    };
  });

  window.addEventListener("popstate", notify);
})();
