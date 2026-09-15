export type Message = {
  conversationId: string;
  createdAt: string;
  messageId: string;
  fromUser: string;
  toUser: string;
  message: string;
};

export type ConversationSummary = {
  conversationId: string;
  otherUserId: string;
  lastMessageAt: number;
  lastCreatedAt: string;
  lastMessageId: string;
  lastMessagePreview: string;
};

export type ConversationsResponse = {
  items: ConversationSummary[];
  count: number;
  limit: number;
  nextToken: string | null;
};

export type MessagesResponse = {
  items: Message[];
  count: number;
  limit: number;
  nextToken: string | null;
};

/** Real-time push from the server over the WebSocket — someone else's message arriving live. */
export type IncomingMessagePush = {
  type: "message";
  messageId: string;
  conversationId: string;
  createdAt: string;
  fromUser: string;
  toUser: string;
  message: string;
};

/** Response to this connection's own `sendMessage` call, delivered back over the same socket. */
export type SendMessageAck = {
  ok: boolean;
  message?: Message;
  delivered?: number;
  lastSeenUpdated?: boolean;
  lastSeenAt?: number | null;
};
