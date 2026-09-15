"use client";

import Image from "next/image";
import { profilePhotoSrc } from "@/lib/profilePhoto";
import { formatLastSeenStatus } from "@/lib/profileSearchDisplay";
import type { ConversationSummary } from "@/lib/messaging/types";
import type { ProfileResponse } from "@/lib/onboarding/types";

const ONLINE_WINDOW_MS = 15 * 60 * 1000;

function isRecentlyOnline(lastSeen: number | undefined): boolean {
  return typeof lastSeen === "number" && Number.isFinite(lastSeen) && Date.now() - lastSeen < ONLINE_WINDOW_MS;
}

function ConversationRowSkeleton() {
  return (
    <li className="flex w-full items-center gap-3 border-b border-pink-50 px-4 py-3 sm:px-6">
      <div className="h-11 w-11 shrink-0 animate-pulse rounded-full bg-pink-100" />
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <div className="h-3.5 w-1/3 animate-pulse rounded bg-pink-100" />
          <div className="h-3 w-10 shrink-0 animate-pulse rounded bg-pink-100" />
        </div>
        <div className="mt-2 h-3 w-2/3 animate-pulse rounded bg-pink-100" />
      </div>
    </li>
  );
}

type ConversationListPanelProps = {
  conversations: ConversationSummary[];
  profilesByUserId: Record<string, ProfileResponse>;
  activeUserId: string | null;
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  loadingMore: boolean;
  onSelect: (otherUserId: string) => void;
  onLoadMore: () => void;
  /** One screen at a time, on every viewport — hidden once a thread is open, visible again via the thread's back button. */
  hidden: boolean;
  /** conversationId a live push just moved to the top of the list — briefly highlighted so it's noticeable. */
  highlightedConversationId: string | null;
};

export default function ConversationListPanel({
  conversations,
  profilesByUserId,
  activeUserId,
  loading,
  error,
  hasMore,
  loadingMore,
  onSelect,
  onLoadMore,
  hidden,
  highlightedConversationId,
}: ConversationListPanelProps) {
  return (
    <div className={`${hidden ? "hidden" : "flex"} w-full flex-col`}>
      <div className="border-b border-pink-100 px-4 py-3 sm:px-6">
        <h1 className="text-lg font-semibold text-zinc-900">Messages</h1>
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading && (
          <div aria-busy="true" role="status">
            <span className="sr-only">Loading conversations…</span>
            <ul>
              {Array.from({ length: 10 }).map((_, i) => (
                <ConversationRowSkeleton key={i} />
              ))}
            </ul>
          </div>
        )}

        {error && !loading && (
          <p className="px-4 py-8 text-center text-sm text-red-700" role="alert">
            {error}
          </p>
        )}

        {!loading && !error && conversations.length === 0 && (
          <p className="px-4 py-8 text-center text-sm text-zinc-600">
            No conversations yet. Message someone from their profile to start one.
          </p>
        )}

        {!loading && !error && conversations.length > 0 && (
          <ul>
            {conversations.map((c) => {
              const profile = profilesByUserId[c.otherUserId];
              const name = profile?.name?.trim() || "Member";
              const online = isRecentlyOnline(profile?.lastSeen);
              const isActive = c.otherUserId === activeUserId;
              const isHighlighted = c.conversationId === highlightedConversationId;
              return (
                <li key={c.conversationId}>
                  <button
                    className={`flex w-full min-w-0 items-center gap-3 border-b border-pink-50 px-4 py-3 text-left transition-colors duration-700 sm:px-6 ${
                      isHighlighted
                        ? "bg-pink-100/80 ring-2 ring-inset ring-pink-400"
                        : isActive
                          ? "bg-pink-50"
                          : "hover:bg-pink-50/60"
                    }`}
                    type="button"
                    onClick={() => onSelect(c.otherUserId)}
                  >
                    <div className="relative h-11 w-11 shrink-0">
                      <div className="absolute inset-0 overflow-hidden rounded-full bg-pink-50/90">
                        <Image
                          alt={`${name}'s photo`}
                          className="object-cover"
                          fill
                          sizes="44px"
                          src={profilePhotoSrc(profile?.photos?.[0])}
                        />
                      </div>
                      {online ? (
                        <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-white bg-emerald-500" />
                      ) : null}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="truncate text-sm font-semibold text-zinc-900">{name}</span>
                        <span className="shrink-0 text-[11px] text-zinc-500">
                          {formatLastSeenStatus(c.lastMessageAt).split(",")[0]}
                        </span>
                      </div>
                      <p className="truncate text-xs text-zinc-600">{c.lastMessagePreview || "—"}</p>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        )}

        {hasMore && !loading && (
          <div className="px-4 py-3 text-center">
            <button
              className="cursor-pointer rounded-md border border-pink-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={loadingMore}
              type="button"
              onClick={onLoadMore}
            >
              {loadingMore ? "Loading…" : "Load more"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
