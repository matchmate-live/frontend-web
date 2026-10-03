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
 * Modal keyboard behaviour: focus moves in on open, Escape closes, Tab stays inside, and
 * focus goes back to the trigger on close. Put the returned ref on the dialog's outer element.
 */
export function useModalA11y<T extends HTMLElement>(open: boolean, onClose: () => void) {
  const containerRef = useRef<T | null>(null);
  const triggerRef = useRef<HTMLElement | null>(null);

  // Kept in a ref so an inline onClose doesn't re-run the effect on every render.
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
      // Deferred: moving focus blurs inputs inside the dialog, and their onBlur may set
      // state. Doing that during this cleanup caused "Maximum update depth exceeded".
      const toFocus = triggerRef.current;
      requestAnimationFrame(() => toFocus?.focus());
    };
  }, [open]);

  return containerRef;
}
