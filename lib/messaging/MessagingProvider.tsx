"use client";

import { fetchAuthSession } from "aws-amplify/auth";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/lib/auth/AuthProvider";
import type { IncomingMessagePush, SendMessageAck } from "./types";

type ConnectionStatus = "idle" | "connecting" | "open" | "closed";

type SendPayload =
  | { toUser: string; conversationId?: undefined; message: string }
  | { conversationId: string; toUser?: undefined; message: string };

type MessagingContextValue = {
  status: ConnectionStatus;
  sendMessage: (payload: SendPayload) => Promise<SendMessageAck>;
  /** Called for every incoming message, on any page. Returns an unsubscribe function. */
  subscribe: (onPush: (push: IncomingMessagePush) => void) => () => void;
};

const MessagingContext = createContext<MessagingContextValue | null>(null);

const RECONNECT_BASE_DELAY_MS = 1000;
const RECONNECT_MAX_DELAY_MS = 15000;
// How long a tab must stay hidden before we close the socket. Long enough to ignore a quick
// tab switch; short enough that idle tabs don't rack up connection minutes.
const BACKGROUND_CLOSE_DELAY_MS = 60_000;

function isIncomingPush(data: unknown): data is IncomingMessagePush {
  return !!data && typeof data === "object" && (data as { type?: unknown }).type === "message";
}

function isSendAck(data: unknown): data is SendMessageAck {
  return !!data && typeof data === "object" && "ok" in (data as object);
}

// One WebSocket for the whole app, mounted in the root layout so messages arrive on any
// page. Connects while signed in and reconnects with backoff if it drops.
export function MessagingProvider({ children }: { children: React.ReactNode }) {
  const { isLoggedIn, userId, loading: authLoading } = useAuth();
  const [status, setStatus] = useState<ConnectionStatus>("idle");

  const wsRef = useRef<WebSocket | null>(null);
  const listenersRef = useRef<Set<(push: IncomingMessagePush) => void>>(new Set());
  const pendingSendsRef = useRef<
    Array<{ resolve: (ack: SendMessageAck) => void; reject: (err: Error) => void }>
  >([]);
  const reconnectAttemptRef = useRef(0);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // True when we closed the socket ourselves, so it isn't treated as a drop to reconnect from.
  const closedByUsRef = useRef(false);
  // True when we closed it because the tab was hidden, so we reconnect when it's visible again.
  const closedForBackgroundRef = useRef(false);
  const backgroundTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // connect() reconnects from its own onclose handler, so it calls itself through a ref.
  const connectRef = useRef<() => void>(() => {});

  const connect = useCallback(() => {
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL;
    if (!wsUrl) {
      console.error("NEXT_PUBLIC_WS_URL is not configured — real-time messaging is disabled.");
      return;
    }

    void (async () => {
      let token: string | undefined;
      try {
        const session = await fetchAuthSession();
        token = session.tokens?.idToken?.toString();
      } catch {
        token = undefined;
      }
      if (!token) return; // signed out in the meantime

      setStatus("connecting");
      closedByUsRef.current = false;
      const socket = new WebSocket(
        `${wsUrl}?token=${encodeURIComponent(token)}`,
      );
      wsRef.current = socket;

      socket.onopen = () => {
        reconnectAttemptRef.current = 0;
        setStatus("open");
      };

      socket.onmessage = (event) => {
        let data: unknown;
        try {
          data = JSON.parse(event.data);
        } catch {
          return;
        }
        if (isIncomingPush(data)) {
          for (const listener of listenersRef.current) listener(data);
          return;
        }
        if (isSendAck(data)) {
          // Acks come back in send order on one connection, so first in, first out.
          pendingSendsRef.current.shift()?.resolve(data);
        }
      };

      socket.onclose = () => {
        wsRef.current = null;
        setStatus("closed");
        for (const pending of pendingSendsRef.current.splice(0)) {
          pending.reject(new Error("Connection closed"));
        }
        if (closedByUsRef.current) return;
        const attempt = reconnectAttemptRef.current + 1;
        reconnectAttemptRef.current = attempt;
        const delay = Math.min(RECONNECT_BASE_DELAY_MS * 2 ** (attempt - 1), RECONNECT_MAX_DELAY_MS);
        reconnectTimerRef.current = setTimeout(() => connectRef.current(), delay);
      };
    })();
  }, []);

  useEffect(() => {
    connectRef.current = connect;
  }, [connect]);

  useEffect(() => {
    if (authLoading) return;

    if (!isLoggedIn) {
      closedByUsRef.current = true;
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      wsRef.current?.close();
      wsRef.current = null;
      // Deferred to avoid a cascading render.
      Promise.resolve().then(() => setStatus("idle"));
      return;
    }

    connect();
    return () => {
      closedByUsRef.current = true;
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      wsRef.current?.close();
      wsRef.current = null;
    };
    // Reconnect as the new user if the account changes.
  }, [authLoading, isLoggedIn, userId, connect]);

  // Close the socket while the tab is hidden for a while (connection minutes cost money)
  // and reconnect as soon as it's visible again.
  useEffect(() => {
    if (authLoading || !isLoggedIn) return;

    function handleVisibilityChange() {
      if (document.hidden) {
        if (backgroundTimerRef.current) return; // already scheduled
        backgroundTimerRef.current = setTimeout(() => {
          backgroundTimerRef.current = null;
          if (!document.hidden) return; // came back before the timer fired
          if (wsRef.current) {
            closedByUsRef.current = true;
            closedForBackgroundRef.current = true;
            wsRef.current.close();
            wsRef.current = null;
          }
        }, BACKGROUND_CLOSE_DELAY_MS);
        return;
      }

      if (backgroundTimerRef.current) {
        clearTimeout(backgroundTimerRef.current);
        backgroundTimerRef.current = null;
      }
      if (closedForBackgroundRef.current) {
        closedForBackgroundRef.current = false;
        connect();
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      if (backgroundTimerRef.current) clearTimeout(backgroundTimerRef.current);
    };
  }, [authLoading, isLoggedIn, connect]);

  const sendMessage = useCallback((payload: SendPayload): Promise<SendMessageAck> => {
    const socket = wsRef.current;
    if (!socket || socket.readyState !== WebSocket.OPEN) {
      return Promise.reject(new Error("Not connected. Try again in a moment."));
    }
    return new Promise<SendMessageAck>((resolve, reject) => {
      pendingSendsRef.current.push({ resolve, reject });
      socket.send(JSON.stringify({ action: "sendMessage", ...payload }));
    });
  }, []);

  const subscribe = useCallback((onPush: (push: IncomingMessagePush) => void) => {
    listenersRef.current.add(onPush);
    return () => {
      listenersRef.current.delete(onPush);
    };
  }, []);

  const value = useMemo<MessagingContextValue>(
    () => ({ status, sendMessage, subscribe }),
    [status, sendMessage, subscribe],
  );

  return <MessagingContext.Provider value={value}>{children}</MessagingContext.Provider>;
}

export function useMessaging(): MessagingContextValue {
  const ctx = useContext(MessagingContext);
  if (!ctx) throw new Error("useMessaging must be used within a MessagingProvider");
  return ctx;
}
