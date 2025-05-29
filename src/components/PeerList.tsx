import React, { useState, useEffect } from 'react';
import { Users, Clock, MessageSquare, CheckCircle, XCircle, AtSign, Wallet, Search } from 'lucide-react';
import { useConnection } from '@solana/wallet-adapter-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getRecentPeers, getAddressActivity } from '../lib/peers';
import { getSolanaNameService, formatDisplayName } from '../lib/solana-name-service';
import type { Peer } from '../types/message';

interface Props {
  onSelectPeer: (publicKey: string) => void;
}

export const PeerList: React.FC<Props> = ({ onSelectPeer }) => {
  const { connection } = useConnection();
  const [peers, setPeers] = useState<(Peer & { active?: boolean })[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredPeers, setFilteredPeers] = useState<(Peer & { active?: boolean })[]>([]);

  useEffect(() => {
    const loadPeers = async () => {
      const recentPeers = await getRecentPeers();

      // Check activity status for each peer and resolve SNS usernames
      const peersWithActivity = await Promise.all(
        recentPeers.map(async (peer) => {
          const { active } = await getAddressActivity(connection, peer.publicKey);

          // Try to resolve SNS username if not already set
          if (!peer.username) {
            try {
              const sns = getSolanaNameService(connection);
              const snsUsername = await sns.reverseResolve(peer.publicKey);
              if (snsUsername) {
                peer.username = `@${snsUsername}`;
              }
            } catch (err) {
              // SNS resolution failed, continue without username
            }
          }

          return {
            ...peer,
            active,
            isOnline: Math.random() > 0.5, // Mock online status
            status: Math.random() > 0.7 ? 'online' : Math.random() > 0.4 ? 'away' : 'offline'
          };
        })
      );

      setPeers(peersWithActivity);
      setFilteredPeers(peersWithActivity);
      setLoading(false);
    };

    loadPeers();
  }, [connection]);

  // Filter peers based on search query
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

  if (loading) {
    return (
      <div className="p-8 text-center text-text-muted flex flex-col items-center">
        <div className="bg-gradient-secondary p-2 rounded-lg mb-4">
          <Clock className="w-6 h-6 animate-spin text-white" />
        </div>
        <p>Loading peers...</p>
      </div>
    );
  }

  if (peers.length === 0) {
    return (
      <div className="p-8 text-center text-text-muted flex flex-col items-center">
        <div className="bg-gradient-secondary p-2 rounded-lg mb-4 opacity-50">
          <Users className="w-8 h-8 text-white" />
        </div>
        <p className="mb-2">No recent peers</p>
        <p className="text-sm">Start a conversation to add peers to this list.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Search Input */}
      <div className="p-4 border-b border-border">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search peers..."
            className="input pl-10 bg-card-highlight border-border text-sm"
          />
        </div>
      </div>

      {/* Peers List */}
      <div className="flex-1 overflow-y-auto">
        <AnimatePresence>
          {filteredPeers.map((peer, index) => (
            <motion.button
              key={peer.publicKey}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2, delay: index * 0.05 }}
              onClick={() => onSelectPeer(peer.publicKey)}
              className="w-full p-3 hover:bg-card-highlight transition-colors flex items-center justify-between border-b border-border last:border-b-0 group"
            >
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="bg-gradient-secondary p-1.5 rounded-lg">
                    {peer.username?.startsWith('@') ? (
                      <AtSign className="w-4 h-4 text-white" />
                    ) : (
                      <Wallet className="w-4 h-4 text-white" />
                    )}
                  </div>

                  {/* Online Status Indicator */}
                  {peer.isOnline && (
                    <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-success rounded-full border-2 border-foreground"></div>
                  )}

                  {/* Activity Status */}
                  {peer.active !== undefined && (
                    <div className="absolute -top-1 -right-1">
                      {peer.active ? (
                        <CheckCircle className="w-3 h-3 text-success" />
                      ) : (
                        <XCircle className="w-3 h-3 text-text-muted" />
                      )}
                    </div>
                  )}
                </div>

                <div className="text-left flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-text">
                      {peer.nickname || peer.username || formatDisplayName(peer.publicKey)}
                    </p>
                    {peer.username?.startsWith('@') && (
                      <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">
                        SNS
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-text-muted">
                    {peer.isOnline ? 'Online' : `Last seen: ${new Date(peer.lastSeen).toLocaleDateString()}`}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 text-text-muted bg-card-highlight px-2 py-1 rounded-lg group-hover:bg-background transition-colors">
                  <MessageSquare className="w-3 h-3" />
                  <span className="text-xs">{peer.messageCount}</span>
                </div>
              </div>
            </motion.button>
          ))}
        </AnimatePresence>

        {/* No Results */}
        {filteredPeers.length === 0 && searchQuery && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="p-8 text-center text-text-muted"
          >
            <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>No peers found matching "{searchQuery}"</p>
          </motion.div>
        )}
      </div>
    </div>
  );
};