import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Check,
  CheckCheck,
  Clock,
  Copy,
  Reply,
  Forward,
  Trash2,
  Edit3,
  MoreHorizontal,
  Download,
  Eye,
  Heart,
  Smile,
  Lock,
  Shield,
  X,
  FileText
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useToast } from '../ui/Toast';
import { MessageReactions } from './MessageReactions';
import { MessageContextMenu } from './MessageContextMenu';
import type { Message } from '../../types/message';

interface Props {
  message: Message;
  isOwn: boolean;
  isSelected: boolean;
  onSelect: () => void;
  onReply: () => void;
  showAvatar?: boolean;
  showTimestamp?: boolean;
}

export const AdvancedMessageBubble: React.FC<Props> = ({
  message,
  isOwn,
  isSelected,
  onSelect,
  onReply,
  showAvatar = true,
  showTimestamp = true,
}) => {
  const { success } = useToast();
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [showReactions, setShowReactions] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const messageRef = useRef<HTMLDivElement>(null);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      success('Copied!', 'Message copied to clipboard');
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const getStatusIcon = () => {
    switch (message.status) {
      case 'sending':
        return <Clock className="w-3 h-3 text-text-muted animate-pulse" />;
      case 'sent':
        return <Check className="w-3 h-3 text-text-muted" />;
      case 'delivered':
        return <CheckCheck className="w-3 h-3 text-text-muted" />;
      case 'read':
        return <CheckCheck className="w-3 h-3 text-primary" />;
      case 'failed':
        return <X className="w-3 h-3 text-error" />;
      default:
        return null;
    }
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  const bubbleVariants = {
    initial: { opacity: 0, y: 20, scale: 0.95 },
    animate: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        type: 'spring',
        stiffness: 300,
        damping: 30,
      }
    },
    exit: {
      opacity: 0,
      y: -20,
      scale: 0.95,
      transition: { duration: 0.2 }
    },
    hover: {
      scale: 1.02,
      transition: { duration: 0.1 }
    }
  };

  const selectionVariants = {
    selected: {
      scale: 0.98,
      backgroundColor: 'rgba(var(--primary-rgb), 0.1)',
      transition: { duration: 0.2 }
    },
    unselected: {
      scale: 1,
      backgroundColor: 'transparent',
      transition: { duration: 0.2 }
    }
  };

  return (
    <motion.div
      ref={messageRef}
      variants={bubbleVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      whileHover="hover"
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className={`flex ${isOwn ? 'justify-end' : 'justify-start'} group relative`}
    >
      <motion.div
        variants={selectionVariants}
        animate={isSelected ? 'selected' : 'unselected'}
        className={`max-w-[70%] relative ${isSelected ? 'ring-2 ring-primary/50 rounded-lg' : ''}`}
      >
        {/* Avatar for received messages */}
        {!isOwn && showAvatar && (
          <div className="absolute -left-10 bottom-0">
            <div className="w-8 h-8 bg-gradient-secondary rounded-full flex items-center justify-center">
              <span className="text-white text-xs font-medium">
                {message.senderUsername?.charAt(0)?.toUpperCase() || '?'}
              </span>
            </div>
          </div>
        )}

        {/* Message Bubble */}
        <div
          className={`relative rounded-2xl px-4 py-3 shadow-sm ${
            isOwn
              ? 'bg-gradient-primary text-white rounded-br-md'
              : 'bg-card-highlight border border-border rounded-bl-md'
          }`}
        >
          {/* Encryption indicator */}
          {message.encrypted && (
            <div className="absolute -top-2 -right-2 w-5 h-5 bg-success rounded-full flex items-center justify-center">
              <Lock className="w-3 h-3 text-white" />
            </div>
          )}

          {/* Reply indicator */}
          {message.replyTo && (
            <div className={`mb-2 p-2 rounded-lg border-l-2 ${
              isOwn
                ? 'bg-white/10 border-white/30'
                : 'bg-card-highlight border-primary/30'
            }`}>
              <p className="text-xs opacity-75">Replying to message</p>
            </div>
          )}

          {/* Message content */}
          <div className="space-y-2">
            {/* Sender name for group chats */}
            {!isOwn && message.senderUsername && (
              <p className="text-xs font-medium text-primary">
                {message.senderUsername}
              </p>
            )}

            {/* Text content */}
            {message.content && (
              <p className="break-words whitespace-pre-wrap leading-relaxed">
                {message.content}
              </p>
            )}

            {/* File attachment */}
            {message.fileUrl && (
              <div className="mt-2">
                {message.messageType === 'image' ? (
                  <div className="relative rounded-lg overflow-hidden">
                    <img
                      src={message.fileUrl}
                      alt={message.fileName}
                      className="max-w-full h-auto rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                      onClick={() => {/* Open image modal */}}
                    />
                    <div className="absolute top-2 right-2">
                      <button className="p-1 bg-black/50 rounded-full hover:bg-black/70 transition-colors">
                        <Download className="w-4 h-4 text-white" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className={`flex items-center space-x-3 p-3 rounded-lg ${
                    isOwn ? 'bg-white/10' : 'bg-card-highlight'
                  }`}>
                    <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center">
                      <FileText className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{message.fileName}</p>
                      <p className="text-xs opacity-75">
                        {message.fileSize ? `${(message.fileSize / 1024).toFixed(1)} KB` : 'Unknown size'}
                      </p>
                    </div>
                    <button className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Message reactions */}
            {message.reactions && message.reactions.length > 0 && (
              <MessageReactions
                reactions={message.reactions}
                onReactionClick={(emoji) => {/* Handle reaction */}}
              />
            )}
          </div>

          {/* Message footer */}
          <div className={`flex items-center justify-between mt-2 text-xs ${
            isOwn ? 'text-white/70' : 'text-text-muted'
          }`}>
            <div className="flex items-center space-x-1">
              {showTimestamp && (
                <span>{formatTime(message.timestamp)}</span>
              )}
              {message.edited && (
                <span className="italic">(edited)</span>
              )}
            </div>

            {isOwn && (
              <div className="flex items-center space-x-1">
                {getStatusIcon()}
              </div>
            )}
          </div>
        </div>

        {/* Hover actions */}
        <AnimatePresence>
          {isHovered && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className={`absolute top-0 ${
                isOwn ? '-left-32' : '-right-32'
              } flex items-center space-x-1 bg-foreground border border-border rounded-lg shadow-lg p-1`}
            >
              <button
                onClick={() => setShowReactions(true)}
                className="p-2 hover:bg-card-highlight rounded-lg transition-colors"
                title="Add reaction"
              >
                <Smile className="w-4 h-4 text-text-muted" />
              </button>

              <button
                onClick={onReply}
                className="p-2 hover:bg-card-highlight rounded-lg transition-colors"
                title="Reply"
              >
                <Reply className="w-4 h-4 text-text-muted" />
              </button>

              <button
                onClick={copyToClipboard}
                className="p-2 hover:bg-card-highlight rounded-lg transition-colors"
                title="Copy"
              >
                <Copy className="w-4 h-4 text-text-muted" />
              </button>

              <button
                onClick={() => setShowContextMenu(true)}
                className="p-2 hover:bg-card-highlight rounded-lg transition-colors"
                title="More options"
              >
                <MoreHorizontal className="w-4 h-4 text-text-muted" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Selection indicator */}
        {isSelected && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-2 -left-2 w-6 h-6 bg-primary rounded-full flex items-center justify-center"
          >
            <Check className="w-4 h-4 text-white" />
          </motion.div>
        )}
      </motion.div>

      {/* Context Menu */}
      <AnimatePresence>
        {showContextMenu && (
          <MessageContextMenu
            message={message}
            isOwn={isOwn}
            onClose={() => setShowContextMenu(false)}
            onAction={(action) => {
              setShowContextMenu(false);
              // Handle context menu actions
            }}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
};
