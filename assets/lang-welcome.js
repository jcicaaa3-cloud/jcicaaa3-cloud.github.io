/* Opens once per browser on a homepage; normal navigation still works without JS. */
(() => {
  "use strict";
  const overlay = document.getElementById("language-welcome");
  if (!overlay || !document.body.classList.contains("home-view")) return;

  const storageKey = "jcicaaa3-language-welcome-v1";
  const readSeen = () => {
    try { return localStorage.getItem(storageKey) === "seen"; }
    catch (_) { return false; }
  };
  const markSeen = () => {
    try { localStorage.setItem(storageKey, "seen"); }
    catch (_) { /* Continue without persistent preference when storage is blocked. */ }
  };
  if (readSeen()) return;

  const panel = overlay.querySelector(".language-welcome__panel");
  const closeButton = overlay.querySelector("[data-language-dismiss]");
  const choiceLinks = Array.from(overlay.querySelectorAll("[data-language-choice]"));
  const previousFocus = document.activeElement;
  let closed = false;

  function close() {
    if (closed) return;
    closed = true;
    markSeen();
    overlay.hidden = true;
    document.body.classList.remove("language-welcome-open");
    if (previousFocus && typeof previousFocus.focus === "function") previousFocus.focus();
  }

  closeButton.addEventListener("click", close);
  choiceLinks.forEach((link) => link.addEventListener("click", markSeen));
  overlay.addEventListener("click", (event) => {
    if (event.target === overlay) close();
  });
  overlay.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      event.preventDefault();
      close();
      return;
    }
    if (event.key !== "Tab") return;
    const focusable = [closeButton, ...choiceLinks];
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });

  overlay.hidden = false;
  document.body.classList.add("language-welcome-open");
  closeButton.focus();
})();
