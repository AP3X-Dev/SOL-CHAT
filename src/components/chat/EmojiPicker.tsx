import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Clock, Smile, Heart, Zap, Star, Sun, Coffee } from 'lucide-react';

interface Props {
  onEmojiSelect: (emoji: string) => void;
  onClose: () => void;
}

const emojiCategories = {
  recent: {
    icon: Clock,
    name: 'Recently Used',
    emojis: ['😀', '😂', '❤️', '👍', '🔥', '💯', '😍', '🎉']
  },
  smileys: {
    icon: Smile,
    name: 'Smileys & People',
    emojis: [
      '😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇',
      '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚',
      '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩',
      '🥳', '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '☹️', '😣',
      '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠', '😡', '🤬'
    ]
  },
  hearts: {
    icon: Heart,
    name: 'Hearts',
    emojis: [
      '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔',
      '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '♥️'
    ]
  },
  nature: {
    icon: Sun,
    name: 'Nature',
    emojis: [
      '🌱', '🌿', '🍀', '🌾', '🌵', '🌲', '🌳', '🌴', '🌸', '🌺',
      '🌻', '🌹', '🌷', '🌼', '💐', '🍄', '🌰', '🎋', '🎍', '🌊',
      '⭐', '🌟', '✨', '⚡', '☀️', '🌤️', '⛅', '🌦️', '🌧️', '⛈️'
    ]
  },
  food: {
    icon: Coffee,
    name: 'Food & Drink',
    emojis: [
      '🍎', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🍈', '🍒', '🍑',
      '🥭', '🍍', '🥥', '🥝', '🍅', '🍆', '🥑', '🥦', '🥬', '🥒',
      '🌶️', '🌽', '🥕', '🧄', '🧅', '🥔', '🍠', '🥐', '🍞', '🥖',
      '☕', '🍵', '🧃', '🥤', '🍶', '🍺', '🍻', '🥂', '🍷', '🥃'
    ]
  },
  activities: {
    icon: Star,
    name: 'Activities',
    emojis: [
      '⚽', '🏀', '🏈', '⚾', '🥎', '🎾', '🏐', '🏉', '🥏', '🎱',
      '🪀', '🏓', '🏸', '🏒', '🏑', '🥍', '🏏', '🪃', '🥅', '⛳',
      '🎯', '🏹', '🎣', '🤿', '🥊', '🥋', '🎽', '🛹', '🛷', '⛸️',
      '🎨', '🎭', '🎪', '🎤', '🎧', '🎼', '🎹', '🥁', '🎷', '🎺'
    ]
  },
  objects: {
    icon: Zap,
    name: 'Objects',
    emojis: [
      '💎', '🔮', '💰', '💳', '💸', '🏆', '🥇', '🥈', '🥉', '🏅',
      '🎖️', '🏵️', '🎗️', '🎫', '🎟️', '🎪', '🎭', '🎨', '🎬', '🎤',
      '🎧', '🎼', '🎵', '🎶', '🎹', '🥁', '🎷', '🎺', '🎸', '🪕'
    ]
  }
};

export const EmojiPicker: React.FC<Props> = ({ onEmojiSelect, onClose }) => {
  const [activeCategory, setActiveCategory] = useState('recent');
  const [searchQuery, setSearchQuery] = useState('');
  const [recentEmojis, setRecentEmojis] = useState<string[]>([]);
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Load recent emojis from localStorage
    const stored = localStorage.getItem('recent-emojis');
    if (stored) {
      setRecentEmojis(JSON.parse(stored));
    }
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const handleEmojiClick = (emoji: string) => {
    // Add to recent emojis
    const newRecent = [emoji, ...recentEmojis.filter(e => e !== emoji)].slice(0, 20);
    setRecentEmojis(newRecent);
    localStorage.setItem('recent-emojis', JSON.stringify(newRecent));
    
    onEmojiSelect(emoji);
  };

  const filteredEmojis = searchQuery
    ? Object.values(emojiCategories)
        .flatMap(category => category.emojis)
        .filter(emoji => {
          // Simple search - in a real app, you'd have emoji names/keywords
          return true;
        })
    : emojiCategories[activeCategory as keyof typeof emojiCategories]?.emojis || [];

  const displayEmojis = activeCategory === 'recent' && recentEmojis.length > 0
    ? recentEmojis
    : filteredEmojis;

  return (
    <motion.div
      ref={pickerRef}
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="absolute bottom-16 right-4 w-80 h-96 bg-foreground border border-border rounded-2xl shadow-2xl overflow-hidden z-50"
    >
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search emojis..."
            className="w-full pl-10 pr-4 py-2 bg-card-highlight border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>
      </div>

      {/* Categories */}
      <div className="flex border-b border-border">
        {Object.entries(emojiCategories).map(([key, category]) => {
          const IconComponent = category.icon;
          return (
            <button
              key={key}
              onClick={() => setActiveCategory(key)}
              className={`flex-1 p-3 hover:bg-card-highlight transition-colors ${
                activeCategory === key ? 'bg-card-highlight border-b-2 border-primary' : ''
              }`}
              title={category.name}
            >
              <IconComponent className="w-5 h-5 mx-auto text-text-muted" />
            </button>
          );
        })}
      </div>

      {/* Emoji Grid */}
      <div className="flex-1 overflow-y-auto p-2">
        {displayEmojis.length === 0 ? (
          <div className="flex items-center justify-center h-full text-text-muted">
            <div className="text-center">
              <Smile className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">
                {activeCategory === 'recent' ? 'No recent emojis' : 'No emojis found'}
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-8 gap-1">
            <AnimatePresence>
              {displayEmojis.map((emoji, index) => (
                <motion.button
                  key={`${emoji}-${index}`}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ delay: index * 0.01 }}
                  whileHover={{ scale: 1.2 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => handleEmojiClick(emoji)}
                  className="w-8 h-8 flex items-center justify-center text-lg hover:bg-card-highlight rounded-lg transition-colors"
                >
                  {emoji}
                </motion.button>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-2 border-t border-border bg-card-highlight">
        <div className="flex items-center justify-between text-xs text-text-muted">
          <span>
            {displayEmojis.length} emoji{displayEmojis.length !== 1 ? 's' : ''}
          </span>
          <button
            onClick={onClose}
            className="px-3 py-1 hover:bg-foreground rounded transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </motion.div>
  );
};
