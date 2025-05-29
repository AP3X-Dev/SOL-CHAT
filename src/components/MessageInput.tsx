import React, { useState, useRef } from 'react';
import { Send, Paperclip, X, Image as ImageIcon, FileText, Smile } from 'lucide-react';
import { motion } from 'framer-motion';
import { RecipientInput } from './RecipientInput';
import { useToast } from './ui/Toast';
import type { Peer } from '../types/message';

interface Props {
  onSendMessage: (content: string, recipientPublicKey: string, file?: File) => Promise<void>;
  recentPeers: Peer[];
}

export const MessageInput: React.FC<Props> = ({ onSendMessage, recentPeers }) => {
  const { success, error } = useToast();
  const [message, setMessage] = useState('');
  const [recipientAddress, setRecipientAddress] = useState('');
  const [sending, setSending] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreviewUrl, setFilePreviewUrl] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!recipientAddress || (!message.trim() && !selectedFile) || sending) {
      return;
    }

    try {
      setSending(true);
      await onSendMessage(message.trim(), recipientAddress, selectedFile || undefined);

      // Clear form after successful send
      setMessage('');
      setSelectedFile(null);
      setFilePreviewUrl(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      success('Message sent!', 'Your message has been encrypted and sent successfully.');
    } catch (err) {
      console.error('Failed to send message:', err);
      error('Failed to send message', 'Please check your connection and try again.');
    } finally {
      setSending(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);

      if (file.type.startsWith('image/')) {
        const url = URL.createObjectURL(file);
        setFilePreviewUrl(url);
      } else {
        setFilePreviewUrl(null);
      }
    }
  };

  const clearFile = () => {
    if (filePreviewUrl) {
      URL.revokeObjectURL(filePreviewUrl);
    }
    setSelectedFile(null);
    setFilePreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 bg-foreground border-t border-border space-y-4">
      <RecipientInput
        onRecipientSelect={setRecipientAddress}
        recentPeers={recentPeers}
      />

      {selectedFile && (
        <div className="flex items-center gap-2 p-2 bg-card-highlight rounded-lg border border-border animate-fade-in">
          {filePreviewUrl ? (
            <div className="relative w-16 h-16">
              <img
                src={filePreviewUrl}
                alt="Preview"
                className="w-full h-full object-cover rounded-lg"
              />
              <div className="absolute bottom-1 right-1 bg-gradient-primary p-1 rounded-full">
                <ImageIcon className="w-3 h-3 text-white" />
              </div>
            </div>
          ) : (
            <div className="w-16 h-16 bg-card-highlight rounded-lg flex items-center justify-center border border-border">
              <div className="bg-gradient-secondary p-1.5 rounded-lg">
                <FileText className="w-5 h-5 text-white" />
              </div>
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-text truncate">
              {selectedFile.name}
            </p>
            <p className="text-xs text-text-muted">
              {(selectedFile.size / 1024).toFixed(1)} KB
            </p>
          </div>
          <button
            type="button"
            onClick={clearFile}
            className="btn-icon hover:bg-card-highlight rounded-lg"
            title="Remove file"
            aria-label="Remove file"
          >
            <X className="w-4 h-4 text-text-muted" />
          </button>
        </div>
      )}

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="btn-icon hover:bg-card-highlight rounded-lg"
          title="Attach file"
          aria-label="Attach file"
          disabled={sending}
        >
          <Paperclip className="w-5 h-5 text-text-muted" />
        </button>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
          accept="image/*,application/pdf,.doc,.docx,.txt"
        />
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type a message..."
          className="input flex-1 bg-card-highlight border-border"
          disabled={sending}
        />
        <motion.button
          type="submit"
          whileHover={{ scale: sending || !recipientAddress || (!message.trim() && !selectedFile) ? 1 : 1.05 }}
          whileTap={{ scale: sending || !recipientAddress || (!message.trim() && !selectedFile) ? 1 : 0.95 }}
          className={`p-2 rounded-lg transition-all duration-200 ${
            sending || !recipientAddress || (!message.trim() && !selectedFile)
              ? 'bg-card-highlight cursor-not-allowed opacity-50'
              : 'bg-gradient-tertiary hover:opacity-90 shadow-lg hover:shadow-xl'
          }`}
          disabled={sending || !recipientAddress || (!message.trim() && !selectedFile)}
          title={sending ? 'Sending...' : 'Send message'}
          aria-label={sending ? 'Sending...' : 'Send message'}
        >
          <motion.div
            animate={sending ? { rotate: 360 } : { rotate: 0 }}
            transition={{ duration: 1, repeat: sending ? Infinity : 0, ease: 'linear' }}
          >
            <Send className={`w-5 h-5 text-white ${sending ? 'animate-pulse' : ''}`} />
          </motion.div>
        </motion.button>
      </div>
    </form>
  );
};