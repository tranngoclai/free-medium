// Runs only inside the Freedium iframe our overlay embeds (freedium-mirror.cfd).
// Freedium shows a "Support Freedium" donation modal specifically when it
// detects it's being framed, which blocks the article behind our overlay.
// This dismisses that modal so the embedded reading experience stays clean.
(() => {
  if (window.top === window.self) return;

  const MODAL_HEADING_TEXT = "Support Freedium";
  const DISMISS_BUTTON_TEXT = new Set(["Close", "×", "✕"]);
  const GIVE_UP_AFTER_MS = 15000;

  function findSupportModalCloseButton() {
    const heading = Array.from(
      document.querySelectorAll("h1, h2, h3, div, span")
    ).find((el) => el.textContent.trim() === MODAL_HEADING_TEXT);
    if (!heading) return null;

    const modalRoot =
      heading.closest('[class*="modal"], [role="dialog"]') ||
      heading.parentElement?.parentElement;
    if (!modalRoot) return null;

    return Array.from(modalRoot.querySelectorAll("button")).find((btn) =>
      DISMISS_BUTTON_TEXT.has(btn.textContent.trim())
    );
  }

  function dismissSupportModal() {
    const closeButton = findSupportModalCloseButton();
    if (!closeButton) return false;
    closeButton.click();
    return true;
  }

  if (dismissSupportModal()) return;

  // The modal is injected asynchronously; watch for it, but stop watching
  // eventually so we don't observe the whole document forever.
  const observer = new MutationObserver(() => {
    if (dismissSupportModal()) observer.disconnect();
  });
  observer.observe(document.documentElement, { childList: true, subtree: true });
  setTimeout(() => observer.disconnect(), GIVE_UP_AFTER_MS);
})();
