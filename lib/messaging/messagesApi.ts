import { authHeader } from "@/lib/api/authHeader";
import { throwApiError } from "@/lib/api/clientError";
import type { ConversationsResponse, MessagesResponse } from "./types";

export async function fetchConversations(nextToken?: string | null): Promise<ConversationsResponse> {
  const headers = await authHeader();
  const url = new URL("/api/conversations", window.location.origin);
  if (nextToken) url.searchParams.set("nextToken", nextToken);
  const res = await fetch(url.toString(), { headers, cache: "no-store" });
  if (!res.ok) {
    await throwApiError(res);
  }
  return res.json() as Promise<ConversationsResponse>;
}

export async function fetchMessages(
  conversationId: string,
  nextToken?: string | null,
): Promise<MessagesResponse> {
  const headers = await authHeader();
  const url = new URL(`/api/messages/${encodeURIComponent(conversationId)}`, window.location.origin);
  if (nextToken) url.searchParams.set("nextToken", nextToken);
  const res = await fetch(url.toString(), { headers, cache: "no-store" });
  if (!res.ok) {
    await throwApiError(res);
  }
  return res.json() as Promise<MessagesResponse>;
}
