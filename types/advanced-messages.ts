/**
 * TypeScript Types for Advanced Messaging Features
 * 
 * Central location for all type definitions across messaging features
 * Ensures consistency and better IDE support
 */

// ===== WebSocket Types =====

export interface WebSocketMessage {
  type: 'message' | 'typing' | 'reaction' | 'read' | 'delete' | 'user_online' | 'user_offline';
  payload: any;
  timestamp: string;
}

export type ConnectionState = 'connecting' | 'connected' | 'disconnecting' | 'disconnected' | 'error';

export interface WebSocketHookState {
  isConnected: boolean;
  connectionState: ConnectionState;
  retryCount: number;
  lastError?: string;
}

export interface WebSocketMethods {
  sendMessage: (content: string) => Promise<Message>;
  sendTypingIndicator: (isTyping: boolean) => void;
  sendReaction: (messageId: string, emoji: string) => void;
  markAsRead: (messageId: string) => void;
  deleteMessage: (messageId: string) => void;
  disconnect: () => void;
}

// ===== Optimistic Update Types =====

export interface OptimisticMessage extends Message {
  isOptimistic: true;
  status: 'pending' | 'sent' | 'failed';
  error?: string;
}

export interface OptimisticUpdateMethods {
  addOptimisticMessage: (content: string, currentUser: User) => string;
  confirmOptimisticMessage: (optimisticId: string, realMessage: Message) => void;
  failOptimisticMessage: (optimisticId: string, error: string) => void;
  retryOptimisticMessage: (optimisticId: string) => void;
  deleteOptimisticMessage: (optimisticId: string) => void;
  updateOptimisticMessage: (messageId: string, updates: Partial<Message>) => void;
  deleteOptimistic: (messageId: string) => Message | undefined;
  restoreDeletedMessage: (message: Message) => void;
  addOptimisticReaction: (messageId: string, emoji: string, userId: string) => void;
  removeOptimisticReaction: (messageId: string, emoji: string) => void;
}

// ===== Offline Support Types =====

export interface OfflineState {
  isOnline: boolean;
  isSyncing: boolean;
  pendingCount: number;
  lastSyncTime?: string;
  errors: string[];
}

export interface OfflineSupportMethods {
  saveMessageLocally: (content: string) => Promise<void>;
  syncPendingMessages: () => Promise<void>;
  saveDraft: (content: string) => Promise<void>;
  getDraft: () => Promise<string | null>;
  deleteDraft: () => Promise<void>;
  clearErrors: () => void;
  clearConversationCache: () => Promise<void>;
  retryFailedMessages: () => Promise<void>;
  getDBManager: () => IndexedDBManager | null;
}

export interface IndexedDBStore {
  messages: Message & { savedAt: string };
  drafts: Draft;
  pendingMessages: PendingMessage;
  metadata: Metadata;
}

export interface Draft {
  id: string;
  conversationId: string;
  content: string;
  savedAt: string;
}

export interface PendingMessage extends Message {
  status: 'pending' | 'failed';
  error?: string;
  createdAt: string;
}

export interface Metadata {
  key: string;
  value: string;
}

export interface IndexedDBManager {
  init: () => Promise<void>;
  saveMessage: (message: Message) => Promise<void>;
  getMessages: (conversationId: string, limit?: number) => Promise<Message[]>;
  saveDraft: (conversationId: string, content: string) => Promise<void>;
  getDraft: (conversationId: string) => Promise<string | null>;
  deleteDraft: (conversationId: string) => Promise<void>;
  addToPendingQueue: (message: Partial<Message>) => Promise<void>;
  getPendingMessages: (conversationId?: string) => Promise<PendingMessage[]>;
  markAsSent: (pendingId: string, realMessage: Message) => Promise<void>;
  markAsFailed: (pendingId: string, error: string) => Promise<void>;
  setLastSync: (conversationId: string, timestamp: string) => Promise<void>;
  getLastSync: (conversationId: string) => Promise<string | null>;
  clearAll: () => Promise<void>;
  deleteConversationCache: (conversationId: string) => Promise<void>;
}

// ===== Virtual Scrolling Types =====

export interface VirtualizedListProps {
  items: any[];
  itemSize: number;
  height: number;
  width: string | number;
  renderItem: (index: number, item: any, style: React.CSSProperties) => React.ReactNode;
  className?: string;
  overscanCount?: number;
}

export interface MessageItemData {
  id: string;
  content: string;
  sender: User;
  timestamp: string;
  reactions?: Reaction[];
  isOptimistic?: boolean;
  status?: 'pending' | 'sent' | 'failed';
}

export interface ConversationItemData {
  id: string;
  name: string;
  avatar?: string;
  lastMessage?: string;
  timestamp?: string;
  unreadCount?: number;
  members: User[];
}

export interface VirtualizationState {
  itemSize: number;
  containerHeight: number;
  visibleItems: number;
  totalItems: number;
  shouldVirtualize: boolean;
}

// ===== Advanced Search Types =====

export interface SearchFilters {
  query: string;
  from?: string;
  startDate?: string;
  endDate?: string;
  hasReactions?: boolean;
  hasAttachments?: boolean;
  regex?: boolean;
}

export interface SearchResult extends Message {
  highlights: Array<{ start: number; end: number }>;
  snippet: string;
  matchScore: number;
}

export interface SearchState {
  debouncedResults: SearchResult[];
  isSearching: boolean;
  searchHistory: SearchFilters[];
}

export interface SearchMethods {
  search: (filters: SearchFilters) => SearchResult[];
  debouncedSearch: (filters: SearchFilters) => SearchResult[];
  getSearchSuggestions: (partialQuery: string, limit?: number) => SearchSuggestion[];
  getSearchHistory: () => SearchFilters[];
  removeFromHistory: (index: number) => void;
  clearHistory: () => void;
  getFacets: () => SearchFacets;
}

export interface SearchSuggestion {
  text: string;
  type: 'history' | 'sender' | 'content';
}

export interface SearchFacets {
  senders: Map<string, number>;
  dates: Map<string, number>;
  hasReactions: number;
}

// ===== Base Message Types =====

export interface User {
  id: string;
  username: string;
  fullName: string;
  avatar: string;
  email?: string;
  status?: 'online' | 'offline' | 'away';
  lastSeen?: string;
}

export interface Message {
  id: string;
  content: string;
  sender: User;
  conversationId: string;
  timestamp: string;
  editedAt?: string;
  readBy?: Array<{ userId: string; readAt: string }>;
  reactions?: Reaction[];
  attachments?: Attachment[];
  replyTo?: string; // Message ID if this is a reply
  mentions?: string[]; // User IDs mentioned
  pinned?: boolean;
  archived?: boolean;
}

export interface Reaction {
  emoji: string;
  count: number;
  userIds: string[];
}

export interface Attachment {
  id: string;
  type: 'image' | 'video' | 'audio' | 'document' | 'link';
  name: string;
  url: string;
  size?: number;
  mimetype?: string;
  thumbnail?: string;
}

export interface Conversation {
  id: string;
  name: string;
  avatar?: string;
  description?: string;
  type: 'direct' | 'group' | 'channel';
  members: User[];
  messages?: Message[];
  lastMessage?: Message;
  lastMessageAt?: string;
  unreadCount?: number;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  archived?: boolean;
  settings?: ConversationSettings;
}

export interface ConversationSettings {
  muteNotifications?: boolean;
  autoMarkAsRead?: boolean;
  theme?: 'light' | 'dark';
}

// ===== Hook Return Types =====

export interface UseWebSocketReturn extends WebSocketHookState, WebSocketMethods {}

export interface UseOptimisticUpdatesReturn extends OptimisticUpdateMethods {
  optimisticMessages: OptimisticMessage[];
}

export interface UseOfflineSupportReturn extends OfflineState, OfflineSupportMethods {}

export interface UseVirtualizationReturn extends VirtualizationState {}

export interface UseAdvancedMessageSearchReturn extends SearchState, SearchMethods {}

// ===== Context Types =====

export interface MessagesContextType {
  conversations: Conversation[];
  messages: Message[];
  currentConversation?: Conversation;
  currentUser?: User;
  
  // Methods
  setConversations: (conversations: Conversation[]) => void;
  setMessages: (messages: Message[]) => void;
  addMessage: (message: Message) => void;
  updateMessage: (messageId: string, updates: Partial<Message>) => void;
  deleteMessage: (messageId: string) => void;
  addConversation: (conversation: Conversation) => void;
  setCurrentConversation: (conversation: Conversation) => void;
  setCurrentUser: (user: User) => void;
}

// ===== Error Types =====

export interface WebSocketError {
  code: 'CONNECT_FAILED' | 'SEND_FAILED' | 'DISCONNECT' | 'TIMEOUT' | 'INVALID_MESSAGE';
  message: string;
  details?: any;
}

export interface IndexedDBError {
  code: 'INIT_FAILED' | 'TRANSACTION_FAILED' | 'QUOTA_EXCEEDED' | 'NOT_FOUND';
  message: string;
  storeName?: string;
  details?: any;
}

export interface SearchError {
  code: 'INVALID_REGEX' | 'INVALID_DATE' | 'INVALID_FILTER';
  message: string;
  field?: string;
}

// ===== Utility Types =====

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type Await<T> = T extends Promise<infer U> ? U : T;

export type Optional<T> = T | undefined | null;

// ===== Enum Types =====

export enum MessageType {
  TEXT = 'text',
  IMAGE = 'image',
  VIDEO = 'video',
  AUDIO = 'audio',
  DOCUMENT = 'document',
  SYSTEM = 'system',
}

export enum ConnectionStatus {
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  DISCONNECTING = 'disconnecting',
  DISCONNECTED = 'disconnected',
  ERROR = 'error',
}

// ===== Timestamp Types =====

export type ISODateTime = string; // ISO 8601 format
export type UnixTimestamp = number;

// ===== Generic Utility Types =====

export interface Response<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

// ===== Export all types for convenience =====

// export * from './message-types'; // If you have more type files
