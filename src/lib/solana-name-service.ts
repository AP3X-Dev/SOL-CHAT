import { Connection, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { encode as encodeBase58, decode as decodeBase58 } from 'bs58';
import type { SolanaNameRecord } from '../types/message';

// Mock SNS implementation - In production, this would interact with actual SNS contracts
export class SolanaNameService {
  private connection: Connection;
  private nameRegistry: Map<string, SolanaNameRecord> = new Map();
  private reverseRegistry: Map<string, string> = new Map();

  constructor(connection: Connection) {
    this.connection = connection;
    this.loadFromStorage();
  }

  /**
   * Register a new username for a wallet address
   */
  async registerUsername(
    username: string,
    walletAddress: string,
    signTransaction: (transaction: Transaction) => Promise<Transaction>
  ): Promise<{ success: boolean; error?: string; txId?: string }> {
    try {
      // Validate username
      const validation = this.validateUsername(username);
      if (!validation.valid) {
        return { success: false, error: validation.error };
      }

      // Check if username is available
      if (this.nameRegistry.has(username.toLowerCase())) {
        return { success: false, error: 'Username is already taken' };
      }

      // Check if wallet already has a username
      const existingUsername = this.reverseRegistry.get(walletAddress);
      if (existingUsername) {
        return { success: false, error: 'Wallet already has a registered username' };
      }

      // Create mock transaction (in production, this would be a real SNS transaction)
      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: new PublicKey(walletAddress),
          toPubkey: new PublicKey(walletAddress), // Mock - would be SNS program
          lamports: 0.01 * LAMPORTS_PER_SOL, // Registration fee
        })
      );

      // Sign transaction
      const signedTransaction = await signTransaction(transaction);
      
      // Mock transaction ID
      const txId = `mock_tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Register the username
      const record: SolanaNameRecord = {
        domain: username.toLowerCase(),
        owner: walletAddress,
        resolver: walletAddress,
        ttl: 86400, // 24 hours
        records: {
          wallet: walletAddress,
          created: Date.now().toString(),
        },
        createdAt: Date.now(),
        expiresAt: Date.now() + (365 * 24 * 60 * 60 * 1000), // 1 year
      };

      this.nameRegistry.set(username.toLowerCase(), record);
      this.reverseRegistry.set(walletAddress, username.toLowerCase());
      this.saveToStorage();

      return { success: true, txId };
    } catch (error) {
      console.error('Error registering username:', error);
      return { success: false, error: 'Failed to register username' };
    }
  }

  /**
   * Resolve username to wallet address
   */
  async resolveUsername(username: string): Promise<string | null> {
    const record = this.nameRegistry.get(username.toLowerCase());
    if (!record) return null;

    // Check if record is expired
    if (Date.now() > record.expiresAt) {
      this.nameRegistry.delete(username.toLowerCase());
      this.reverseRegistry.delete(record.owner);
      this.saveToStorage();
      return null;
    }

    return record.owner;
  }

  /**
   * Reverse resolve wallet address to username
   */
  async reverseResolve(walletAddress: string): Promise<string | null> {
    const username = this.reverseRegistry.get(walletAddress);
    if (!username) return null;

    const record = this.nameRegistry.get(username);
    if (!record || Date.now() > record.expiresAt) {
      this.nameRegistry.delete(username);
      this.reverseRegistry.delete(walletAddress);
      this.saveToStorage();
      return null;
    }

    return username;
  }

  /**
   * Check if username is available
   */
  async isUsernameAvailable(username: string): Promise<boolean> {
    const validation = this.validateUsername(username);
    if (!validation.valid) return false;

    const record = this.nameRegistry.get(username.toLowerCase());
    if (!record) return true;

    // Check if expired
    if (Date.now() > record.expiresAt) {
      this.nameRegistry.delete(username.toLowerCase());
      this.reverseRegistry.delete(record.owner);
      this.saveToStorage();
      return true;
    }

    return false;
  }

  /**
   * Get all registered usernames (for search/discovery)
   */
  async searchUsernames(query: string, limit: number = 10): Promise<SolanaNameRecord[]> {
    const results: SolanaNameRecord[] = [];
    const lowerQuery = query.toLowerCase();

    for (const [username, record] of this.nameRegistry.entries()) {
      if (Date.now() > record.expiresAt) continue;
      
      if (username.includes(lowerQuery) && results.length < limit) {
        results.push(record);
      }
    }

    return results.sort((a, b) => a.domain.localeCompare(b.domain));
  }

  /**
   * Validate username format
   */
  private validateUsername(username: string): { valid: boolean; error?: string } {
    if (!username || username.length < 3) {
      return { valid: false, error: 'Username must be at least 3 characters long' };
    }

    if (username.length > 32) {
      return { valid: false, error: 'Username must be less than 32 characters long' };
    }

    if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
      return { valid: false, error: 'Username can only contain letters, numbers, underscores, and hyphens' };
    }

    if (username.startsWith('-') || username.endsWith('-') || username.startsWith('_') || username.endsWith('_')) {
      return { valid: false, error: 'Username cannot start or end with special characters' };
    }

    // Reserved usernames
    const reserved = ['admin', 'root', 'system', 'solana', 'sol', 'chat', 'support', 'help'];
    if (reserved.includes(username.toLowerCase())) {
      return { valid: false, error: 'This username is reserved' };
    }

    return { valid: true };
  }

  /**
   * Load registry from localStorage
   */
  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem('solana_name_registry');
      if (stored) {
        const data = JSON.parse(stored);
        this.nameRegistry = new Map(data.nameRegistry || []);
        this.reverseRegistry = new Map(data.reverseRegistry || []);
      }
    } catch (error) {
      console.error('Error loading name registry from storage:', error);
    }
  }

  /**
   * Save registry to localStorage
   */
  private saveToStorage(): void {
    try {
      const data = {
        nameRegistry: Array.from(this.nameRegistry.entries()),
        reverseRegistry: Array.from(this.reverseRegistry.entries()),
      };
      localStorage.setItem('solana_name_registry', JSON.stringify(data));
    } catch (error) {
      console.error('Error saving name registry to storage:', error);
    }
  }

  /**
   * Get registration cost in SOL
   */
  getRegistrationCost(): number {
    return 0.01; // 0.01 SOL for registration
  }

  /**
   * Get renewal cost in SOL
   */
  getRenewalCost(): number {
    return 0.005; // 0.005 SOL for renewal
  }
}

// Singleton instance
let snsInstance: SolanaNameService | null = null;

export function getSolanaNameService(connection: Connection): SolanaNameService {
  if (!snsInstance) {
    snsInstance = new SolanaNameService(connection);
  }
  return snsInstance;
}

/**
 * Utility function to format display name
 */
export function formatDisplayName(address: string, username?: string): string {
  if (username) {
    return `@${username}`;
  }
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
}

/**
 * Utility function to parse user input (username or address)
 */
export function parseUserInput(input: string): { type: 'username' | 'address'; value: string } {
  if (input.startsWith('@')) {
    return { type: 'username', value: input.slice(1) };
  }
  
  // Check if it looks like a Solana address
  if (input.length >= 32 && /^[A-Za-z0-9]+$/.test(input)) {
    return { type: 'address', value: input };
  }
  
  return { type: 'username', value: input };
}
