import React from 'react';
import { motion } from 'framer-motion';

interface Props {
  username: string;
  avatar?: string;
}

export const TypingIndicator: React.FC<Props> = ({ username, avatar }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="flex items-center space-x-3 px-4 py-2"
    >
      <div className="w-8 h-8 bg-gradient-secondary rounded-full flex items-center justify-center">
        <span className="text-white text-xs font-medium">
          {username.charAt(0).toUpperCase()}
        </span>
      </div>
      
      <div className="bg-card-highlight rounded-2xl px-4 py-3 rounded-bl-md">
        <div className="flex space-x-1">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-2 h-2 bg-text-muted rounded-full"
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                delay: i * 0.2,
              }}
            />
          ))}
        </div>
      </div>
      
      <span className="text-xs text-text-muted">
        {username} is typing...
      </span>
    </motion.div>
  );
};
