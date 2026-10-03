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

// An incoming message pushed over the WebSocket.
export type IncomingMessagePush = {
  type: "message";
  messageId: string;
  conversationId: string;
  createdAt: string;
  fromUser: string;
  toUser: string;
  message: string;
};

// Confirmation for a message you sent.
export type SendMessageAck = {
  ok: boolean;
  message?: Message;
  delivered?: number;
};
