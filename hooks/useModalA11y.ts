"use client";

import { useEffect, useLayoutEffect, useRef } from "react";

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

function getFocusable(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
    (el) => el.offsetParent !== null,
  );
}

/**
 * Standard modal accessibility behavior for a dialog-like overlay: moves focus in when it
 * opens, Escape closes it, Tab/Shift+Tab cycles focus within it instead of escaping to the
 * page behind, and focus returns to whatever triggered it once it closes. Attach the
 * returned ref to the dialog's outermost element.
 */
export function useModalA11y<T extends HTMLElement>(open: boolean, onClose: () => void) {
  const containerRef = useRef<T | null>(null);
  const triggerRef = useRef<HTMLElement | null>(null);

  // Read via a ref, not a dependency, so callers don't need to memoize onClose — an inline
  // `onClose={() => ...}` prop is a new function every render, and depending on it directly
  // would tear down and rebuild the listener (and re-run the open-transition logic below) on
  // every parent re-render, not just on actual open/close transitions.
  const onCloseRef = useRef(onClose);
  useLayoutEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    if (!open) return;

    triggerRef.current = document.activeElement as HTMLElement | null;
    const container = containerRef.current;
    if (container) getFocusable(container)[0]?.focus();

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        onCloseRef.current();
        return;
      }
      if (e.key !== "Tab" || !container) return;

      const nodes = getFocusable(container);
      if (nodes.length === 0) return;
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      const active = document.activeElement;

      if (e.shiftKey) {
        if (active === first || !container.contains(active)) {
          e.preventDefault();
          last.focus();
        }
      } else if (active === last || !container.contains(active)) {
        e.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      // Deferred, not called synchronously: moving focus here can blur whatever currently
      // has focus inside the dialog (e.g. an input the user was just typing in), and that
      // element's own onBlur handler may call setState on an ancestor (committing its
      // value on close, say) — doing that synchronously inside this cleanup re-enters
      // React's commit phase and can cascade into "Maximum update depth exceeded". Letting
      // the current render/commit cycle finish first avoids that.
      const toFocus = triggerRef.current;
      requestAnimationFrame(() => toFocus?.focus());
    };
  }, [open]);

  return containerRef;
}
