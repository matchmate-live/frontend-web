/**
 * Mirrors backend/src/utils/conversationId.js exactly — a 1:1 DM conversation id is a
 * pure function of the two participant subs (lexicographically ordered, so it's the same
 * regardless of who's asking), format `dm#<min-sub>#<max-sub>`. Computing it client-side
 * means the UI can open/address a conversation immediately (e.g. from a "Send message"
 * link on a profile) without a round trip just to learn its id.
 */
export function buildDmConversationId(userA: string, userB: string): string | null {
  const a = userA.trim();
  const b = userB.trim();
  if (!a || !b) return null;
  const [first, second] = a < b ? [a, b] : [b, a];
  return `dm#${first}#${second}`;
}

export function parseDmParticipants(conversationId: string): [string, string] | null {
  const parts = conversationId.split("#");
  if (parts.length !== 3 || parts[0] !== "dm") return null;
  const u1 = parts[1].trim();
  const u2 = parts[2].trim();
  if (!u1 || !u2) return null;
  return [u1, u2];
}

/** The other participant in a DM, given your own sub. */
export function otherParticipant(conversationId: string, ownSub: string): string | null {
  const pair = parseDmParticipants(conversationId);
  if (!pair) return null;
  return pair[0] === ownSub ? pair[1] : pair[1] === ownSub ? pair[0] : null;
}
