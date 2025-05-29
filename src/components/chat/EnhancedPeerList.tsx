import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  Users, 
  Plus, 
  AtSign, 
  Wallet, 
  Crown, 
  MessageCircle,
  UserPlus,
  Hash,
  Globe,
  Lock,
  Zap
} from 'lucide-react';
import { useConnection } from '@solana/wallet-adapter-react';
import { getSolanaNameService, formatDisplayName } from '../../lib/solana-name-service';
import { getAddressActivity } from '../../lib/peers';
import type { Peer } from '../../types/message';

interface Props {
  peers: Peer[];
  onPeerSelect: (publicKey: string, username?: string) => void;
  onStartGroupChat: () => void;
}

export const EnhancedPeerList: React.FC<Props> = ({
  peers,
  onPeerSelect,
  onStartGroupChat,
}) => {
  const { connection } = useConnection();
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredPeers, setFilteredPeers] = useState<Peer[]>([]);
  const [newPeerAddress, setNewPeerAddress] = useState('');
  const [isAddingPeer, setIsAddingPeer] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);

  // Filter peers based on search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredPeers(peers);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = peers.filter(peer => 
      peer.username?.toLowerCase().includes(query) ||
      peer.nickname?.toLowerCase().includes(query) ||
      peer.publicKey.toLowerCase().includes(query)
    );
    
    setFilteredPeers(filtered);
  }, [peers, searchQuery]);

  const handleAddPeer = async () => {
    if (!newPeerAddress.trim()) return;
    
    setIsAddingPeer(true);
    try {
      const sns = getSolanaNameService(connection);
      let resolvedAddress = newPeerAddress.trim();
      let username: string | undefined;

      // Check if it's a username (starts with @)
      if (newPeerAddress.startsWith('@')) {
        const usernameOnly = newPeerAddress.slice(1);
        const resolved = await sns.resolveUsername(usernameOnly);
        if (resolved) {
          resolvedAddress = resolved;
          username = `@${usernameOnly}`;
        } else {
          throw new Error('Username not found');
        }
      } else {
        // Try reverse lookup for existing username
        const reversedUsername = await sns.reverseResolve(resolvedAddress);
        if (reversedUsername) {
          username = `@${reversedUsername}`;
        }
      }

      // Check if peer already exists
      const existingPeer = peers.find(p => p.publicKey === resolvedAddress);
      if (existingPeer) {
        onPeerSelect(resolvedAddress, username);
        setShowAddForm(false);
        setNewPeerAddress('');
        return;
      }

      // Add new peer and start chat
      onPeerSelect(resolvedAddress, username);
      setShowAddForm(false);
      setNewPeerAddress('');
      
    } catch (error) {
      console.error('Failed to add peer:', error);
    } finally {
      setIsAddingPeer(false);
    }
  };

  const getPeerStatus = (peer: Peer) => {
    if (peer.isOnline) return { color: 'bg-success', text: 'Online' };
    if (peer.status === 'away') return { color: 'bg-warning', text: 'Away' };
    if (peer.status === 'busy') return { color: 'bg-error', text: 'Busy' };
    return { color: 'bg-text-muted', text: 'Offline' };
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Users className="w-5 h-5 text-primary" />
            <h2 className="font-semibold text-text">Contacts</h2>
          </div>
          <div className="flex items-center space-x-2">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowAddForm(!showAddForm)}
              className="p-2 hover:bg-card-highlight rounded-lg transition-colors"
              title="Add Contact"
            >
              <UserPlus className="w-4 h-4 text-text-muted" />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onStartGroupChat}
              className="p-2 hover:bg-card-highlight rounded-lg transition-colors"
              title="Create Group"
            >
              <Plus className="w-4 h-4 text-text-muted" />
            </motion.button>
          </div>
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

        {/* Add Peer Form */}
        <AnimatePresence>
          {showAddForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 p-3 bg-card-highlight rounded-lg border border-border"
            >
              <div className="space-y-3">
                <div className="flex items-center space-x-2 text-sm text-text-muted">
                  <AtSign className="w-4 h-4" />
                  <span>Add by @username or wallet address</span>
                </div>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={newPeerAddress}
                    onChange={(e) => setNewPeerAddress(e.target.value)}
                    placeholder="@username or wallet address"
                    className="flex-1 px-3 py-2 bg-foreground border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleAddPeer();
                      }
                    }}
                  />
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleAddPeer}
                    disabled={!newPeerAddress.trim() || isAddingPeer}
                    className="px-4 py-2 bg-gradient-primary text-white rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isAddingPeer ? 'Adding...' : 'Add'}
                  </motion.button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Peer List */}
      <div className="flex-1 overflow-y-auto">
        {filteredPeers.length === 0 ? (
          <div className="p-8 text-center">
            {searchQuery ? (
              <div className="space-y-2">
                <Search className="w-8 h-8 mx-auto text-text-muted/50" />
                <p className="text-text-muted">No contacts found matching "{searchQuery}"</p>
              </div>
            ) : (
              <div className="space-y-4">
                <Users className="w-12 h-12 mx-auto text-text-muted/50" />
                <div className="space-y-2">
                  <p className="text-text-muted">No contacts yet</p>
                  <p className="text-sm text-text-muted">
                    Add contacts by username or wallet address to start chatting
                  </p>
                </div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowAddForm(true)}
                  className="px-4 py-2 bg-gradient-primary text-white rounded-lg text-sm font-medium"
                >
                  Add First Contact
                </motion.button>
              </div>
            )}
          </div>
        ) : (
          <div className="p-2">
            <AnimatePresence>
              {filteredPeers.map((peer, index) => {
                const status = getPeerStatus(peer);
                return (
                  <motion.button
                    key={peer.publicKey}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2, delay: index * 0.05 }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => onPeerSelect(peer.publicKey, peer.username)}
                    className="w-full p-3 hover:bg-card-highlight rounded-lg transition-all group text-left"
                  >
                    <div className="flex items-center space-x-3">
                      {/* Avatar */}
                      <div className="relative">
                        <div className="w-12 h-12 bg-gradient-secondary rounded-full flex items-center justify-center">
                          {peer.username?.startsWith('@') ? (
                            <AtSign className="w-6 h-6 text-white" />
                          ) : (
                            <Wallet className="w-6 h-6 text-white" />
                          )}
                        </div>
                        
                        {/* Status indicator */}
                        <div className={`absolute -bottom-1 -right-1 w-4 h-4 ${status.color} rounded-full border-2 border-foreground`} />
                        
                        {/* SNS verified badge */}
                        {peer.username?.startsWith('@') && (
                          <div className="absolute -top-1 -right-1 w-4 h-4 bg-primary rounded-full flex items-center justify-center">
                            <Crown className="w-2.5 h-2.5 text-white" />
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <p className="font-medium text-text truncate">
                            {peer.nickname || peer.username || formatDisplayName(peer.publicKey)}
                          </p>
                          {peer.username?.startsWith('@') && (
                            <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">
                              SNS
                            </span>
                          )}
                        </div>
                        
                        <div className="flex items-center space-x-2 mt-1">
                          <span className="text-xs text-text-muted">{status.text}</span>
                          {peer.messageCount > 0 && (
                            <>
                              <span className="text-xs text-text-muted">•</span>
                              <span className="text-xs text-text-muted">
                                {peer.messageCount} messages
                              </span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Action indicator */}
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <MessageCircle className="w-5 h-5 text-primary" />
                      </div>
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
          <span>{filteredPeers.length} contact{filteredPeers.length !== 1 ? 's' : ''}</span>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-success rounded-full" />
              <span>Online</span>
            </div>
            <div className="flex items-center space-x-1">
              <Zap className="w-3 h-3 text-primary" />
              <span>Real-time</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
