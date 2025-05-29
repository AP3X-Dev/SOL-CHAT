import { io, Socket } from 'socket.io-client';
import { nanoid } from 'nanoid';
import { encryptMessage, decryptMessage } from './crypto';
import { PublicKey } from '@solana/web3.js';
import type { Message, TypingIndicator, Peer } from '../types/message';

export interface RealtimeMessage {
  id: string;
  type: 'message' | 'typing' | 'presence' | 'delivery_receipt' | 'read_receipt';
  from: string;
  to: string;
  data: any;
  timestamp: number;
  signature?: string;
}

export interface PresenceData {
  userId: string;
  status: 'online' | 'away' | 'busy' | 'offline';
  lastSeen: number;
  device?: string;
}

export class RealtimeService {
  private socket: Socket | null = null;
  private currentUser: string | null = null;
  private messageQueue: RealtimeMessage[] = [];
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  
  // Event handlers
  private onMessageReceived: ((message: Message) => void) | null = null;
  private onTypingUpdate: ((indicator: TypingIndicator) => void) | null = null;
  private onPresenceUpdate: ((presence: PresenceData) => void) | null = null;
  private onDeliveryReceipt: ((messageId: string, timestamp: number) => void) | null = null;
  private onReadReceipt: ((messageId: string, timestamp: number) => void) | null = null;
  private onConnectionStatusChange: ((status: 'connected' | 'disconnected' | 'reconnecting') => void) | null = null;

  constructor() {
    // Initialize with mock WebSocket for demo
    this.initializeMockConnection();
  }

  /**
   * Initialize connection (mock implementation for demo)
   */
  private initializeMockConnection() {
    // Simulate connection events
    setTimeout(() => {
      this.onConnectionStatusChange?.('connected');
      this.startHeartbeat();
    }, 1000);

    // Simulate random incoming messages for demo
    this.simulateIncomingMessages();
  }

  /**
   * Connect to real-time service
   */
  async connect(userId: string, authToken?: string): Promise<void> {
    this.currentUser = userId;
    
    try {
      // In production, this would connect to actual WebSocket server
      // this.socket = io(process.env.VITE_WEBSOCKET_URL || 'ws://localhost:3001', {
      //   auth: { token: authToken, userId },
      //   transports: ['websocket'],
      //   timeout: 10000,
      // });

      // Mock connection for demo
      this.onConnectionStatusChange?.('connected');
      this.startHeartbeat();
      
      // Process queued messages
      this.processMessageQueue();
      
    } catch (error) {
      console.error('Failed to connect to realtime service:', error);
      this.onConnectionStatusChange?.('disconnected');
      this.scheduleReconnect();
    }
  }

  /**
   * Disconnect from service
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
    
    this.onConnectionStatusChange?.('disconnected');
  }

  /**
   * Send encrypted message
   */
  async sendMessage(
    content: string,
    recipientPublicKey: string,
    senderPrivateKey: Uint8Array,
    messageType: 'text' | 'file' | 'image' = 'text',
    fileData?: { url: string; name: string; size: number; type: string }
  ): Promise<string> {
    const messageId = nanoid();
    
    try {
      // Encrypt message content
      const { encrypted, nonce } = await encryptMessage(
        content,
        senderPrivateKey,
        new PublicKey(recipientPublicKey)
      );

      const realtimeMessage: RealtimeMessage = {
        id: messageId,
        type: 'message',
        from: this.currentUser!,
        to: recipientPublicKey,
        data: {
          messageId,
          content: encrypted,
          nonce,
          messageType,
          fileData,
          timestamp: Date.now(),
        },
        timestamp: Date.now(),
      };

      // Send via WebSocket or queue if offline
      if (this.isConnected()) {
        this.sendRealtimeMessage(realtimeMessage);
      } else {
        this.messageQueue.push(realtimeMessage);
      }

      return messageId;
    } catch (error) {
      console.error('Failed to send message:', error);
      throw error;
    }
  }

  /**
   * Send typing indicator
   */
  sendTypingIndicator(recipientPublicKey: string, isTyping: boolean): void {
    if (!this.isConnected()) return;

    const message: RealtimeMessage = {
      id: nanoid(),
      type: 'typing',
      from: this.currentUser!,
      to: recipientPublicKey,
      data: { isTyping },
      timestamp: Date.now(),
    };

    this.sendRealtimeMessage(message);
  }

  /**
   * Update presence status
   */
  updatePresence(status: 'online' | 'away' | 'busy' | 'offline'): void {
    if (!this.isConnected()) return;

    const message: RealtimeMessage = {
      id: nanoid(),
      type: 'presence',
      from: this.currentUser!,
      to: 'broadcast',
      data: {
        status,
        lastSeen: Date.now(),
        device: navigator.userAgent,
      },
      timestamp: Date.now(),
    };

    this.sendRealtimeMessage(message);
  }

  /**
   * Send delivery receipt
   */
  sendDeliveryReceipt(messageId: string, senderPublicKey: string): void {
    if (!this.isConnected()) return;

    const message: RealtimeMessage = {
      id: nanoid(),
      type: 'delivery_receipt',
      from: this.currentUser!,
      to: senderPublicKey,
      data: { messageId, timestamp: Date.now() },
      timestamp: Date.now(),
    };

    this.sendRealtimeMessage(message);
  }

  /**
   * Send read receipt
   */
  sendReadReceipt(messageId: string, senderPublicKey: string): void {
    if (!this.isConnected()) return;

    const message: RealtimeMessage = {
      id: nanoid(),
      type: 'read_receipt',
      from: this.currentUser!,
      to: senderPublicKey,
      data: { messageId, timestamp: Date.now() },
      timestamp: Date.now(),
    };

    this.sendRealtimeMessage(message);
  }

  /**
   * Event handlers setup
   */
  onMessage(handler: (message: Message) => void): void {
    this.onMessageReceived = handler;
  }

  onTyping(handler: (indicator: TypingIndicator) => void): void {
    this.onTypingUpdate = handler;
  }

  onPresence(handler: (presence: PresenceData) => void): void {
    this.onPresenceUpdate = handler;
  }

  onDelivery(handler: (messageId: string, timestamp: number) => void): void {
    this.onDeliveryReceipt = handler;
  }

  onRead(handler: (messageId: string, timestamp: number) => void): void {
    this.onReadReceipt = handler;
  }

  onConnectionStatus(handler: (status: 'connected' | 'disconnected' | 'reconnecting') => void): void {
    this.onConnectionStatusChange = handler;
  }

  /**
   * Utility methods
   */
  private isConnected(): boolean {
    return this.socket?.connected || true; // Mock as always connected for demo
  }

  private sendRealtimeMessage(message: RealtimeMessage): void {
    // In production, send via WebSocket
    // this.socket?.emit('message', message);
    
    // Mock implementation - simulate message delivery
    console.log('Sending realtime message:', message);
  }

  private processMessageQueue(): void {
    while (this.messageQueue.length > 0) {
      const message = this.messageQueue.shift();
      if (message) {
        this.sendRealtimeMessage(message);
      }
    }
  }

  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      if (this.isConnected()) {
        // Send heartbeat
        this.updatePresence('online');
      }
    }, 30000); // Every 30 seconds
  }

  private scheduleReconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
      
      setTimeout(() => {
        this.onConnectionStatusChange?.('reconnecting');
        this.connect(this.currentUser!);
      }, delay);
    }
  }

  private simulateIncomingMessages(): void {
    // Simulate random incoming messages for demo purposes
    setInterval(() => {
      if (Math.random() > 0.95 && this.currentUser) {
        const mockMessage: Message = {
          id: nanoid(),
          sender: 'demo_user_' + Math.random().toString(36).substr(2, 5),
          senderUsername: '@demo_user',
          recipient: this.currentUser,
          content: 'Hello! This is a simulated real-time message.',
          nonce: 'mock_nonce',
          timestamp: Date.now(),
          status: 'delivered',
          messageType: 'text',
        };
        
        this.onMessageReceived?.(mockMessage);
      }
    }, 10000); // Every 10 seconds
  }
}

// Singleton instance
let realtimeService: RealtimeService | null = null;

export function getRealtimeService(): RealtimeService {
  if (!realtimeService) {
    realtimeService = new RealtimeService();
  }
  return realtimeService;
}
