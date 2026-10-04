"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import HomeNavbar from "@/components/home/HomeNavbar";
import MobileDrawer from "@/components/home/MobileDrawer";
import AdRail from "@/components/home/AdRail";
import AdSlot from "@/components/ads/AdSlot";
import { ADS_SLOTS, SHOW_UTILITY_PAGE_ADS } from "@/lib/adsConfig";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useMessaging } from "@/lib/messaging/MessagingProvider";
import { fetchConversations, fetchMessages } from "@/lib/messaging/messagesApi";
import { buildDmConversationId } from "@/lib/messaging/conversationId";
import { fetchProfileByUserId } from "@/lib/profileViewApi";
import type { ConversationSummary, IncomingMessagePush, Message } from "@/lib/messaging/types";
import type { ProfileResponse } from "@/lib/onboarding/types";
import ConversationListPanel from "@/components/messages/ConversationListPanel";
import MessageThreadPanel from "@/components/messages/MessageThreadPanel";

// The API returns newest first; we show oldest first, latest at the bottom.
function chronological(page: Message[]): Message[] {
  return [...page].reverse();
}

// Minimum time between fresh status fetches for the same person.
const STATUS_REFRESH_MS = 5 * 60 * 1000;

function statusFetchStorageKey(userId: string): string {
  return `matchmate.messages.lastStatusFetch.${userId}`;
}

// When we last fetched this person's status (0 if never).
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
    /* storage unavailable, ignore */
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

  // Briefly highlights a conversation that a new message just moved to the top.
  const [highlightedConversationId, setHighlightedConversationId] = useState<string | null>(null);
  const highlightTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    return () => {
      if (highlightTimeoutRef.current) clearTimeout(highlightTimeoutRef.current);
    };
  }, []);

  const activeConversationId =
    ownSub && activeUserId ? buildDmConversationId(ownSub, activeUserId) : null;

  // Load the conversation list only when the list screen is actually showing, so opening a
  // chat directly (e.g. "Send message") doesn't fetch it. Loaded once per login; live
  // messages keep it current. The ref is set before the request so Strict Mode doesn't
  // load it twice.
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

  // Loads the open conversation, and reloads when it changes. fetchingThreadRef stops
  // Strict Mode from sending the request twice. To drop stale results we compare against
  // the latest conversation id in a ref, not a `cancelled` flag, which Strict Mode's extra
  // cleanup would set and lose the only real response.
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

  // Fetch profiles for everyone in the list and the open chat. The APIs only return user ids.
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

  // Incoming messages: update the open chat and the conversation list (order and preview).
  // These arrive app-wide, not just while a chat is open.
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

      // Someone who just sent a message is online, so mark them online without a fetch.
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

  // Profiles above can be cached for 3h, so refresh the other person's status when a chat
  // opens, at most every 5 minutes per person. No polling. The ref keeps Strict Mode from
  // sending it twice (see fetchingThreadRef).
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
    // Real browser back, so you return to wherever you opened the chat from.
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

      <div className={`mx-auto w-full px-6 py-6 ${SHOW_UTILITY_PAGE_ADS ? "max-w-7xl" : "max-w-5xl"}`}>
        <div
          className={`grid items-stretch gap-6 ${
            SHOW_UTILITY_PAGE_ADS ? "lg:grid-cols-[280px_minmax(0,1fr)_280px]" : ""
          }`}
        >
          {SHOW_UTILITY_PAGE_ADS ? <AdRail slot={ADS_SLOTS.desktopLeft} /> : null}

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

          {SHOW_UTILITY_PAGE_ADS ? <AdRail slot={ADS_SLOTS.desktopRight} /> : null}
        </div>

        {SHOW_UTILITY_PAGE_ADS ? (
          <div className="mt-6 lg:hidden">
            <div className="rounded-xl border border-pink-200 bg-white p-3 shadow-sm">
              <p className="mb-2 text-xs text-zinc-500">Sponsored</p>
              <AdSlot className="block min-h-[220px] w-full rounded-md bg-pink-50/50" slot={ADS_SLOTS.mobileBottom} />
            </div>
          </div>
        ) : null}
      </div>
    </main>
  );
}
