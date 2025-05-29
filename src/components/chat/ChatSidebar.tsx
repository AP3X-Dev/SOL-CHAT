import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  MessageCircle, 
  Users, 
  Hash, 
  Pin, 
  Archive, 
  Plus,
  MoreHorizontal,
  AtSign,
  Crown,
  Volume2,
  VolumeX
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { formatDisplayName } from '../../lib/solana-name-service';
import type { Chat } from '../../types/message';

interface Props {
  chats: Chat[];
  activeChat: string | null;
  onChatSelect: (chatId: string) => void;
  onNewChat: () => void;
}

export const ChatSidebar: React.FC<Props> = ({
  chats,
  activeChat,
  onChatSelect,
  onNewChat,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'unread' | 'groups' | 'direct'>('all');

  const filteredChats = chats.filter(chat => {
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesName = chat.name?.toLowerCase().includes(query);
      const matchesParticipants = chat.participants.some(p => 
        p.toLowerCase().includes(query)
      );
      if (!matchesName && !matchesParticipants) return false;
    }

    // Apply type filter
    switch (filter) {
      case 'unread':
        return chat.unreadCount > 0;
      case 'groups':
        return chat.type === 'group';
      case 'direct':
        return chat.type === 'direct';
      default:
        return true;
    }
  }).sort((a, b) => {
    // Sort by pinned first, then by last activity
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return b.lastActivity - a.lastActivity;
  });

  const getChatDisplayName = (chat: Chat) => {
    if (chat.name) return chat.name;
    if (chat.type === 'direct') {
      // For direct chats, show the other participant's name
      const otherParticipant = chat.participants.find(p => p !== chat.createdBy);
      return formatDisplayName(otherParticipant || 'Unknown');
    }
    return 'Unknown Chat';
  };

  const getChatIcon = (chat: Chat) => {
    if (chat.type === 'group') return Hash;
    if (chat.type === 'channel') return Hash;
    return MessageCircle;
  };

  const formatLastActivity = (timestamp: number) => {
    try {
      return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
    } catch {
      return 'Unknown';
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-text">Chats</h2>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onNewChat}
            className="p-2 hover:bg-card-highlight rounded-lg transition-colors"
            title="New Chat"
          >
            <Plus className="w-4 h-4 text-text-muted" />
          </motion.button>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search chats..."
            className="w-full pl-10 pr-4 py-2 bg-card-highlight border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>

        {/* Filters */}
        <div className="flex space-x-1">
          {[
            { key: 'all', label: 'All' },
            { key: 'unread', label: 'Unread' },
            { key: 'direct', label: 'Direct' },
            { key: 'groups', label: 'Groups' },
          ].map((filterOption) => (
            <button
              key={filterOption.key}
              onClick={() => setFilter(filterOption.key as any)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                filter === filterOption.key
                  ? 'bg-primary text-white'
                  : 'bg-card-highlight text-text-muted hover:text-text'
              }`}
            >
              {filterOption.label}
            </button>
          ))}
        </div>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto">
        {filteredChats.length === 0 ? (
          <div className="p-8 text-center">
            {searchQuery ? (
              <div className="space-y-2">
                <Search className="w-8 h-8 mx-auto text-text-muted/50" />
                <p className="text-text-muted">No chats found matching "{searchQuery}"</p>
              </div>
            ) : (
              <div className="space-y-4">
                <MessageCircle className="w-12 h-12 mx-auto text-text-muted/50" />
                <div className="space-y-2">
                  <p className="text-text-muted">No chats yet</p>
                  <p className="text-sm text-text-muted">
                    Start a conversation to see your chats here
                  </p>
                </div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onNewChat}
                  className="px-4 py-2 bg-gradient-primary text-white rounded-lg text-sm font-medium"
                >
                  Start First Chat
                </motion.button>
              </div>
            )}
          </div>
        ) : (
          <div className="p-2">
            <AnimatePresence>
              {filteredChats.map((chat, index) => {
                const IconComponent = getChatIcon(chat);
                const isActive = chat.id === activeChat;
                
                return (
                  <motion.button
                    key={chat.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2, delay: index * 0.05 }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => onChatSelect(chat.id)}
                    className={`w-full p-3 rounded-lg transition-all group text-left relative ${
                      isActive 
                        ? 'bg-primary/10 border border-primary/20' 
                        : 'hover:bg-card-highlight'
                    }`}
                  >
                    {/* Active indicator */}
                    {isActive && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary rounded-r-full" />
                    )}

                    <div className="flex items-start space-x-3">
                      {/* Chat Icon/Avatar */}
                      <div className="relative">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                          chat.type === 'group' 
                            ? 'bg-gradient-secondary' 
                            : 'bg-gradient-primary'
                        }`}>
                          <IconComponent className="w-6 h-6 text-white" />
                        </div>
                        
                        {/* Pinned indicator */}
                        {chat.isPinned && (
                          <div className="absolute -top-1 -right-1 w-4 h-4 bg-warning rounded-full flex items-center justify-center">
                            <Pin className="w-2.5 h-2.5 text-white" />
                          </div>
                        )}
                      </div>

                      {/* Chat Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2 min-w-0">
                            <p className={`font-medium truncate ${
                              isActive ? 'text-primary' : 'text-text'
                            }`}>
                              {getChatDisplayName(chat)}
                            </p>
                            
                            {/* Chat type indicators */}
                            {chat.type === 'group' && (
                              <Users className="w-3 h-3 text-text-muted flex-shrink-0" />
                            )}
                            
                            {/* Muted indicator */}
                            {chat.isMuted && (
                              <VolumeX className="w-3 h-3 text-text-muted flex-shrink-0" />
                            )}
                          </div>
                          
                          {/* Unread count */}
                          {chat.unreadCount > 0 && (
                            <div className="bg-primary text-white text-xs font-medium px-2 py-1 rounded-full min-w-[20px] text-center">
                              {chat.unreadCount > 99 ? '99+' : chat.unreadCount}
                            </div>
                          )}
                        </div>
                        
                        {/* Last message preview */}
                        <div className="flex items-center justify-between mt-1">
                          <p className="text-sm text-text-muted truncate">
                            {chat.lastMessage?.content || 'No messages yet'}
                          </p>
                          <span className="text-xs text-text-muted flex-shrink-0 ml-2">
                            {formatLastActivity(chat.lastActivity)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Hover actions */}
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          // Handle more options
                        }}
                        className="p-1 hover:bg-card-highlight rounded transition-colors"
                      >
                        <MoreHorizontal className="w-4 h-4 text-text-muted" />
                      </button>
                    </div>
                  </motion.button>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-border">
        <div className="flex items-center justify-between text-xs text-text-muted">
          <span>
            {filteredChats.length} chat{filteredChats.length !== 1 ? 's' : ''}
          </span>
          <div className="flex items-center space-x-2">
            {chats.reduce((total, chat) => total + chat.unreadCount, 0) > 0 && (
              <span className="text-primary font-medium">
                {chats.reduce((total, chat) => total + chat.unreadCount, 0)} unread
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
