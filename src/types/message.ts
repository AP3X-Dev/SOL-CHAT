export interface Message {
  id: string;
  sender: string;
  senderUsername?: string;
  recipient: string;
  content: string;
  encrypted?: string;
  nonce: string;
  timestamp: number;
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  fileType?: string;
  status: 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
  confirmationTime?: number;
  replyTo?: string; // Message ID this is replying to
  reactions?: MessageReaction[];
  edited?: boolean;
  editedAt?: number;
  threadId?: string;
  messageType: 'text' | 'file' | 'image' | 'voice' | 'system';
}

export interface MessageReaction {
  emoji: string;
  users: string[]; // Public keys of users who reacted
  count: number;
}

export interface Peer {
  publicKey: string;
  username?: string;
  nickname?: string;
  lastSeen: number;
  messageCount: number;
  isOnline?: boolean;
  avatar?: string;
  status?: 'online' | 'away' | 'busy' | 'offline';
  lastActivity?: number;
  isTyping?: boolean;
  mutualContacts?: number;
  trustScore?: number;
}

export interface UserProfile {
  publicKey: string;
  username: string;
  displayName?: string;
  bio?: string;
  avatar?: string;
  updatedAt: number;
  peerNicknames?: Record<string, string>;
  preferences?: UserPreferences;
  solanaNameService?: string; // SNS domain
  verified?: boolean;
  createdAt: number;
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'auto';
  notifications: {
    sound: boolean;
    desktop: boolean;
    mentions: boolean;
  };
  privacy: {
    showOnlineStatus: boolean;
    allowDirectMessages: boolean;
    showReadReceipts: boolean;
  };
  chat: {
    enterToSend: boolean;
    showTimestamps: boolean;
    compactMode: boolean;
  };
}

export interface Chat {
  id: string;
  type: 'direct' | 'group' | 'channel';
  participants: string[]; // Public keys
  name?: string; // For groups/channels
  description?: string;
  avatar?: string;
  createdBy: string;
  createdAt: number;
  lastMessage?: Message;
  lastActivity: number;
  unreadCount: number;
  isPinned: boolean;
  isMuted: boolean;
  isArchived: boolean;
  permissions?: ChatPermissions;
}

export interface ChatPermissions {
  canAddMembers: string[];
  canRemoveMembers: string[];
  canEditInfo: string[];
  canDeleteMessages: string[];
  isPublic: boolean;
}

export interface TypingIndicator {
  chatId: string;
  userId: string;
  username: string;
  timestamp: number;
}

export interface FileAttachment {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
  thumbnail?: string;
  uploadProgress?: number;
  encrypted: boolean;
}

export interface SolanaNameRecord {
  domain: string;
  owner: string;
  resolver: string;
  ttl: number;
  records: Record<string, string>;
  createdAt: number;
  expiresAt: number;
}