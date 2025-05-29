import React from 'react';
import { motion } from 'framer-motion';
import type { MessageReaction } from '../../types/message';

interface Props {
  reactions: MessageReaction[];
  onReactionClick: (emoji: string) => void;
  currentUserId?: string;
}

export const MessageReactions: React.FC<Props> = ({
  reactions,
  onReactionClick,
  currentUserId,
}) => {
  if (!reactions || reactions.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1 mt-2">
      {reactions.map((reaction, index) => {
        const hasReacted = currentUserId && reaction.users.includes(currentUserId);
        
        return (
          <motion.button
            key={`${reaction.emoji}-${index}`}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => onReactionClick(reaction.emoji)}
            className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs transition-all ${
              hasReacted
                ? 'bg-primary/20 border border-primary/50'
                : 'bg-card-highlight border border-border hover:border-primary/30'
            }`}
          >
            <span>{reaction.emoji}</span>
            <span className={hasReacted ? 'text-primary font-medium' : 'text-text-muted'}>
              {reaction.count}
            </span>
          </motion.button>
        );
      })}
    </div>
  );
};
