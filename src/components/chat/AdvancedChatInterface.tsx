import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import { 
  Send, 
  Paperclip, 
  Smile, 
  Mic, 
  MicOff, 
  Phone, 
  Video, 
  MoreVertical,
  Search,
  Star,
  Archive,
  Trash2,
  Reply,
  Forward,
  Copy,
  Download,
  Shield,
  Lock,
  Zap
} from 'lucide-react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useHotkeys } from 'react-hotkeys-hook';
import { useChatStore } from '../../store/chat-store';
import { useToast } from '../ui/Toast';
import { AdvancedMessageBubble } from './AdvancedMessageBubble';
import { EmojiPicker } from './EmojiPicker';
import { VoiceRecorder } from './VoiceRecorder';
import { FileUploadZone } from './FileUploadZone';
import { TypingIndicator } from './TypingIndicator';
import type { Message } from '../../types/message';

interface Props {
  chatId: string;
  recipientId: string;
  recipientName: string;
  isOnline?: boolean;
}

export const AdvancedChatInterface: React.FC<Props> = ({
  chatId,
  recipientId,
  recipientName,
  isOnline = false,
}) => {
  const { success, error } = useToast();
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  
  // Store state
  const {
    messages,
    currentUser,
    selectedMessages,
    replyingTo,
    connectionStatus,
    sendEncryptedMessage,
    uploadFile,
    saveDraft,
    loadDraft,
    toggleMessageSelection,
    setReplyingTo,
    clearSelectedMessages,
  } = useChatStore();

  // Local state
  const [message, setMessage] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showFileUpload, setShowFileUpload] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [lastTypingTime, setLastTypingTime] = useState(0);

  const chatMessages = messages[chatId] || [];

  // Scroll animations
  const { scrollY } = useScroll({ container: messagesContainerRef });
  const headerOpacity = useTransform(scrollY, [0, 100], [1, 0.8]);
  const headerBlur = useTransform(scrollY, [0, 100], [0, 10]);

  // Virtual scrolling for performance
  const virtualizer = useVirtualizer({
    count: chatMessages.length,
    getScrollElement: () => messagesContainerRef.current,
    estimateSize: () => 80,
    overscan: 5,
  });

  // Load draft on mount
  useEffect(() => {
    const draft = loadDraft(chatId);
    if (draft) {
      setMessage(draft);
    }
  }, [chatId, loadDraft]);

  // Save draft when message changes
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      saveDraft(chatId, message);
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [message, chatId, saveDraft]);

  // Auto-resize textarea
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 120)}px`;
    }
  }, [message]);

  // Keyboard shortcuts
  useHotkeys('cmd+enter,ctrl+enter', () => handleSendMessage(), { enableOnFormTags: true });
  useHotkeys('escape', () => {
    clearSelectedMessages();
    setReplyingTo(null);
    setShowEmojiPicker(false);
  });

  const handleSendMessage = async () => {
    if (!message.trim() || !currentUser) return;

    try {
      await sendEncryptedMessage(chatId, message.trim(), recipientId);
      setMessage('');
      saveDraft(chatId, '');
      setReplyingTo(null);
      success('Message sent!', 'Your encrypted message has been delivered.');
    } catch (err) {
      error('Failed to send message', 'Please check your connection and try again.');
    }
  };

  const handleTyping = () => {
    const now = Date.now();
    setLastTypingTime(now);
    
    if (!isTyping) {
      setIsTyping(true);
      // Send typing indicator
    }

    // Stop typing after 3 seconds of inactivity
    setTimeout(() => {
      if (Date.now() - lastTypingTime >= 2900) {
        setIsTyping(false);
      }
    }, 3000);
  };

  const handleFileUpload = async (files: File[]) => {
    for (const file of files) {
      try {
        const url = await uploadFile(file, chatId);
        success('File uploaded!', `${file.name} has been uploaded successfully.`);
      } catch (err) {
        error('Upload failed', `Failed to upload ${file.name}`);
      }
    }
  };

  const handleEmojiSelect = (emoji: string) => {
    const textarea = inputRef.current;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newMessage = message.slice(0, start) + emoji + message.slice(end);
      setMessage(newMessage);
      
      // Restore cursor position
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + emoji.length;
        textarea.focus();
      }, 0);
    }
    setShowEmojiPicker(false);
  };

  const handleVoiceRecord = (audioBlob: Blob) => {
    // Handle voice message
    console.log('Voice message recorded:', audioBlob);
  };

  return (
    <div className="flex flex-col h-full bg-background relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 pointer-events-none" />
      
      {/* Header */}
      <motion.header
        style={{ 
          opacity: headerOpacity,
          backdropFilter: `blur(${headerBlur}px)`,
        }}
        className="relative z-10 bg-foreground/80 backdrop-blur-sm border-b border-border p-4"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <div className="w-10 h-10 bg-gradient-primary rounded-full flex items-center justify-center">
                <span className="text-white font-medium">
                  {recipientName.charAt(0).toUpperCase()}
                </span>
              </div>
              {isOnline && (
                <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-success rounded-full border-2 border-foreground" />
              )}
            </div>
            
            <div>
              <h3 className="font-semibold text-text">{recipientName}</h3>
              <div className="flex items-center space-x-2 text-sm text-text-muted">
                <div className="flex items-center space-x-1">
                  <Shield className="w-3 h-3" />
                  <span>End-to-end encrypted</span>
                </div>
                {connectionStatus === 'connected' && (
                  <div className="flex items-center space-x-1">
                    <Zap className="w-3 h-3 text-success" />
                    <span>Real-time</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="p-2 hover:bg-card-highlight rounded-lg transition-colors"
            >
              <Search className="w-5 h-5 text-text-muted" />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="p-2 hover:bg-card-highlight rounded-lg transition-colors"
            >
              <Phone className="w-5 h-5 text-text-muted" />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="p-2 hover:bg-card-highlight rounded-lg transition-colors"
            >
              <Video className="w-5 h-5 text-text-muted" />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="p-2 hover:bg-card-highlight rounded-lg transition-colors"
            >
              <MoreVertical className="w-5 h-5 text-text-muted" />
            </motion.button>
          </div>
        </div>
      </motion.header>

      {/* Messages Area */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-auto p-4 space-y-4 relative"
        style={{ height: '100%' }}
      >
        <div
          style={{
            height: `${virtualizer.getTotalSize()}px`,
            width: '100%',
            position: 'relative',
          }}
        >
          {virtualizer.getVirtualItems().map((virtualItem) => {
            const message = chatMessages[virtualItem.index];
            return (
              <div
                key={virtualItem.key}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: `${virtualItem.size}px`,
                  transform: `translateY(${virtualItem.start}px)`,
                }}
              >
                <AdvancedMessageBubble
                  message={message}
                  isOwn={message.sender === currentUser?.publicKey}
                  isSelected={selectedMessages.has(message.id)}
                  onSelect={() => toggleMessageSelection(message.id)}
                  onReply={() => setReplyingTo(message)}
                />
              </div>
            );
          })}
        </div>

        {/* Typing Indicator */}
        <AnimatePresence>
          {isTyping && (
            <TypingIndicator username={recipientName} />
          )}
        </AnimatePresence>
      </div>

      {/* Reply Bar */}
      <AnimatePresence>
        {replyingTo && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="px-4 py-2 bg-card-highlight border-t border-border"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Reply className="w-4 h-4 text-primary" />
                <span className="text-sm text-text-muted">
                  Replying to {replyingTo.senderUsername || 'Unknown'}
                </span>
              </div>
              <button
                onClick={() => setReplyingTo(null)}
                className="p-1 hover:bg-card-highlight rounded"
              >
                <X className="w-4 h-4 text-text-muted" />
              </button>
            </div>
            <p className="text-sm text-text truncate mt-1">
              {replyingTo.content}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input Area */}
      <div className="p-4 bg-foreground border-t border-border">
        <div className="flex items-end space-x-2">
          {/* File Upload */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowFileUpload(true)}
            className="p-2 hover:bg-card-highlight rounded-lg transition-colors"
          >
            <Paperclip className="w-5 h-5 text-text-muted" />
          </motion.button>

          {/* Message Input */}
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={message}
              onChange={(e) => {
                setMessage(e.target.value);
                handleTyping();
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder="Type a message..."
              className="w-full px-4 py-3 bg-card-highlight border border-border rounded-2xl resize-none focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
              rows={1}
              style={{ minHeight: '48px', maxHeight: '120px' }}
            />
            
            {/* Emoji Button */}
            <button
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-card-highlight rounded transition-colors"
            >
              <Smile className="w-5 h-5 text-text-muted" />
            </button>
          </div>

          {/* Voice/Send Button */}
          {message.trim() ? (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleSendMessage}
              className="p-3 bg-gradient-primary rounded-full shadow-lg hover:shadow-xl transition-all"
            >
              <Send className="w-5 h-5 text-white" />
            </motion.button>
          ) : (
            <VoiceRecorder
              onRecordingComplete={handleVoiceRecord}
              isRecording={isRecording}
              onRecordingStateChange={setIsRecording}
            />
          )}
        </div>
      </div>

      {/* Emoji Picker */}
      <AnimatePresence>
        {showEmojiPicker && (
          <EmojiPicker
            onEmojiSelect={handleEmojiSelect}
            onClose={() => setShowEmojiPicker(false)}
          />
        )}
      </AnimatePresence>

      {/* File Upload Zone */}
      <AnimatePresence>
        {showFileUpload && (
          <FileUploadZone
            onFilesSelected={handleFileUpload}
            onClose={() => setShowFileUpload(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};
