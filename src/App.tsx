import React, { useState, useEffect } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { motion, AnimatePresence } from 'framer-motion';
import { WalletContextProvider } from './components/WalletContextProvider';
import { ThemeToggle, useTheme } from './components/ThemeProvider';
import { ProfileSetup } from './components/ProfileSetup';
import { AdvancedChatInterface } from './components/chat/AdvancedChatInterface';
import { EnhancedPeerList } from './components/chat/EnhancedPeerList';
import { ChatSidebar } from './components/chat/ChatSidebar';
import { GroupChatManager } from './components/chat/GroupChatManager';
import { UsernameNFTManager } from './components/chat/UsernameNFTManager';
import { useChatStore } from './store/chat-store';
import { getLocalProfile } from './lib/profile';
import { getRealtimeService } from './lib/realtime-communication';
import { getSolanaNameService } from './lib/solana-name-service';
import {
  MessageCircle,
  Users,
  Plus,
  Settings,
  Search,
  Hash,
  AtSign,
  Crown,
  Zap
} from 'lucide-react';
import type { Message, Peer, UserProfile, Chat } from './types/message';

function MessengerApp() {
  const { publicKey, signMessage } = useWallet();
  const { connection } = useConnection();
  const { theme } = useTheme();

  // Chat store state
  const {
    currentUser,
    activeChat,
    chats,
    peers,
    connectionStatus,
    setCurrentUser,
    setActiveChat,
    initializeRealtime,
    addChat,
    addPeer,
  } = useChatStore();

  // Local state
  const [showGroupManager, setShowGroupManager] = useState(false);
  const [showUsernameManager, setShowUsernameManager] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize app when wallet connects
  useEffect(() => {
    const initializeApp = async () => {
      if (publicKey && !isInitialized) {
        try {
          // Load user profile
          const userProfile = await getLocalProfile();
          if (userProfile) {
            setCurrentUser(userProfile);

            // Initialize real-time services
            initializeRealtime();

            // Initialize SNS service
            const sns = getSolanaNameService(connection);

            setIsInitialized(true);
          }
        } catch (error) {
          console.error('Failed to initialize app:', error);
        }
      }
    };

    initializeApp();
  }, [publicKey, connection, isInitialized, setCurrentUser, initializeRealtime]);

  // Chat management functions
  const createDirectChat = async (peerPublicKey: string, peerUsername?: string) => {
    // Check if chat already exists
    const existingChat = chats.find(chat =>
      chat.type === 'direct' &&
      chat.participants.includes(peerPublicKey) &&
      chat.participants.includes(publicKey!.toString())
    );

    if (existingChat) {
      setActiveChat(existingChat.id);
      return existingChat.id;
    }

    // Create new direct chat
    const chatId = `direct_${publicKey!.toString()}_${peerPublicKey}_${Date.now()}`;
    const newChat: Chat = {
      id: chatId,
      type: 'direct',
      participants: [publicKey!.toString(), peerPublicKey],
      createdBy: publicKey!.toString(),
      createdAt: Date.now(),
      lastActivity: Date.now(),
      unreadCount: 0,
      isPinned: false,
      isMuted: false,
      isArchived: false,
    };

    addChat(newChat);
    setActiveChat(chatId);

    // Add peer if not exists
    const existingPeer = peers.find(p => p.publicKey === peerPublicKey);
    if (!existingPeer) {
      const newPeer: Peer = {
        publicKey: peerPublicKey,
        username: peerUsername,
        lastSeen: Date.now(),
        messageCount: 0,
        isOnline: false,
        status: 'offline',
      };
      addPeer(newPeer);
    }

    return chatId;
  };

  const createGroupChat = (name: string, participants: string[]) => {
    const chatId = `group_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newChat: Chat = {
      id: chatId,
      type: 'group',
      name,
      participants: [publicKey!.toString(), ...participants],
      createdBy: publicKey!.toString(),
      createdAt: Date.now(),
      lastActivity: Date.now(),
      unreadCount: 0,
      isPinned: false,
      isMuted: false,
      isArchived: false,
      permissions: {
        canAddMembers: [publicKey!.toString()],
        canRemoveMembers: [publicKey!.toString()],
        canEditInfo: [publicKey!.toString()],
        canDeleteMessages: [publicKey!.toString()],
        isPublic: false,
      },
    };

    addChat(newChat);
    setActiveChat(chatId);
    setShowGroupManager(false);

    return chatId;
  };

  // Get active chat details
  const getActiveChatDetails = () => {
    if (!activeChat) return null;

    const chat = chats.find(c => c.id === activeChat);
    if (!chat) return null;

    if (chat.type === 'direct') {
      const otherParticipant = chat.participants.find(p => p !== publicKey!.toString());
      const peer = peers.find(p => p.publicKey === otherParticipant);
      return {
        id: chat.id,
        name: peer?.username || peer?.nickname || `${otherParticipant?.slice(0, 4)}...${otherParticipant?.slice(-4)}`,
        recipientId: otherParticipant!,
        isOnline: peer?.isOnline || false,
        type: 'direct' as const,
      };
    } else {
      return {
        id: chat.id,
        name: chat.name || 'Group Chat',
        recipientId: '', // Not applicable for groups
        isOnline: false,
        type: 'group' as const,
      };
    }
  };

  const activeChatDetails = getActiveChatDetails();

  if (!publicKey) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 relative overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-secondary/10" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(var(--primary-rgb),0.1),transparent_50%)]" />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="relative z-10 flex flex-col items-center mb-8"
        >
          <motion.img
            src="/logo.png"
            alt="SOL-CHAT Logo"
            className="w-32 h-auto mb-4"
            animate={{ rotate: [0, 5, -5, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          />
          <h1 className="text-5xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-2">
            SOL-CHAT
          </h1>
          <p className="text-text-muted text-lg">
            Decentralized messaging on Solana
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="relative z-10 card p-8 max-w-md w-full text-center space-y-6 shadow-elevation-3 border-border backdrop-blur-sm bg-foreground/80"
        >
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-text">Welcome to the Future</h2>
            <p className="text-text-muted">
              Connect your Solana wallet to start secure, decentralized messaging with end-to-end encryption.
            </p>

            <div className="flex items-center justify-center space-x-4 text-sm text-text-muted">
              <div className="flex items-center space-x-1">
                <Zap className="w-4 h-4 text-primary" />
                <span>Real-time</span>
              </div>
              <div className="flex items-center space-x-1">
                <Crown className="w-4 h-4 text-secondary" />
                <span>Encrypted</span>
              </div>
              <div className="flex items-center space-x-1">
                <AtSign className="w-4 h-4 text-tertiary" />
                <span>Username NFTs</span>
              </div>
            </div>
          </div>

          <WalletMultiButton className="!bg-gradient-primary hover:opacity-90 transition-all !rounded-xl !font-semibold !py-3 !px-6 !text-base shadow-lg hover:shadow-xl" />
        </motion.div>

        <div className="absolute top-4 right-4">
          <ThemeToggle />
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-background relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5" />
        <div className="absolute top-4 right-4">
          <ThemeToggle />
        </div>
        <ProfileSetup
          publicKey={publicKey.toString()}
          onComplete={() => window.location.reload()}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 pointer-events-none" />

      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 bg-foreground/80 backdrop-blur-sm shadow-sm border-b border-border"
      >
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="flex items-center space-x-3"
            >
              <img src="/logo.png" alt="SOL-CHAT Logo" className="h-8 w-auto" />
              <h1 className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                SOL-CHAT
              </h1>
            </motion.div>

            {/* Connection Status */}
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${
                connectionStatus === 'connected' ? 'bg-success' :
                connectionStatus === 'reconnecting' ? 'bg-warning animate-pulse' :
                'bg-error'
              }`} />
              <span className="text-xs text-text-muted">
                {connectionStatus === 'connected' ? 'Connected' :
                 connectionStatus === 'reconnecting' ? 'Reconnecting...' :
                 'Disconnected'}
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {/* User Info */}
            <div className="hidden md:flex items-center space-x-3 bg-card-highlight px-4 py-2 rounded-xl">
              <div className="w-8 h-8 bg-gradient-primary rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-medium">
                  {currentUser.username?.charAt(0)?.toUpperCase() || '?'}
                </span>
              </div>
              <div className="text-left">
                <p className="text-sm font-medium text-text">{currentUser.username}</p>
                <p className="text-xs text-text-muted">
                  {currentUser.solanaNameService ? 'SNS Verified' : 'Local Profile'}
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowUsernameManager(true)}
              className="p-2 hover:bg-card-highlight rounded-lg transition-colors"
              title="Manage Username NFT"
            >
              <AtSign className="w-5 h-5 text-text-muted" />
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowGroupManager(true)}
              className="p-2 hover:bg-card-highlight rounded-lg transition-colors"
              title="Create Group Chat"
            >
              <Plus className="w-5 h-5 text-text-muted" />
            </motion.button>

            <ThemeToggle />
            <WalletMultiButton className="!bg-gradient-tertiary hover:opacity-90 transition-all !rounded-lg !text-sm" />
          </div>
        </div>
      </motion.header>

      {/* Main Content */}
      <main className="flex-1 flex relative z-10">
        {/* Chat Sidebar */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="w-80 bg-foreground border-r border-border flex flex-col"
        >
          <ChatSidebar
            chats={chats}
            activeChat={activeChat}
            onChatSelect={setActiveChat}
            onNewChat={() => setShowGroupManager(true)}
          />
        </motion.div>

        {/* Chat Interface */}
        <div className="flex-1 flex flex-col">
          {activeChatDetails ? (
            <AdvancedChatInterface
              chatId={activeChatDetails.id}
              recipientId={activeChatDetails.recipientId}
              recipientName={activeChatDetails.name}
              isOnline={activeChatDetails.isOnline}
            />
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex-1 flex items-center justify-center bg-background"
            >
              <div className="text-center space-y-6 max-w-md">
                <motion.div
                  animate={{ rotate: [0, 5, -5, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                >
                  <MessageCircle className="w-24 h-24 mx-auto text-text-muted/50" />
                </motion.div>
                <div className="space-y-2">
                  <h3 className="text-xl font-semibold text-text">Welcome to SOL-CHAT</h3>
                  <p className="text-text-muted">
                    Select a chat from the sidebar or start a new conversation to begin messaging.
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowGroupManager(true)}
                    className="px-6 py-3 bg-gradient-primary text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all"
                  >
                    Start New Chat
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowUsernameManager(true)}
                    className="px-6 py-3 bg-gradient-secondary text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all"
                  >
                    Claim Username NFT
                  </motion.button>
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* Persistent Peer List */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="w-80 bg-foreground border-l border-border"
        >
          <EnhancedPeerList
            peers={peers}
            onPeerSelect={(peerPublicKey, peerUsername) => {
              createDirectChat(peerPublicKey, peerUsername);
            }}
            onStartGroupChat={() => setShowGroupManager(true)}
          />
        </motion.div>
      </main>

      {/* Modals */}
      <AnimatePresence>
        {showGroupManager && (
          <GroupChatManager
            onClose={() => setShowGroupManager(false)}
            onCreateGroup={createGroupChat}
            availablePeers={peers}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showUsernameManager && (
          <UsernameNFTManager
            onClose={() => setShowUsernameManager(false)}
            currentUser={currentUser}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function App() {
  return (
    <WalletContextProvider>
      <MessengerApp />
    </WalletContextProvider>
  );
}

export default App;