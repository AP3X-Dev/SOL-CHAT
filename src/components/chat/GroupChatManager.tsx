import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Users, 
  Plus, 
  Search, 
  Check, 
  Hash,
  Globe,
  Lock,
  Crown,
  UserPlus,
  MessageCircle
} from 'lucide-react';
import { formatDisplayName } from '../../lib/solana-name-service';
import type { Peer } from '../../types/message';

interface Props {
  onClose: () => void;
  onCreateGroup: (name: string, participants: string[]) => void;
  availablePeers: Peer[];
}

export const GroupChatManager: React.FC<Props> = ({
  onClose,
  onCreateGroup,
  availablePeers,
}) => {
  const [step, setStep] = useState<'type' | 'details' | 'members'>('type');
  const [chatType, setChatType] = useState<'direct' | 'group' | 'channel'>('direct');
  const [groupName, setGroupName] = useState('');
  const [groupDescription, setGroupDescription] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [selectedPeers, setSelectedPeers] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [directChatAddress, setDirectChatAddress] = useState('');

  const filteredPeers = availablePeers.filter(peer =>
    peer.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    peer.nickname?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    peer.publicKey.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const togglePeerSelection = (peerKey: string) => {
    const newSelected = new Set(selectedPeers);
    if (newSelected.has(peerKey)) {
      newSelected.delete(peerKey);
    } else {
      newSelected.add(peerKey);
    }
    setSelectedPeers(newSelected);
  };

  const handleCreateChat = () => {
    if (chatType === 'direct') {
      // For direct chat, we need to handle this differently
      // This would typically be handled by the parent component
      onClose();
    } else {
      if (!groupName.trim()) return;
      onCreateGroup(groupName.trim(), Array.from(selectedPeers));
    }
  };

  const canProceed = () => {
    switch (step) {
      case 'type':
        return true;
      case 'details':
        return chatType === 'direct' ? directChatAddress.trim() : groupName.trim();
      case 'members':
        return chatType === 'direct' || selectedPeers.size > 0;
      default:
        return false;
    }
  };

  const getStepTitle = () => {
    switch (step) {
      case 'type':
        return 'Choose Chat Type';
      case 'details':
        return chatType === 'direct' ? 'Start Direct Chat' : 'Group Details';
      case 'members':
        return 'Add Members';
      default:
        return '';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-foreground rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h3 className="text-lg font-semibold text-text">{getStepTitle()}</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-card-highlight rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-text-muted" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <AnimatePresence mode="wait">
            {step === 'type' && (
              <motion.div
                key="type"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <p className="text-text-muted text-sm mb-6">
                  Choose the type of chat you want to create
                </p>

                <div className="space-y-3">
                  {[
                    {
                      type: 'direct',
                      icon: MessageCircle,
                      title: 'Direct Message',
                      description: '1-on-1 private conversation',
                      color: 'bg-gradient-primary',
                    },
                    {
                      type: 'group',
                      icon: Users,
                      title: 'Group Chat',
                      description: 'Private group with selected members',
                      color: 'bg-gradient-secondary',
                    },
                    {
                      type: 'channel',
                      icon: Hash,
                      title: 'Channel',
                      description: 'Public or private broadcast channel',
                      color: 'bg-gradient-tertiary',
                    },
                  ].map((option) => {
                    const IconComponent = option.icon;
                    return (
                      <motion.button
                        key={option.type}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setChatType(option.type as any)}
                        className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                          chatType === option.type
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:border-primary/50'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <div className={`w-10 h-10 ${option.color} rounded-lg flex items-center justify-center`}>
                            <IconComponent className="w-5 h-5 text-white" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-medium text-text">{option.title}</h4>
                            <p className="text-sm text-text-muted">{option.description}</p>
                          </div>
                          {chatType === option.type && (
                            <Check className="w-5 h-5 text-primary" />
                          )}
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {step === 'details' && (
              <motion.div
                key="details"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                {chatType === 'direct' ? (
                  <div className="space-y-4">
                    <p className="text-text-muted text-sm">
                      Enter the username or wallet address of the person you want to chat with
                    </p>
                    <div>
                      <label className="block text-sm font-medium text-text mb-2">
                        Recipient
                      </label>
                      <input
                        type="text"
                        value={directChatAddress}
                        onChange={(e) => setDirectChatAddress(e.target.value)}
                        placeholder="@username or wallet address"
                        className="w-full px-4 py-3 bg-card-highlight border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-text mb-2">
                        {chatType === 'group' ? 'Group' : 'Channel'} Name
                      </label>
                      <input
                        type="text"
                        value={groupName}
                        onChange={(e) => setGroupName(e.target.value)}
                        placeholder={`Enter ${chatType} name`}
                        className="w-full px-4 py-3 bg-card-highlight border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-text mb-2">
                        Description (Optional)
                      </label>
                      <textarea
                        value={groupDescription}
                        onChange={(e) => setGroupDescription(e.target.value)}
                        placeholder={`Describe your ${chatType}`}
                        rows={3}
                        className="w-full px-4 py-3 bg-card-highlight border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                      />
                    </div>

                    {chatType === 'channel' && (
                      <div className="flex items-center justify-between p-4 bg-card-highlight rounded-lg">
                        <div className="flex items-center space-x-3">
                          {isPublic ? (
                            <Globe className="w-5 h-5 text-primary" />
                          ) : (
                            <Lock className="w-5 h-5 text-text-muted" />
                          )}
                          <div>
                            <p className="font-medium text-text">
                              {isPublic ? 'Public Channel' : 'Private Channel'}
                            </p>
                            <p className="text-sm text-text-muted">
                              {isPublic 
                                ? 'Anyone can find and join this channel'
                                : 'Only invited members can join'
                              }
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => setIsPublic(!isPublic)}
                          className={`w-12 h-6 rounded-full transition-colors ${
                            isPublic ? 'bg-primary' : 'bg-border'
                          }`}
                        >
                          <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                            isPublic ? 'translate-x-6' : 'translate-x-0.5'
                          }`} />
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            )}

            {step === 'members' && chatType !== 'direct' && (
              <motion.div
                key="members"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <div className="flex items-center justify-between">
                  <p className="text-text-muted text-sm">
                    Select contacts to add to your {chatType}
                  </p>
                  <span className="text-sm text-primary font-medium">
                    {selectedPeers.size} selected
                  </span>
                </div>

                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search contacts..."
                    className="w-full pl-10 pr-4 py-2 bg-card-highlight border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>

                {/* Peer List */}
                <div className="max-h-60 overflow-y-auto space-y-2">
                  {filteredPeers.length === 0 ? (
                    <div className="text-center py-8">
                      <Users className="w-8 h-8 mx-auto text-text-muted/50 mb-2" />
                      <p className="text-text-muted text-sm">
                        {searchQuery ? 'No contacts found' : 'No contacts available'}
                      </p>
                    </div>
                  ) : (
                    filteredPeers.map((peer) => {
                      const isSelected = selectedPeers.has(peer.publicKey);
                      return (
                        <motion.button
                          key={peer.publicKey}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => togglePeerSelection(peer.publicKey)}
                          className={`w-full p-3 rounded-lg border transition-all text-left ${
                            isSelected
                              ? 'border-primary bg-primary/5'
                              : 'border-border hover:border-primary/50'
                          }`}
                        >
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-gradient-secondary rounded-full flex items-center justify-center">
                              <span className="text-white text-sm font-medium">
                                {(peer.username || peer.publicKey).charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-text truncate">
                                {peer.username || formatDisplayName(peer.publicKey)}
                              </p>
                              <p className="text-sm text-text-muted truncate">
                                {peer.publicKey}
                              </p>
                            </div>
                            {isSelected && (
                              <Check className="w-5 h-5 text-primary" />
                            )}
                          </div>
                        </motion.button>
                      );
                    })
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-border">
          <div className="flex space-x-2">
            {step !== 'type' && (
              <button
                onClick={() => {
                  if (step === 'details') setStep('type');
                  if (step === 'members') setStep('details');
                }}
                className="px-4 py-2 text-text-muted hover:text-text transition-colors"
              >
                Back
              </button>
            )}
          </div>

          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-text-muted hover:text-text transition-colors"
            >
              Cancel
            </button>
            
            <button
              onClick={() => {
                if (step === 'type') {
                  if (chatType === 'direct') {
                    setStep('details');
                  } else {
                    setStep('details');
                  }
                } else if (step === 'details') {
                  if (chatType === 'direct') {
                    handleCreateChat();
                  } else {
                    setStep('members');
                  }
                } else {
                  handleCreateChat();
                }
              }}
              disabled={!canProceed()}
              className="px-6 py-2 bg-gradient-primary text-white rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {step === 'type' ? 'Next' : 
               step === 'details' && chatType === 'direct' ? 'Start Chat' :
               step === 'details' ? 'Next' : 
               `Create ${chatType === 'group' ? 'Group' : 'Channel'}`}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};
