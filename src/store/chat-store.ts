import { create } from 'zustand';
import { subscribeWithSelector, persist, devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { getRealtimeService } from '../lib/realtime-communication';
import { AdvancedCrypto } from '../lib/advanced-crypto';
import type { Message, Chat, Peer, UserProfile, TypingIndicator, FileAttachment } from '../types/message';

interface ChatState {
  // Current user
  currentUser: UserProfile | null;

  // Chats and messages
  chats: Chat[];
  messages: Record<string, Message[]>; // chatId -> messages
  activeChat: string | null;
  drafts: Record<string, string>; // chatId -> draft message

  // Peers and contacts
  peers: Peer[];
  onlinePeers: Set<string>;
  typingIndicators: TypingIndicator[];
  blockedUsers: Set<string>;

  // Files and media
  fileUploads: Record<string, FileAttachment>;
  mediaGallery: Record<string, string[]>; // chatId -> media URLs

  // UI state
  sidebarOpen: boolean;
  searchQuery: string;
  selectedMessages: Set<string>;
  replyingTo: Message | null;
  emojiPickerOpen: boolean;
  settingsOpen: boolean;

  // Advanced features
  encryptionKeys: Record<string, Uint8Array>; // userId -> shared key
  messageQueue: Message[]; // Offline message queue
  connectionStatus: 'connected' | 'disconnected' | 'reconnecting';

  // Loading states
  loading: {
    messages: boolean;
    chats: boolean;
    sendingMessage: boolean;
    fileUpload: boolean;
  };

  // Performance
  messageCache: Map<string, Message>;
  lastSyncTimestamp: number;

  // Actions
  setCurrentUser: (user: UserProfile | null) => void;

  // Chat actions
  setActiveChat: (chatId: string | null) => void;
  addChat: (chat: Chat) => void;
  updateChat: (chatId: string, updates: Partial<Chat>) => void;
  removeChat: (chatId: string) => void;

  // Message actions
  addMessage: (chatId: string, message: Message) => void;
  updateMessage: (chatId: string, messageId: string, updates: Partial<Message>) => void;
  removeMessage: (chatId: string, messageId: string) => void;
  setMessages: (chatId: string, messages: Message[]) => void;

  // Peer actions
  addPeer: (peer: Peer) => void;
  updatePeer: (publicKey: string, updates: Partial<Peer>) => void;
  removePeer: (publicKey: string) => void;
  setPeerOnline: (publicKey: string, online: boolean) => void;

  // Typing indicators
  setTyping: (indicator: TypingIndicator) => void;
  clearTyping: (chatId: string, userId: string) => void;

  // UI actions
  setSidebarOpen: (open: boolean) => void;
  setSearchQuery: (query: string) => void;
  toggleMessageSelection: (messageId: string) => void;
  clearSelectedMessages: () => void;
  setReplyingTo: (message: Message | null) => void;

  // Loading actions
  setLoading: (key: keyof ChatState['loading'], loading: boolean) => void;

  // Advanced actions
  initializeRealtime: () => void;
  sendEncryptedMessage: (chatId: string, content: string, recipientKey: string) => Promise<void>;
  uploadFile: (file: File, chatId: string) => Promise<string>;
  blockUser: (userId: string) => void;
  unblockUser: (userId: string) => void;
  saveDraft: (chatId: string, content: string) => void;
  loadDraft: (chatId: string) => string;
  syncMessages: () => Promise<void>;

  // Encryption actions
  generateSharedKey: (userId: string, theirPublicKey: Uint8Array) => void;
  getSharedKey: (userId: string) => Uint8Array | null;
}

export const useChatStore = create<ChatState>()(
  devtools(
    persist(
      subscribeWithSelector(
        immer((set, get) => ({
          // Initial state
          currentUser: null,
          chats: [],
          messages: {},
          activeChat: null,
          drafts: {},
          peers: [],
          onlinePeers: new Set(),
          typingIndicators: [],
          blockedUsers: new Set(),
          fileUploads: {},
          mediaGallery: {},
          sidebarOpen: true,
          searchQuery: '',
          selectedMessages: new Set(),
          replyingTo: null,
          emojiPickerOpen: false,
          settingsOpen: false,
          encryptionKeys: {},
          messageQueue: [],
          connectionStatus: 'disconnected' as const,
          loading: {
            messages: false,
            chats: false,
            sendingMessage: false,
            fileUpload: false,
          },
          messageCache: new Map(),
          lastSyncTimestamp: 0,

    // User actions
    setCurrentUser: (user) => set({ currentUser: user }),

    // Chat actions
    setActiveChat: (chatId) => set({ activeChat: chatId }),

    addChat: (chat) => set((state) => ({
      chats: [...state.chats, chat],
      messages: { ...state.messages, [chat.id]: [] }
    })),

    updateChat: (chatId, updates) => set((state) => ({
      chats: state.chats.map(chat =>
        chat.id === chatId ? { ...chat, ...updates } : chat
      )
    })),

    removeChat: (chatId) => set((state) => {
      const newMessages = { ...state.messages };
      delete newMessages[chatId];
      return {
        chats: state.chats.filter(chat => chat.id !== chatId),
        messages: newMessages,
        activeChat: state.activeChat === chatId ? null : state.activeChat
      };
    }),

    // Message actions
    addMessage: (chatId, message) => set((state) => {
      const chatMessages = state.messages[chatId] || [];
      const newMessages = {
        ...state.messages,
        [chatId]: [...chatMessages, message].sort((a, b) => a.timestamp - b.timestamp)
      };

      // Update chat's last message and activity
      const updatedChats = state.chats.map(chat =>
        chat.id === chatId
          ? {
              ...chat,
              lastMessage: message,
              lastActivity: message.timestamp,
              unreadCount: chat.id === state.activeChat ? 0 : chat.unreadCount + 1
            }
          : chat
      );

      return {
        messages: newMessages,
        chats: updatedChats
      };
    }),

    updateMessage: (chatId, messageId, updates) => set((state) => ({
      messages: {
        ...state.messages,
        [chatId]: (state.messages[chatId] || []).map(msg =>
          msg.id === messageId ? { ...msg, ...updates } : msg
        )
      }
    })),

    removeMessage: (chatId, messageId) => set((state) => ({
      messages: {
        ...state.messages,
        [chatId]: (state.messages[chatId] || []).filter(msg => msg.id !== messageId)
      }
    })),

    setMessages: (chatId, messages) => set((state) => ({
      messages: {
        ...state.messages,
        [chatId]: messages.sort((a, b) => a.timestamp - b.timestamp)
      }
    })),

    // Peer actions
    addPeer: (peer) => set((state) => {
      const existingIndex = state.peers.findIndex(p => p.publicKey === peer.publicKey);
      if (existingIndex >= 0) {
        const newPeers = [...state.peers];
        newPeers[existingIndex] = { ...newPeers[existingIndex], ...peer };
        return { peers: newPeers };
      }
      return { peers: [...state.peers, peer] };
    }),

    updatePeer: (publicKey, updates) => set((state) => ({
      peers: state.peers.map(peer =>
        peer.publicKey === publicKey ? { ...peer, ...updates } : peer
      )
    })),

    removePeer: (publicKey) => set((state) => ({
      peers: state.peers.filter(peer => peer.publicKey !== publicKey)
    })),

    setPeerOnline: (publicKey, online) => set((state) => {
      const newOnlinePeers = new Set(state.onlinePeers);
      if (online) {
        newOnlinePeers.add(publicKey);
      } else {
        newOnlinePeers.delete(publicKey);
      }

      return {
        onlinePeers: newOnlinePeers,
        peers: state.peers.map(peer =>
          peer.publicKey === publicKey
            ? { ...peer, isOnline: online, lastSeen: online ? Date.now() : peer.lastSeen }
            : peer
        )
      };
    }),

    // Typing indicators
    setTyping: (indicator) => set((state) => {
      const filtered = state.typingIndicators.filter(
        t => !(t.chatId === indicator.chatId && t.userId === indicator.userId)
      );
      return {
        typingIndicators: [...filtered, indicator]
      };
    }),

    clearTyping: (chatId, userId) => set((state) => ({
      typingIndicators: state.typingIndicators.filter(
        t => !(t.chatId === chatId && t.userId === userId)
      )
    })),

    // UI actions
    setSidebarOpen: (open) => set({ sidebarOpen: open }),
    setSearchQuery: (query) => set({ searchQuery: query }),

    toggleMessageSelection: (messageId) => set((state) => {
      const newSelected = new Set(state.selectedMessages);
      if (newSelected.has(messageId)) {
        newSelected.delete(messageId);
      } else {
        newSelected.add(messageId);
      }
      return { selectedMessages: newSelected };
    }),

    clearSelectedMessages: () => set({ selectedMessages: new Set() }),
    setReplyingTo: (message) => set({ replyingTo: message }),

    // Loading actions
    setLoading: (key, loading) => set((state) => ({
      loading: { ...state.loading, [key]: loading }
    })),

    // Advanced actions
    initializeRealtime: () => {
      const realtimeService = getRealtimeService();
      const currentUser = get().currentUser;

      if (currentUser) {
        realtimeService.connect(currentUser.publicKey);

        // Set up event handlers
        realtimeService.onMessage((message) => {
          get().addMessage(message.recipient, message);
        });

        realtimeService.onConnectionStatus((status) => {
          set({ connectionStatus: status });
        });

        realtimeService.onPresence((presence) => {
          get().setPeerOnline(presence.userId, presence.status === 'online');
        });
      }
    },

    sendEncryptedMessage: async (chatId, content, recipientKey) => {
      const state = get();
      const currentUser = state.currentUser;

      if (!currentUser) throw new Error('No current user');

      try {
        set((state) => ({ loading: { ...state.loading, sendingMessage: true } }));

        // Generate or get shared key
        let sharedKey = state.encryptionKeys[recipientKey];
        if (!sharedKey) {
          // In a real implementation, perform key exchange
          sharedKey = new Uint8Array(32); // Mock key
          state.encryptionKeys[recipientKey] = sharedKey;
        }

        // Encrypt message
        const encryptedData = AdvancedCrypto.encryptWithSharedSecret(content, sharedKey);

        const message: Message = {
          id: AdvancedCrypto.generateSecureId(),
          sender: currentUser.publicKey,
          senderUsername: currentUser.username,
          recipient: recipientKey,
          content: content, // Store plaintext locally
          encrypted: encryptedData.encrypted,
          nonce: encryptedData.nonce,
          timestamp: Date.now(),
          status: 'sending',
          messageType: 'text',
        };

        // Add to local state immediately
        get().addMessage(chatId, message);

        // Send via realtime service
        const realtimeService = getRealtimeService();
        await realtimeService.sendMessage(
          encryptedData.encrypted,
          recipientKey,
          new Uint8Array(32) // Mock private key
        );

        // Update status to sent
        get().updateMessage(chatId, message.id, { status: 'sent' });

      } catch (error) {
        console.error('Failed to send encrypted message:', error);
        throw error;
      } finally {
        set((state) => ({ loading: { ...state.loading, sendingMessage: false } }));
      }
    },

    uploadFile: async (file, chatId) => {
      const fileId = AdvancedCrypto.generateSecureId();

      try {
        set((state) => ({ loading: { ...state.loading, fileUpload: true } }));

        // Create file attachment
        const attachment: FileAttachment = {
          id: fileId,
          name: file.name,
          size: file.size,
          type: file.type,
          url: URL.createObjectURL(file), // Mock URL
          uploadProgress: 0,
          encrypted: true,
        };

        set((state) => ({
          fileUploads: { ...state.fileUploads, [fileId]: attachment }
        }));

        // Simulate upload progress
        for (let progress = 0; progress <= 100; progress += 10) {
          await new Promise(resolve => setTimeout(resolve, 100));
          set((state) => ({
            fileUploads: {
              ...state.fileUploads,
              [fileId]: { ...state.fileUploads[fileId], uploadProgress: progress }
            }
          }));
        }

        return attachment.url;

      } catch (error) {
        console.error('File upload failed:', error);
        throw error;
      } finally {
        set((state) => ({ loading: { ...state.loading, fileUpload: false } }));
      }
    },

    blockUser: (userId) => set((state) => ({
      blockedUsers: new Set([...state.blockedUsers, userId])
    })),

    unblockUser: (userId) => set((state) => {
      const newBlockedUsers = new Set(state.blockedUsers);
      newBlockedUsers.delete(userId);
      return { blockedUsers: newBlockedUsers };
    }),

    saveDraft: (chatId, content) => set((state) => ({
      drafts: { ...state.drafts, [chatId]: content }
    })),

    loadDraft: (chatId) => get().drafts[chatId] || '',

    syncMessages: async () => {
      // Mock sync implementation
      const state = get();
      const currentTime = Date.now();

      set({ lastSyncTimestamp: currentTime });

      // In a real implementation, sync with server
      console.log('Messages synced at:', new Date(currentTime));
    },

    generateSharedKey: (userId, theirPublicKey) => {
      // Mock key generation
      const sharedKey = new Uint8Array(32);
      crypto.getRandomValues(sharedKey);

      set((state) => ({
        encryptionKeys: { ...state.encryptionKeys, [userId]: sharedKey }
      }));
    },

    getSharedKey: (userId) => get().encryptionKeys[userId] || null,
        }))
      ),
      {
        name: 'sol-chat-store',
        partialize: (state) => ({
          currentUser: state.currentUser,
          chats: state.chats,
          messages: state.messages,
          peers: state.peers,
          drafts: state.drafts,
          encryptionKeys: {}, // Don't persist encryption keys for security
          lastSyncTimestamp: state.lastSyncTimestamp,
        }),
      }
    ),
    {
      name: 'sol-chat-store',
    }
  )
);

// Selectors for computed values
export const useActiveChat = () => {
  const { chats, activeChat } = useChatStore();
  return chats.find(chat => chat.id === activeChat) || null;
};

export const useActiveChatMessages = () => {
  const { messages, activeChat } = useChatStore();
  return activeChat ? messages[activeChat] || [] : [];
};

export const useUnreadCount = () => {
  const { chats } = useChatStore();
  return chats.reduce((total, chat) => total + chat.unreadCount, 0);
};

export const usePeerByPublicKey = (publicKey: string) => {
  const { peers } = useChatStore();
  return peers.find(peer => peer.publicKey === publicKey) || null;
};

export const useTypingInChat = (chatId: string) => {
  const { typingIndicators } = useChatStore();
  return typingIndicators.filter(t => t.chatId === chatId);
};
