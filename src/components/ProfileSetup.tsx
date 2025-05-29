import React, { useState, useEffect } from 'react';
import { UserCircle, AtSign, Check, X, Loader2 } from 'lucide-react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { saveProfile, getLocalProfile } from '../lib/profile';
import { getSolanaNameService } from '../lib/solana-name-service';
import type { UserProfile } from '../types/message';

interface Props {
  publicKey: string;
  onComplete: () => void;
}

export const ProfileSetup: React.FC<Props> = ({ publicKey, onComplete }) => {
  const { connection } = useConnection();
  const { signTransaction } = useWallet();
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [registeringSNS, setRegisteringSNS] = useState(false);
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [registerSNS, setRegisterSNS] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      const profile = await getLocalProfile();
      if (profile?.username) {
        setUsername(profile.username);
      }
      setLoading(false);
    };
    loadProfile();
  }, []);

  // Check username availability when typing
  useEffect(() => {
    const checkAvailability = async () => {
      if (!username || username.length < 3) {
        setIsAvailable(null);
        return;
      }

      setCheckingAvailability(true);
      try {
        const sns = getSolanaNameService(connection);
        const available = await sns.isUsernameAvailable(username);
        setIsAvailable(available);
      } catch (err) {
        setIsAvailable(null);
      } finally {
        setCheckingAvailability(false);
      }
    };

    const timeoutId = setTimeout(checkAvailability, 500);
    return () => clearTimeout(timeoutId);
  }, [username, connection]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username.trim()) {
      setError('Username is required');
      return;
    }

    if (username.length < 3) {
      setError('Username must be at least 3 characters long');
      return;
    }

    if (registerSNS && !isAvailable) {
      setError('Username is not available for SNS registration');
      return;
    }

    try {
      let snsRegistered = false;

      // Register SNS username if requested
      if (registerSNS && signTransaction) {
        setRegisteringSNS(true);
        try {
          const sns = getSolanaNameService(connection);
          const result = await sns.registerUsername(username.trim(), publicKey, signTransaction);

          if (result.success) {
            snsRegistered = true;
          } else {
            setError(result.error || 'Failed to register username');
            setRegisteringSNS(false);
            return;
          }
        } catch (err) {
          setError('Failed to register username on Solana Name Service');
          setRegisteringSNS(false);
          return;
        }
      }

      const profile: UserProfile = {
        publicKey,
        username: username.trim(),
        updatedAt: Date.now(),
        createdAt: Date.now(),
        solanaNameService: snsRegistered ? username.trim() : undefined,
        verified: snsRegistered,
      };

      await saveProfile(profile);
      onComplete();
    } catch (err) {
      setError('Failed to save profile. Please try again.');
    } finally {
      setRegisteringSNS(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="flex flex-col items-center mb-8">
        <img src="/logo.png" alt="SOL-CHAT Logo" className="w-32 h-auto mb-4" />
        <h1 className="text-4xl font-bold text-text mb-2">
          SOL-CHAT
        </h1>
        <p className="text-text-muted">
          Secure messaging on Solana
        </p>
      </div>

      <div className="card p-8 max-w-md w-full shadow-elevation-2 animate-fade-in border-border">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-text">Set Your Username</h2>
          <p className="text-text-muted mt-2">
            Choose a username that other users will see when you message them.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-text">
              Username
            </label>
            <div className="relative mt-1">
              <input
                type="text"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className={`input bg-card-highlight border-border pr-10 ${
                  error ? 'border-error focus:ring-error/50' :
                  isAvailable === true ? 'border-success focus:ring-success/50' :
                  isAvailable === false ? 'border-error focus:ring-error/50' : ''
                }`}
                placeholder="Enter your username"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                {checkingAvailability ? (
                  <Loader2 className="w-4 h-4 animate-spin text-text-muted" />
                ) : isAvailable === true ? (
                  <Check className="w-4 h-4 text-success" />
                ) : isAvailable === false ? (
                  <X className="w-4 h-4 text-error" />
                ) : null}
              </div>
            </div>

            {username.length >= 3 && isAvailable !== null && (
              <p className={`mt-1 text-sm ${isAvailable ? 'text-success' : 'text-error'}`}>
                {isAvailable ? 'Username is available!' : 'Username is already taken'}
              </p>
            )}

            {error && <p className="mt-1 text-sm text-error">{error}</p>}
          </div>

          {/* SNS Registration Option */}
          {isAvailable && (
            <div className="p-4 bg-card-highlight rounded-lg border border-border">
              <div className="flex items-start space-x-3">
                <input
                  type="checkbox"
                  id="registerSNS"
                  checked={registerSNS}
                  onChange={(e) => setRegisterSNS(e.target.checked)}
                  className="mt-1 h-4 w-4 text-primary focus:ring-primary border-border rounded"
                />
                <div className="flex-1">
                  <label htmlFor="registerSNS" className="text-sm font-medium text-text flex items-center gap-2">
                    <AtSign className="w-4 h-4 text-primary" />
                    Register on Solana Name Service
                  </label>
                  <p className="text-xs text-text-muted mt-1">
                    Register your username on-chain for 0.01 SOL. This allows others to find you by @{username} instead of your wallet address.
                  </p>
                </div>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={registeringSNS || (registerSNS && !isAvailable)}
            className="w-full py-3 px-4 rounded-lg font-medium bg-gradient-tertiary text-white hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {registeringSNS ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Registering Username...
              </>
            ) : registerSNS ? (
              <>
                <AtSign className="w-4 h-4" />
                Complete Setup & Register SNS
              </>
            ) : (
              'Save Username'
            )}
          </button>
        </form>
      </div>
    </div>
  );
};