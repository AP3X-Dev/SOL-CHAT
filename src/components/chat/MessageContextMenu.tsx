import React from 'react';
import { motion } from 'framer-motion';
import { 
  Reply, 
  Forward, 
  Copy, 
  Edit3, 
  Trash2, 
  Star, 
  Download, 
  Flag,
  Pin
} from 'lucide-react';
import type { Message } from '../../types/message';

interface Props {
  message: Message;
  isOwn: boolean;
  onClose: () => void;
  onAction: (action: string) => void;
}

export const MessageContextMenu: React.FC<Props> = ({
  message,
  isOwn,
  onClose,
  onAction,
}) => {
  const menuItems = [
    { id: 'reply', label: 'Reply', icon: Reply, show: true },
    { id: 'forward', label: 'Forward', icon: Forward, show: true },
    { id: 'copy', label: 'Copy', icon: Copy, show: !!message.content },
    { id: 'star', label: 'Star', icon: Star, show: true },
    { id: 'pin', label: 'Pin', icon: Pin, show: true },
    { id: 'download', label: 'Download', icon: Download, show: !!message.fileUrl },
    { id: 'edit', label: 'Edit', icon: Edit3, show: isOwn && !!message.content },
    { id: 'delete', label: 'Delete', icon: Trash2, show: isOwn, danger: true },
    { id: 'report', label: 'Report', icon: Flag, show: !isOwn, danger: true },
  ].filter(item => item.show);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="fixed inset-0 z-50"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/20" />
      
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-foreground border border-border rounded-xl shadow-2xl py-2 min-w-48"
        onClick={(e) => e.stopPropagation()}
      >
        {menuItems.map((item) => {
          const IconComponent = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => {
                onAction(item.id);
                onClose();
              }}
              className={`w-full flex items-center space-x-3 px-4 py-3 hover:bg-card-highlight transition-colors ${
                item.danger ? 'text-error hover:bg-error/10' : 'text-text'
              }`}
            >
              <IconComponent className="w-4 h-4" />
              <span className="text-sm">{item.label}</span>
            </button>
          );
        })}
      </motion.div>
    </motion.div>
  );
};
