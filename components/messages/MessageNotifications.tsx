"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useMessaging } from "@/lib/messaging/MessagingProvider";
import { fetchProfileByUserId } from "@/lib/profileViewApi";
import { profilePhotoSrc } from "@/lib/profilePhoto";
import type { IncomingMessagePush } from "@/lib/messaging/types";

type MessageToast = {
  id: number;
  fromUser: string;
  name: string;
  photo?: string;
  preview: string;
  entered: boolean;
};

const TOAST_DURATION_MS = 6000;

/**
 * App-wide "new message" toast (avatar, name, preview) — a second subscriber on
 * MessagingProvider's already-open socket, so it costs nothing extra. Suppressed only
 * when the visitor already has that exact conversation open.
 */
export default function MessageNotifications() {
  const { isLoggedIn } = useAuth();
  const { subscribe } = useMessaging();
  const [toasts, setToasts] = useState<MessageToast[]>([]);
  const nextId = useRef(0);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  useEffect(() => {
    if (!isLoggedIn) return;

    return subscribe((push: IncomingMessagePush) => {
      const isViewingThisConversation =
        window.location.pathname === "/messages" &&
        new URLSearchParams(window.location.search).get("to") === push.fromUser;
      if (isViewingThisConversation) return;

      const id = nextId.current++;
      fetchProfileByUserId(push.fromUser)
        .then((profile) => {
          setToasts((prev) => [
            ...prev,
            {
              id,
              fromUser: push.fromUser,
              name: profile.name?.trim() || "Someone",
              photo: profile.photos?.[0],
              preview: push.message.slice(0, 120),
              entered: false,
            },
          ]);
        })
        .catch(() => {
          setToasts((prev) => [
            ...prev,
            { id, fromUser: push.fromUser, name: "New message", preview: push.message.slice(0, 120), entered: false },
          ]);
        });

      setTimeout(() => dismiss(id), TOAST_DURATION_MS);
    });
  }, [isLoggedIn, subscribe, dismiss]);

  // Flip `entered` a tick after mount so the initial render starts off-screen/transparent
  // and transitions in, instead of just appearing.
  useEffect(() => {
    if (toasts.some((t) => !t.entered)) {
      const raf = requestAnimationFrame(() => {
        setToasts((prev) => prev.map((t) => ({ ...t, entered: true })));
      });
      return () => cancelAnimationFrame(raf);
    }
  }, [toasts]);

  if (toasts.length === 0) return null;

  return (
    <div className="pointer-events-none fixed right-4 top-4 z-50 flex w-full max-w-sm flex-col gap-2">
      {toasts.map((t) => (
        <Link
          key={t.id}
          className={`pointer-events-auto flex items-start gap-3 rounded-2xl border-l-4 border-pink-500 bg-white p-3 shadow-lg ring-1 ring-black/5 transition-all duration-300 ease-out hover:shadow-xl ${
            t.entered ? "translate-x-0 opacity-100" : "translate-x-6 opacity-0"
          }`}
          href={`/messages?to=${encodeURIComponent(t.fromUser)}`}
          onClick={() => dismiss(t.id)}
        >
          <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full bg-pink-50">
            <Image alt="" className="object-cover" fill sizes="40px" src={profilePhotoSrc(t.photo)} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className="truncate text-sm font-semibold text-zinc-900">{t.name}</span>
              <span className="shrink-0 rounded-full bg-pink-100 px-1.5 py-0.5 text-[10px] font-medium text-pink-700">
                New
              </span>
            </div>
            <p className="mt-0.5 line-clamp-2 text-xs text-zinc-600">{t.preview}</p>
          </div>
          <button
            aria-label="Dismiss"
            className="shrink-0 cursor-pointer rounded-full p-1 text-zinc-400 hover:bg-pink-50 hover:text-zinc-600"
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              dismiss(t.id);
            }}
          >
            <svg aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path d="M6 18 18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} />
            </svg>
          </button>
        </Link>
      ))}
    </div>
  );
}
