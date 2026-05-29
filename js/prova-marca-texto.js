/**
 * Marca-texto no enunciado: selecionar para destacar, toque/clique para remover.
 * Desktop (mouse) + mobile / iOS (toque e seleção nativa).
 */
(function (global) {
  const MARK_CLASS = "marca-texto";
  const MARK_SELECTOR = "mark.marca-texto";
  const SUPPRESS_MS = 450;

  function isInsideRoot(root, node) {
    if (!node) return false;
    const el = node.nodeType === Node.TEXT_NODE ? node.parentElement : node;
    return el && root.contains(el);
  }

  function selectionInRoot(root) {
    const sel = global.getSelection();
    if (!sel || sel.rangeCount === 0) return null;
    const range = sel.getRangeAt(0);
    if (!isInsideRoot(root, range.commonAncestorContainer)) return null;
    return { sel, range };
  }

  function wrapRange(range) {
    if (range.collapsed) return false;

    const mark = document.createElement("mark");
    mark.className = MARK_CLASS;

    const fragment = range.extractContents();
    const text = (fragment.textContent || "").replace(/\s+/g, " ").trim();
    if (!text) {
      range.insertNode(fragment);
      return false;
    }

    mark.appendChild(fragment);
    range.insertNode(mark);
    return true;
  }

  function unwrapMark(mark) {
    const parent = mark.parentNode;
    if (!parent) return;
    while (mark.firstChild) {
      parent.insertBefore(mark.firstChild, mark);
    }
    parent.removeChild(mark);
    parent.normalize();
  }

  function attach(root, options) {
    if (!root) return null;

    const onChange =
      typeof options.onChange === "function" ? options.onChange : function () {};

    let suppressClickUntil = 0;
    let lastHighlightAt = 0;
    let touchMoved = false;
    let touchStartX = 0;
    let touchStartY = 0;

    function notify() {
      onChange(root.innerHTML);
    }

    function tryHighlightFromSelection() {
      if (Date.now() - lastHighlightAt < 200) return false;

      const picked = selectionInRoot(root);
      if (!picked) return false;

      const { sel, range } = picked;
      if (sel.isCollapsed) return false;

      const text = sel.toString().replace(/\s+/g, " ").trim();
      if (!text) return false;

      if (range.cloneContents().querySelector(MARK_SELECTOR)) {
        sel.removeAllRanges();
        return false;
      }

      const ok = wrapRange(range);
      sel.removeAllRanges();

      if (ok) {
        lastHighlightAt = Date.now();
        suppressClickUntil = Date.now() + SUPPRESS_MS;
        notify();
      }
      return ok;
    }

    function onMouseUp() {
      tryHighlightFromSelection();
    }

    function onTouchStart(e) {
      touchMoved = false;
      if (e.touches && e.touches[0]) {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
      }
    }

    function onTouchMove(e) {
      if (!e.touches || !e.touches[0]) return;
      const dx = Math.abs(e.touches[0].clientX - touchStartX);
      const dy = Math.abs(e.touches[0].clientY - touchStartY);
      if (dx > 8 || dy > 8) touchMoved = true;
    }

    function onTouchEnd() {
      if (touchMoved) return;
      global.setTimeout(function () {
        tryHighlightFromSelection();
      }, 120);
    }

    function onClick(e) {
      if (Date.now() < suppressClickUntil) return;

      const mark = e.target.closest(MARK_SELECTOR);
      if (!mark || !root.contains(mark)) return;

      e.preventDefault();
      e.stopPropagation();
      unwrapMark(mark);
      notify();
    }

    root.addEventListener("mouseup", onMouseUp);
    root.addEventListener("touchend", onTouchEnd, { passive: true });
    root.addEventListener("touchstart", onTouchStart, { passive: true });
    root.addEventListener("touchmove", onTouchMove, { passive: true });
    root.addEventListener("click", onClick);

    return {
      destroy: function () {
        root.removeEventListener("mouseup", onMouseUp);
        root.removeEventListener("touchend", onTouchEnd);
        root.removeEventListener("touchstart", onTouchStart);
        root.removeEventListener("touchmove", onTouchMove);
        root.removeEventListener("click", onClick);
      },
    };
  }

  global.ProvaMarcaTexto = { attach: attach, MARK_CLASS: MARK_CLASS };
})(typeof window !== "undefined" ? window : globalThis);
