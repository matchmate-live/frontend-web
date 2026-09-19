"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import HomeNavbar from "@/components/home/HomeNavbar";
import MobileDrawer from "@/components/home/MobileDrawer";
import AdRail from "@/components/home/AdRail";
import AdSlot from "@/components/ads/AdSlot";
import { ADS_SLOTS } from "@/lib/adsConfig";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useMessaging } from "@/lib/messaging/MessagingProvider";
import { fetchConversations, fetchMessages } from "@/lib/messaging/messagesApi";
import { buildDmConversationId } from "@/lib/messaging/conversationId";
import { fetchProfileByUserId } from "@/lib/profileViewApi";
import type { ConversationSummary, IncomingMessagePush, Message } from "@/lib/messaging/types";
import type { ProfileResponse } from "@/lib/onboarding/types";
import ConversationListPanel from "@/components/messages/ConversationListPanel";
import MessageThreadPanel from "@/components/messages/MessageThreadPanel";

/** Newest→oldest per page from the backend; the UI shows oldest→newest, latest at the bottom. */
function chronological(page: Message[]): Message[] {
  return [...page].reverse();
}

/** Minimum gap between fresh (cache-bypassing) partner-status fetches, per partner. */
const STATUS_REFRESH_MS = 5 * 60 * 1000;

function statusFetchStorageKey(userId: string): string {
  return `matchmate.messages.lastStatusFetch.${userId}`;
}

/** Epoch ms of the last fresh status fetch for this partner, or 0 if none (or storage unavailable). */
function getLastStatusFetch(userId: string): number {
  try {
    const raw = window.localStorage.getItem(statusFetchStorageKey(userId));
    const n = raw ? Number(raw) : 0;
    return Number.isFinite(n) ? n : 0;
  } catch {
    return 0;
  }
}

function setLastStatusFetch(userId: string, at: number): void {
  try {
    window.localStorage.setItem(statusFetchStorageKey(userId), String(at));
  } catch {
    /* private browsing / storage disabled — best effort only */
  }
}

export default function MessagesView() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { isLoggedIn, loading: authLoading, userId: ownSub, signOut } = useAuth();
  const { subscribe, sendMessage: wsSendMessage } = useMessaging();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeUserId = searchParams.get("to");

  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [conversationsLoading, setConversationsLoading] = useState(true);
  const [conversationsError, setConversationsError] = useState<string | null>(null);
  const [conversationsNextToken, setConversationsNextToken] = useState<string | null>(null);
  const [loadingMoreConversations, setLoadingMoreConversations] = useState(false);

  const [profilesByUserId, setProfilesByUserId] = useState<Record<string, ProfileResponse>>({});
  const fetchingProfilesRef = useRef<Set<string>>(new Set());

  const [messages, setMessages] = useState<Message[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [messagesError, setMessagesError] = useState<string | null>(null);
  const [messagesNextToken, setMessagesNextToken] = useState<string | null>(null);
  const [loadingOlderMessages, setLoadingOlderMessages] = useState(false);

  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);

  // Briefly highlights the conversation row a live push just moved to the top of the list.
  const [highlightedConversationId, setHighlightedConversationId] = useState<string | null>(null);
  const highlightTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    return () => {
      if (highlightTimeoutRef.current) clearTimeout(highlightTimeoutRef.current);
    };
  }, []);

  const activeConversationId =
    ownSub && activeUserId ? buildDmConversationId(ownSub, activeUserId) : null;

  // Conversation list — the List and Thread are different screens (see ConversationListPanel/
  // MessageThreadPanel's `hidden` props: one-at-a-time on every viewport, never side-by-side).
  // A direct deep link into one thread (e.g. "Send message" from a profile card) should never
  // load the List screen's own data — so this only fetches once the List screen is actually
  // the one being shown (no activeUserId), whether that's on initial load with no `?to=`, or
  // later when the user taps back. Loaded once per login after that; real-time pushes keep it
  // current without needing to re-fetch. hasLoadedConversationsRef is set synchronously before
  // the async call and never reset except on logout, so it also survives React Strict Mode's
  // dev-only double-invocation without a `cancelled`-flag race (see the message-thread effect
  // below for why a naive `cancelled` closure combined with a run-once guard can get this wrong).
  const hasLoadedConversationsRef = useRef(false);
  useEffect(() => {
    if (!isLoggedIn) {
      hasLoadedConversationsRef.current = false;
      setConversations([]);
      setConversationsLoading(false);
      return;
    }
    if (activeUserId) return;
    if (hasLoadedConversationsRef.current) return;
    hasLoadedConversationsRef.current = true;
    setConversationsLoading(true);
    setConversationsError(null);
    fetchConversations()
      .then((res) => {
        setConversations(res.items);
        setConversationsNextToken(res.nextToken);
      })
      .catch((e: unknown) => {
        setConversationsError(e instanceof Error ? e.message : "Could not load conversations.");
      })
      .finally(() => {
        setConversationsLoading(false);
      });
  }, [isLoggedIn, activeUserId]);

  async function loadMoreConversations() {
    if (!conversationsNextToken || loadingMoreConversations) return;
    setLoadingMoreConversations(true);
    try {
      const res = await fetchConversations(conversationsNextToken);
      setConversations((prev) => [...prev, ...res.items]);
      setConversationsNextToken(res.nextToken);
    } catch (e) {
      setConversationsError(e instanceof Error ? e.message : "Could not load more conversations.");
    } finally {
      setLoadingMoreConversations(false);
    }
  }

  // Message thread for whichever conversation is active — resets and reloads on every switch.
  // fetchingThreadRef survives React Strict Mode's dev-only double-invocation of this effect,
  // so only one request actually gets sent per id. But that means a per-invocation `cancelled`
  // closure (set true by Strict Mode's spurious cleanup between the two invocations) would
  // wrongly discard the one real request's own result — there's no second invocation left to
  // apply it. So instead: track the latest activeConversationId in a ref and compare against
  // that when the request resolves — true staleness (switched to a different conversation
  // before this one's fetch finished) still gets discarded correctly; Strict Mode's harmless
  // remount (same id, nothing actually changed) does not.
  const fetchingThreadRef = useRef<Set<string>>(new Set());
  const latestConversationIdRef = useRef<string | null>(null);
  useEffect(() => {
    latestConversationIdRef.current = activeConversationId;
    if (!activeConversationId) {
      setMessages([]);
      setMessagesNextToken(null);
      setMessagesError(null);
      return;
    }
    if (fetchingThreadRef.current.has(activeConversationId)) return;
    fetchingThreadRef.current.add(activeConversationId);
    setMessages([]);
    setMessagesNextToken(null);
    setMessagesLoading(true);
    setMessagesError(null);
    fetchMessages(activeConversationId)
      .then((res) => {
        if (latestConversationIdRef.current !== activeConversationId) return;
        setMessages(chronological(res.items));
        setMessagesNextToken(res.nextToken);
      })
      .catch((e: unknown) => {
        if (latestConversationIdRef.current === activeConversationId) {
          setMessagesError(e instanceof Error ? e.message : "Could not load messages.");
        }
      })
      .finally(() => {
        if (latestConversationIdRef.current === activeConversationId) setMessagesLoading(false);
        fetchingThreadRef.current.delete(activeConversationId);
      });
  }, [activeConversationId]);

  async function loadOlderMessages() {
    if (!activeConversationId || !messagesNextToken || loadingOlderMessages) return;
    setLoadingOlderMessages(true);
    try {
      const res = await fetchMessages(activeConversationId, messagesNextToken);
      setMessages((prev) => [...chronological(res.items), ...prev]);
      setMessagesNextToken(res.nextToken);
    } catch (e) {
      setMessagesError(e instanceof Error ? e.message : "Could not load older messages.");
    } finally {
      setLoadingOlderMessages(false);
    }
  }

  // Keeps profilesByUserId filled in for every conversation row and the active thread's
  // header — the list/message APIs only ever return the other participant's raw userId.
  useEffect(() => {
    const needed = new Set<string>();
    for (const c of conversations) needed.add(c.otherUserId);
    if (activeUserId) needed.add(activeUserId);

    const toFetch = [...needed].filter(
      (id) => !profilesByUserId[id] && !fetchingProfilesRef.current.has(id),
    );
    if (toFetch.length === 0) return;

    for (const id of toFetch) fetchingProfilesRef.current.add(id);
    Promise.allSettled(toFetch.map((id) => fetchProfileByUserId(id))).then((results) => {
      const next: Record<string, ProfileResponse> = {};
      results.forEach((result, i) => {
        const id = toFetch[i];
        fetchingProfilesRef.current.delete(id);
        if (result.status === "fulfilled") next[id] = result.value;
      });
      if (Object.keys(next).length > 0) {
        setProfilesByUserId((prev) => ({ ...prev, ...next }));
      }
    });
  }, [conversations, activeUserId, profilesByUserId]);

  // Live pushes: update whichever thread is open, and always keep the conversation list
  // current (recency order, preview text) — per backend docs, this fires app-wide, not
  // just while a chat is open, so both need to react regardless of what's on screen.
  const handlePush = useCallback(
    (push: IncomingMessagePush) => {
      if (push.conversationId === activeConversationId) {
        setMessages((prev) =>
          prev.some((m) => m.messageId === push.messageId)
            ? prev
            : [...prev, {
                conversationId: push.conversationId,
                createdAt: push.createdAt,
                messageId: push.messageId,
                fromUser: push.fromUser,
                toUser: push.toUser,
                message: push.message,
              }],
        );
      }

      setConversations((prev) => {
        const existingIndex = prev.findIndex((c) => c.conversationId === push.conversationId);
        const updated: ConversationSummary = {
          conversationId: push.conversationId,
          otherUserId: existingIndex >= 0 ? prev[existingIndex].otherUserId : push.fromUser,
          lastMessageAt: Number(push.createdAt.split("#")[0]) || Date.now(),
          lastCreatedAt: push.createdAt,
          lastMessageId: push.messageId,
          lastMessagePreview: push.message.slice(0, 200),
        };
        const rest = existingIndex >= 0 ? prev.filter((_, i) => i !== existingIndex) : prev;
        return [updated, ...rest];
      });

      if (highlightTimeoutRef.current) clearTimeout(highlightTimeoutRef.current);
      setHighlightedConversationId(push.conversationId);
      highlightTimeoutRef.current = setTimeout(() => {
        setHighlightedConversationId((id) => (id === push.conversationId ? null : id));
      }, 3500);

      // Any incoming push is proof its sender is online right now — this handler already
      // runs for every push app-wide, so updating their status here is free (no extra
      // fetch), keeping both the thread header and the list's online dot accurate.
      const pushEpoch = Number(push.createdAt.split("#")[0]);
      setProfilesByUserId((prev) => {
        const existing = prev[push.fromUser];
        if (!existing) return prev;
        return {
          ...prev,
          [push.fromUser]: { ...existing, lastSeen: Number.isFinite(pushEpoch) ? pushEpoch : Date.now() },
        };
      });
    },
    [activeConversationId],
  );

  useEffect(() => subscribe(handlePush), [subscribe, handlePush]);

  // The bulk fetch above caches a profile for up to 3h, so it can't reflect live status.
  // No ongoing polling while a thread stays open — just re-fetch on open, and only if the
  // last fetch for this partner (tracked in localStorage) was 5+ minutes ago.
  // fetchingStatusRef guards against React Strict Mode's dev-only double-invocation firing
  // this noStore (always-real-network) request twice — see fetchingThreadRef above for why
  // a per-invocation `cancelled` closure would wrongly discard the one real request's own
  // result instead (there's no second invocation left to apply it).
  const fetchingStatusRef = useRef<Set<string>>(new Set());
  const latestActiveUserIdRef = useRef<string | null>(null);
  useEffect(() => {
    latestActiveUserIdRef.current = activeUserId;
    if (!activeUserId) return;
    if (Date.now() - getLastStatusFetch(activeUserId) < STATUS_REFRESH_MS) return;
    if (fetchingStatusRef.current.has(activeUserId)) return;
    fetchingStatusRef.current.add(activeUserId);

    fetchProfileByUserId(activeUserId, { noStore: true })
      .then((profile) => {
        if (latestActiveUserIdRef.current !== activeUserId) return;
        setLastStatusFetch(activeUserId, Date.now());
        setProfilesByUserId((prev) => ({ ...prev, [activeUserId]: profile }));
      })
      .catch(() => {})
      .finally(() => {
        fetchingStatusRef.current.delete(activeUserId);
      });
  }, [activeUserId]);

  function selectConversation(otherUserId: string) {
    router.push(`/messages?to=${encodeURIComponent(otherUserId)}`);
  }

  function handleBack() {
    // Actual history back, not a push to the bare list — returns to wherever this
    // conversation was opened from (a profile page, search results, or the list itself),
    // not always to /messages.
    router.back();
  }

  async function handleSend(text: string) {
    if (!activeUserId) return;
    setSending(true);
    setSendError(null);
    try {
      const ack = await wsSendMessage({ toUser: activeUserId, message: text });
      if (!ack.ok || !ack.message) {
        throw new Error("Message could not be sent.");
      }
      const saved = ack.message;
      setMessages((prev) => (prev.some((m) => m.messageId === saved.messageId) ? prev : [...prev, saved]));
      setConversations((prev) => {
        const existingIndex = prev.findIndex((c) => c.conversationId === saved.conversationId);
        const updated: ConversationSummary = {
          conversationId: saved.conversationId,
          otherUserId: activeUserId,
          lastMessageAt: Number(saved.createdAt.split("#")[0]) || Date.now(),
          lastCreatedAt: saved.createdAt,
          lastMessageId: saved.messageId,
          lastMessagePreview: saved.message.slice(0, 200),
        };
        const rest = existingIndex >= 0 ? prev.filter((_, i) => i !== existingIndex) : prev;
        return [updated, ...rest];
      });
    } catch (e) {
      setSendError(e instanceof Error ? e.message : "Could not send message.");
    } finally {
      setSending(false);
    }
  }

  const partnerProfile = activeUserId ? profilesByUserId[activeUserId] ?? null : null;

  return (
    <main className="min-h-screen w-full bg-pink-50/10 text-zinc-900">
      <HomeNavbar menuOpen={menuOpen} onToggleMenu={() => setMenuOpen((v) => !v)} />
      <MobileDrawer isLoggedIn={isLoggedIn} open={menuOpen} onClose={() => setMenuOpen(false)} onLogout={signOut} />

      <div className="mx-auto w-full max-w-7xl px-6 py-6">
        <div className="grid items-stretch gap-6 lg:grid-cols-[280px_minmax(0,1fr)_280px]">
          <AdRail slot={ADS_SLOTS.desktopLeft} />

          <section className="relative min-h-[calc(100dvh-7rem)] overflow-hidden rounded-2xl border border-pink-200 bg-white shadow-sm lg:min-h-[calc(100vh-7rem)]">
            <div className={!authLoading && !isLoggedIn ? "pointer-events-none select-none blur-sm" : undefined}>
              <div className="flex h-[calc(100dvh-7rem)] lg:h-[calc(100vh-7rem)]">
                <ConversationListPanel
                  activeUserId={activeUserId}
                  conversations={conversations}
                  error={conversationsError}
                  hasMore={Boolean(conversationsNextToken)}
                  hidden={Boolean(activeUserId)}
                  highlightedConversationId={highlightedConversationId}
                  loading={conversationsLoading}
                  loadingMore={loadingMoreConversations}
                  profilesByUserId={profilesByUserId}
                  onLoadMore={loadMoreConversations}
                  onSelect={selectConversation}
                />
                <MessageThreadPanel
                  activeUserId={activeUserId}
                  error={messagesError}
                  hasOlder={Boolean(messagesNextToken)}
                  hidden={!activeUserId}
                  loading={messagesLoading}
                  loadingOlder={loadingOlderMessages}
                  messages={messages}
                  ownSub={ownSub}
                  partnerProfile={partnerProfile}
                  sendError={sendError}
                  sending={sending}
                  onBack={handleBack}
                  onLoadOlder={loadOlderMessages}
                  onSend={handleSend}
                />
              </div>
            </div>

            {!authLoading && !isLoggedIn ? (
              <div className="absolute inset-0 z-10 flex items-center justify-center rounded-2xl px-3 py-4 backdrop-blur-sm sm:px-0 sm:py-0">
                <div className="mx-4 w-full max-w-md rounded-xl bg-white p-5 text-center shadow-md">
                  <h2 className="text-lg font-semibold text-zinc-900">Login Required</h2>
                  <p className="mt-2 text-sm text-zinc-600">You must be logged in to start conversations.</p>
                  <a
                    className="mt-4 inline-block rounded-md bg-pink-300 px-4 py-2 text-sm text-white"
                    href={`/auth/sign-in?next=${encodeURIComponent(pathname)}`}
                  >
                    Sign in
                  </a>
                </div>
              </div>
            ) : null}
          </section>

          <AdRail slot={ADS_SLOTS.desktopRight} />
        </div>

        <div className="mt-6 lg:hidden">
          <div className="rounded-xl border border-pink-200 bg-white p-3 shadow-sm">
            <p className="mb-2 text-xs text-zinc-500">Sponsored</p>
            <AdSlot className="block min-h-[220px] w-full rounded-md bg-pink-50/50" slot={ADS_SLOTS.mobileBottom} />
          </div>
        </div>
      </div>
    </main>
  );
}
