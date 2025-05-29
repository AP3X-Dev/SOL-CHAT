import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Crown, 
  AtSign, 
  Zap, 
  Check, 
  Loader2,
  ExternalLink,
  Copy,
  Star,
  Shield,
  Gem,
  Sparkles
} from 'lucide-react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { getSolanaNameService } from '../../lib/solana-name-service';
import { useToast } from '../ui/Toast';
import type { UserProfile } from '../../types/message';

interface Props {
  onClose: () => void;
  currentUser: UserProfile;
}

interface NFTMetadata {
  name: string;
  description: string;
  image: string;
  attributes: Array<{
    trait_type: string;
    value: string | number;
  }>;
}

export const UsernameNFTManager: React.FC<Props> = ({
  onClose,
  currentUser,
}) => {
  const { connection } = useConnection();
  const { signTransaction } = useWallet();
  const { success, error } = useToast();
  
  const [step, setStep] = useState<'overview' | 'claim' | 'manage'>('overview');
  const [username, setUsername] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [isMinting, setIsMinting] = useState(false);
  const [nftMetadata, setNftMetadata] = useState<NFTMetadata | null>(null);

  // Check if user already has SNS
  const hasExistingSNS = currentUser.solanaNameService && currentUser.verified;

  useEffect(() => {
    if (hasExistingSNS) {
      setStep('manage');
      setUsername(currentUser.solanaNameService!);
    }
  }, [hasExistingSNS, currentUser.solanaNameService]);

  // Check username availability
  useEffect(() => {
    const checkAvailability = async () => {
      if (!username || username.length < 3) {
        setIsAvailable(null);
        return;
      }

      setIsChecking(true);
      try {
        const sns = getSolanaNameService(connection);
        const available = await sns.isUsernameAvailable(username);
        setIsAvailable(available);
      } catch (err) {
        setIsAvailable(null);
      } finally {
        setIsChecking(false);
      }
    };

    const timeoutId = setTimeout(checkAvailability, 500);
    return () => clearTimeout(timeoutId);
  }, [username, connection]);

  const handleClaimUsername = async () => {
    if (!username || !isAvailable || !signTransaction) return;

    setIsMinting(true);
    try {
      const sns = getSolanaNameService(connection);
      const result = await sns.registerUsername(username, currentUser.publicKey, signTransaction);
      
      if (result.success) {
        // Generate NFT metadata
        const metadata: NFTMetadata = {
          name: `@${username}`,
          description: `SOL-CHAT Username NFT for @${username}. This NFT represents ownership of the username on the SOL-CHAT platform.`,
          image: generateUsernameNFTImage(username),
          attributes: [
            { trait_type: 'Platform', value: 'SOL-CHAT' },
            { trait_type: 'Username', value: `@${username}` },
            { trait_type: 'Length', value: username.length },
            { trait_type: 'Rarity', value: getUsernameRarity(username) },
            { trait_type: 'Created', value: new Date().toISOString().split('T')[0] },
          ],
        };
        
        setNftMetadata(metadata);
        setStep('manage');
        success('Username claimed!', `@${username} is now yours as an NFT!`);
      } else {
        error('Failed to claim username', result.error || 'Unknown error occurred');
      }
    } catch (err) {
      error('Failed to claim username', 'Please try again later');
    } finally {
      setIsMinting(false);
    }
  };

  const generateUsernameNFTImage = (username: string): string => {
    // In a real implementation, this would generate or fetch an actual NFT image
    return `https://api.dicebear.com/7.x/shapes/svg?seed=${username}&backgroundColor=6366f1,8b5cf6,a855f7`;
  };

  const getUsernameRarity = (username: string): string => {
    if (username.length <= 3) return 'Legendary';
    if (username.length <= 5) return 'Epic';
    if (username.length <= 8) return 'Rare';
    return 'Common';
  };

  const getRarityColor = (rarity: string): string => {
    switch (rarity) {
      case 'Legendary': return 'text-yellow-500';
      case 'Epic': return 'text-purple-500';
      case 'Rare': return 'text-blue-500';
      default: return 'text-gray-500';
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      success('Copied!', 'Text copied to clipboard');
    } catch (err) {
      error('Failed to copy', 'Could not copy to clipboard');
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
        className="bg-foreground rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden"
      >
        {/* Header */}
        <div className="relative p-6 bg-gradient-to-r from-primary to-secondary">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                <Crown className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Username NFT</h3>
                <p className="text-white/80 text-sm">
                  {hasExistingSNS ? 'Manage your username' : 'Claim your unique identity'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>
          
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-16 translate-x-16" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-12 -translate-x-12" />
        </div>

        {/* Content */}
        <div className="p-6">
          <AnimatePresence mode="wait">
            {step === 'overview' && (
              <motion.div
                key="overview"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                <div className="text-center space-y-4">
                  <div className="w-20 h-20 bg-gradient-primary rounded-full flex items-center justify-center mx-auto">
                    <AtSign className="w-10 h-10 text-white" />
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-text mb-2">
                      Claim Your Username NFT
                    </h4>
                    <p className="text-text-muted">
                      Own your identity on SOL-CHAT with a unique username NFT that proves ownership and enables easy discovery.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {[
                    { icon: Shield, title: 'Verified Identity', desc: 'Prove ownership' },
                    { icon: Zap, title: 'Easy Discovery', desc: 'Find friends easily' },
                    { icon: Gem, title: 'Tradeable NFT', desc: 'Own & transfer' },
                    { icon: Sparkles, title: 'Exclusive Access', desc: 'Special features' },
                  ].map((feature, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="p-4 bg-card-highlight rounded-lg text-center"
                    >
                      <feature.icon className="w-6 h-6 text-primary mx-auto mb-2" />
                      <h5 className="font-medium text-text text-sm">{feature.title}</h5>
                      <p className="text-xs text-text-muted">{feature.desc}</p>
                    </motion.div>
                  ))}
                </div>

                <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <Star className="w-4 h-4 text-primary" />
                    <span className="font-medium text-primary text-sm">Limited Time</span>
                  </div>
                  <p className="text-sm text-text">
                    Claim your username NFT for only <strong>0.01 SOL</strong> during the beta period!
                  </p>
                </div>
              </motion.div>
            )}

            {step === 'claim' && (
              <motion.div
                key="claim"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-text mb-2">
                      Choose Your Username
                    </label>
                    <div className="relative">
                      <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
                      <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''))}
                        placeholder="your_username"
                        className="w-full pl-12 pr-12 py-3 bg-card-highlight border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        {isChecking ? (
                          <Loader2 className="w-5 h-5 animate-spin text-text-muted" />
                        ) : isAvailable === true ? (
                          <Check className="w-5 h-5 text-success" />
                        ) : isAvailable === false ? (
                          <X className="w-5 h-5 text-error" />
                        ) : null}
                      </div>
                    </div>
                    
                    {username.length >= 3 && isAvailable !== null && (
                      <p className={`mt-2 text-sm ${isAvailable ? 'text-success' : 'text-error'}`}>
                        {isAvailable ? (
                          <span className="flex items-center space-x-1">
                            <Check className="w-4 h-4" />
                            <span>@{username} is available!</span>
                          </span>
                        ) : (
                          <span className="flex items-center space-x-1">
                            <X className="w-4 h-4" />
                            <span>@{username} is already taken</span>
                          </span>
                        )}
                      </p>
                    )}
                  </div>

                  {username && isAvailable && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="p-4 bg-card-highlight rounded-lg border border-border"
                    >
                      <h5 className="font-medium text-text mb-2">NFT Preview</h5>
                      <div className="flex items-center space-x-3">
                        <img
                          src={generateUsernameNFTImage(username)}
                          alt="NFT Preview"
                          className="w-16 h-16 rounded-lg"
                        />
                        <div className="flex-1">
                          <p className="font-medium text-text">@{username}</p>
                          <p className="text-sm text-text-muted">SOL-CHAT Username NFT</p>
                          <p className={`text-xs font-medium ${getRarityColor(getUsernameRarity(username))}`}>
                            {getUsernameRarity(username)} Rarity
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>
              </motion.div>
            )}

            {step === 'manage' && (
              <motion.div
                key="manage"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                <div className="text-center">
                  <div className="w-24 h-24 mx-auto mb-4 relative">
                    <img
                      src={generateUsernameNFTImage(username)}
                      alt="Your NFT"
                      className="w-full h-full rounded-xl"
                    />
                    <div className="absolute -top-2 -right-2 w-8 h-8 bg-success rounded-full flex items-center justify-center">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                  </div>
                  <h4 className="text-lg font-semibold text-text">@{username}</h4>
                  <p className="text-text-muted">Your verified username NFT</p>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-card-highlight rounded-lg">
                    <span className="text-sm text-text">Username</span>
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-text">@{username}</span>
                      <button
                        onClick={() => copyToClipboard(`@${username}`)}
                        className="p-1 hover:bg-foreground rounded transition-colors"
                      >
                        <Copy className="w-4 h-4 text-text-muted" />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-card-highlight rounded-lg">
                    <span className="text-sm text-text">Rarity</span>
                    <span className={`font-medium ${getRarityColor(getUsernameRarity(username))}`}>
                      {getUsernameRarity(username)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-card-highlight rounded-lg">
                    <span className="text-sm text-text">Status</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-success rounded-full" />
                      <span className="text-sm text-success font-medium">Verified</span>
                    </div>
                  </div>
                </div>

                <div className="flex space-x-3">
                  <button className="flex-1 px-4 py-2 bg-card-highlight hover:bg-opacity-80 rounded-lg transition-colors flex items-center justify-center space-x-2">
                    <ExternalLink className="w-4 h-4" />
                    <span className="text-sm">View on Explorer</span>
                  </button>
                  <button className="flex-1 px-4 py-2 bg-card-highlight hover:bg-opacity-80 rounded-lg transition-colors flex items-center justify-center space-x-2">
                    <Gem className="w-4 h-4" />
                    <span className="text-sm">Transfer NFT</span>
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-border">
          <div>
            {step !== 'overview' && step !== 'manage' && (
              <button
                onClick={() => setStep('overview')}
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
              {step === 'manage' ? 'Close' : 'Cancel'}
            </button>
            
            {step === 'overview' && (
              <button
                onClick={() => setStep('claim')}
                className="px-6 py-2 bg-gradient-primary text-white rounded-lg font-medium hover:opacity-90 transition-opacity"
              >
                Claim Username
              </button>
            )}

            {step === 'claim' && (
              <button
                onClick={handleClaimUsername}
                disabled={!username || !isAvailable || isMinting}
                className="px-6 py-2 bg-gradient-primary text-white rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {isMinting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Minting...</span>
                  </>
                ) : (
                  <>
                    <Crown className="w-4 h-4" />
                    <span>Mint NFT (0.01 SOL)</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};
