"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { profilePhotoSrc } from "@/lib/profilePhoto";
import { formatLastSeenStatus } from "@/lib/profileSearchDisplay";
import type { Message } from "@/lib/messaging/types";
import type { ProfileResponse } from "@/lib/onboarding/types";

const ONLINE_WINDOW_MS = 15 * 60 * 1000;

function isRecentlyOnline(lastSeen: number | undefined): boolean {
  return typeof lastSeen === "number" && Number.isFinite(lastSeen) && Date.now() - lastSeen < ONLINE_WINDOW_MS;
}

function messageTime(createdAt: string): string {
  const epochMs = Number(createdAt.split("#")[0]);
  if (!Number.isFinite(epochMs)) return "";
  return new Date(epochMs).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

const MESSAGE_SKELETON_ROWS = [
  { mine: false, width: "w-2/3" },
  { mine: true, width: "w-1/2" },
  { mine: false, width: "w-1/3" },
  { mine: false, width: "w-3/5" },
  { mine: true, width: "w-2/5" },
  { mine: false, width: "w-2/3" },
  { mine: true, width: "w-1/2" },
  { mine: false, width: "w-1/3" },
  { mine: false, width: "w-3/5" },
  { mine: true, width: "w-2/5" },
];

function MessagesLoadingSkeleton() {
  return (
    <div aria-busy="true" className="flex flex-col gap-2 bottom-0" role="status">
      <span className="sr-only">Loading messages…</span>
      {MESSAGE_SKELETON_ROWS.map((row, i) => (
        <div key={i} className={`flex ${row.mine ? "justify-end" : "justify-start"}`}>
          <div className={`h-9 animate-pulse rounded-2xl bg-pink-100 ${row.width}`} />
        </div>
      ))}
    </div>
  );
}

type MessageThreadPanelProps = {
  ownSub: string | null;
  activeUserId: string | null;
  partnerProfile: ProfileResponse | null;
  messages: Message[];
  loading: boolean;
  error: string | null;
  hasOlder: boolean;
  loadingOlder: boolean;
  sending: boolean;
  sendError: string | null;
  onLoadOlder: () => void;
  onSend: (text: string) => void;
  onBack: () => void;
  /** One screen at a time, on every viewport — hidden until a conversation is selected. */
  hidden: boolean;
};

export default function MessageThreadPanel({
  ownSub,
  activeUserId,
  partnerProfile,
  messages,
  loading,
  error,
  hasOlder,
  loadingOlder,
  sending,
  sendError,
  onLoadOlder,
  onSend,
  onBack,
  hidden,
}: MessageThreadPanelProps) {
  const [draft, setDraft] = useState("");
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const lastMessageIdRef = useRef<string | null>(null);

  useEffect(() => {
    const last = messages[messages.length - 1];
    if (last && last.messageId !== lastMessageIdRef.current) {
      lastMessageIdRef.current = last.messageId;
      bottomRef.current?.scrollIntoView({ block: "end" });
    }
  }, [messages]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const text = draft.trim();
    if (!text || sending) return;
    onSend(text);
    setDraft("");
  }

  if (!activeUserId) {
    return null;
  }

  const partnerName = partnerProfile?.name?.trim() || "Member";
  const online = isRecentlyOnline(partnerProfile?.lastSeen);

  return (
    <div className={`${hidden ? "hidden" : "flex"} min-h-0 flex-1 flex-col`}>
      <div className="flex items-center gap-3 border-b border-pink-100 px-4 py-3 sm:px-6">
        <button
          aria-label="Back to conversations"
          className="cursor-pointer rounded-md p-1 text-zinc-600 hover:bg-pink-50"
          type="button"
          onClick={onBack}
        >
          ←
        </button>
        <Link className="flex min-w-0 items-center gap-3" href={`/profile/${encodeURIComponent(activeUserId)}`}>
          <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full bg-pink-50/90">
            <Image alt={`${partnerName}'s photo`} className="object-cover" fill sizes="36px" src={profilePhotoSrc(partnerProfile?.photos?.[0])} />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-zinc-900 hover:underline">{partnerName}</p>
            <p className={`text-xs ${online ? "font-medium text-emerald-700" : "text-zinc-500"}`}>
              {online
                ? "Online"
                : typeof partnerProfile?.lastSeen === "number"
                  ? `Last seen ${formatLastSeenStatus(partnerProfile.lastSeen)}`
                  : ""}
            </p>
          </div>
        </Link>
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-4 py-4 sm:px-6">
        {loading && <MessagesLoadingSkeleton />}

        {error && !loading && (
          <p className="py-8 text-center text-sm text-red-700" role="alert">
            {error}
          </p>
        )}

        {!loading && !error && messages.length === 0 && (
          <p className="py-8 text-center text-sm text-zinc-500">
            No messages yet. Say hello to {partnerName}.
          </p>
        )}

        {hasOlder && !loading && (
          <div className="pb-2 text-center">
            <button
              className="cursor-pointer rounded-md border border-pink-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={loadingOlder}
              type="button"
              onClick={onLoadOlder}
            >
              {loadingOlder ? "Loading…" : "Load older messages"}
            </button>
          </div>
        )}

        <div className="flex flex-col gap-2">
          {messages.map((m) => {
            const mine = m.fromUser === ownSub;
            return (
              <div key={m.messageId} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[75%] rounded-2xl px-3.5 py-2 text-sm ${
                    mine ? "bg-pink-500 text-white" : "bg-pink-50 text-zinc-900"
                  }`}
                >
                  <p className="whitespace-pre-wrap break-words">{m.message}</p>
                  <p className={`mt-1 text-right text-[10px] ${mine ? "text-pink-100" : "text-zinc-500"}`}>
                    {messageTime(m.createdAt)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
        <div ref={bottomRef} />
      </div>

      <form className="border-t border-pink-100 px-4 py-3 sm:px-6" onSubmit={handleSubmit}>
        {sendError ? <p className="mb-2 text-xs text-red-700">{sendError}</p> : null}
        <div className="flex items-end gap-2">
          <textarea
            className="max-h-32 min-h-[42px] flex-1 resize-none rounded-lg border border-zinc-800 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-pink-300"
            placeholder="Type a message…"
            rows={1}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
          />
          <button
            className="shrink-0 cursor-pointer rounded-lg bg-pink-500 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-pink-600 disabled:cursor-not-allowed disabled:bg-zinc-200 disabled:text-zinc-400 disabled:hover:bg-zinc-200"
            disabled={!draft.trim() || sending}
            type="submit"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
}
