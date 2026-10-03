// Same as the backend's conversationId.js: dm#<smaller sub>#<larger sub>. Working it out
// here lets us open a chat straight away without asking the server for the id.
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

// The other person in a conversation.
export function otherParticipant(conversationId: string, ownSub: string): string | null {
  const pair = parseDmParticipants(conversationId);
  if (!pair) return null;
  return pair[0] === ownSub ? pair[1] : pair[1] === ownSub ? pair[0] : null;
}
