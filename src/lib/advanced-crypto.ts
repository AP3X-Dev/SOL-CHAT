import { PublicKey, Keypair } from '@solana/web3.js';
import { encode as encodeBase58, decode as decodeBase58 } from 'bs58';
import { encode as encodeUTF8, decode as decodeUTF8 } from '@stablelib/utf8';
import { box, randomBytes, secretbox, hash, sign } from 'tweetnacl';
import { nanoid } from 'nanoid';

export interface EncryptedData {
  encrypted: string;
  nonce: string;
  ephemeralPublicKey?: string;
  signature?: string;
  algorithm: 'nacl-box' | 'nacl-secretbox' | 'aes-gcm';
  version: string;
}

export interface KeyPair {
  publicKey: Uint8Array;
  secretKey: Uint8Array;
}

export interface MessageSignature {
  signature: string;
  publicKey: string;
  timestamp: number;
}

/**
 * Advanced encryption service with forward secrecy and multiple algorithms
 */
export class AdvancedCrypto {
  private static readonly VERSION = '2.0';
  private static readonly KEY_DERIVATION_ROUNDS = 100000;

  /**
   * Generate ephemeral keypair for forward secrecy
   */
  static generateEphemeralKeyPair(): KeyPair {
    return box.keyPair();
  }

  /**
   * Derive key from password using PBKDF2-like approach
   */
  static async deriveKey(password: string, salt: Uint8Array): Promise<Uint8Array> {
    const passwordBytes = encodeUTF8(password);
    let derived = new Uint8Array([...passwordBytes, ...salt]);
    
    // Simple key derivation (in production, use proper PBKDF2)
    for (let i = 0; i < 1000; i++) {
      derived = hash(derived);
    }
    
    return derived.slice(0, 32); // 256-bit key
  }

  /**
   * Encrypt message with forward secrecy using ephemeral keys
   */
  static async encryptWithForwardSecrecy(
    message: string,
    recipientPublicKey: PublicKey,
    senderPrivateKey?: Uint8Array
  ): Promise<EncryptedData> {
    try {
      // Generate ephemeral keypair for this message
      const ephemeralKeyPair = this.generateEphemeralKeyPair();
      const nonce = randomBytes(box.nonceLength);
      const messageBytes = encodeUTF8(message);
      const recipientPubKeyBytes = recipientPublicKey.toBytes();

      // Encrypt using ephemeral private key and recipient's public key
      const encrypted = box(
        messageBytes,
        nonce,
        recipientPubKeyBytes,
        ephemeralKeyPair.secretKey
      );

      if (!encrypted) {
        throw new Error('Encryption failed');
      }

      let signature: string | undefined;
      
      // Sign the message if sender private key is provided
      if (senderPrivateKey) {
        const messageHash = hash(messageBytes);
        const signatureBytes = sign.detached(messageHash, senderPrivateKey);
        signature = encodeBase58(signatureBytes);
      }

      return {
        encrypted: encodeBase58(encrypted),
        nonce: encodeBase58(nonce),
        ephemeralPublicKey: encodeBase58(ephemeralKeyPair.publicKey),
        signature,
        algorithm: 'nacl-box',
        version: this.VERSION,
      };
    } catch (error) {
      console.error('Encryption failed:', error);
      throw new Error('Failed to encrypt message');
    }
  }

  /**
   * Decrypt message with forward secrecy
   */
  static async decryptWithForwardSecrecy(
    encryptedData: EncryptedData,
    recipientPrivateKey: Uint8Array,
    senderPublicKey?: PublicKey
  ): Promise<string | null> {
    try {
      if (encryptedData.algorithm !== 'nacl-box') {
        throw new Error('Unsupported encryption algorithm');
      }

      const encryptedBytes = decodeBase58(encryptedData.encrypted);
      const nonceBytes = decodeBase58(encryptedData.nonce);
      const ephemeralPublicKeyBytes = decodeBase58(encryptedData.ephemeralPublicKey!);

      // Decrypt using recipient's private key and ephemeral public key
      const decrypted = box.open(
        encryptedBytes,
        nonceBytes,
        ephemeralPublicKeyBytes,
        recipientPrivateKey
      );

      if (!decrypted) {
        return null;
      }

      const message = decodeUTF8(decrypted);

      // Verify signature if provided
      if (encryptedData.signature && senderPublicKey) {
        const messageHash = hash(decrypted);
        const signatureBytes = decodeBase58(encryptedData.signature);
        const senderPubKeyBytes = senderPublicKey.toBytes();
        
        const isValid = sign.detached.verify(
          messageHash,
          signatureBytes,
          senderPubKeyBytes
        );
        
        if (!isValid) {
          console.warn('Message signature verification failed');
          return null;
        }
      }

      return message;
    } catch (error) {
      console.error('Decryption failed:', error);
      return null;
    }
  }

  /**
   * Encrypt file with symmetric encryption
   */
  static async encryptFile(
    fileData: ArrayBuffer,
    password?: string
  ): Promise<{ encrypted: EncryptedData; key?: string }> {
    try {
      const key = password 
        ? await this.deriveKey(password, randomBytes(16))
        : randomBytes(32);
      
      const nonce = randomBytes(secretbox.nonceLength);
      const fileBytes = new Uint8Array(fileData);
      
      const encrypted = secretbox(fileBytes, nonce, key);
      
      if (!encrypted) {
        throw new Error('File encryption failed');
      }

      const encryptedData: EncryptedData = {
        encrypted: encodeBase58(encrypted),
        nonce: encodeBase58(nonce),
        algorithm: 'nacl-secretbox',
        version: this.VERSION,
      };

      return {
        encrypted: encryptedData,
        key: password ? undefined : encodeBase58(key),
      };
    } catch (error) {
      console.error('File encryption failed:', error);
      throw new Error('Failed to encrypt file');
    }
  }

  /**
   * Decrypt file
   */
  static async decryptFile(
    encryptedData: EncryptedData,
    key: string | Uint8Array,
    password?: string
  ): Promise<ArrayBuffer | null> {
    try {
      let keyBytes: Uint8Array;
      
      if (password) {
        const nonceBytes = decodeBase58(encryptedData.nonce);
        keyBytes = await this.deriveKey(password, nonceBytes.slice(0, 16));
      } else {
        keyBytes = typeof key === 'string' ? decodeBase58(key) : key;
      }

      const encryptedBytes = decodeBase58(encryptedData.encrypted);
      const nonceBytes = decodeBase58(encryptedData.nonce);
      
      const decrypted = secretbox.open(encryptedBytes, nonceBytes, keyBytes);
      
      if (!decrypted) {
        return null;
      }

      return decrypted.buffer;
    } catch (error) {
      console.error('File decryption failed:', error);
      return null;
    }
  }

  /**
   * Generate message signature
   */
  static signMessage(
    message: string,
    privateKey: Uint8Array
  ): MessageSignature {
    const messageBytes = encodeUTF8(message);
    const messageHash = hash(messageBytes);
    const signature = sign.detached(messageHash, privateKey);
    
    // Extract public key from private key (last 32 bytes are public key)
    const publicKey = privateKey.slice(32);
    
    return {
      signature: encodeBase58(signature),
      publicKey: encodeBase58(publicKey),
      timestamp: Date.now(),
    };
  }

  /**
   * Verify message signature
   */
  static verifyMessageSignature(
    message: string,
    signature: MessageSignature,
    publicKey?: PublicKey
  ): boolean {
    try {
      const messageBytes = encodeUTF8(message);
      const messageHash = hash(messageBytes);
      const signatureBytes = decodeBase58(signature.signature);
      
      let publicKeyBytes: Uint8Array;
      if (publicKey) {
        publicKeyBytes = publicKey.toBytes();
      } else {
        publicKeyBytes = decodeBase58(signature.publicKey);
      }
      
      return sign.detached.verify(messageHash, signatureBytes, publicKeyBytes);
    } catch (error) {
      console.error('Signature verification failed:', error);
      return false;
    }
  }

  /**
   * Generate secure random ID
   */
  static generateSecureId(length: number = 21): string {
    return nanoid(length);
  }

  /**
   * Hash data using SHA-512
   */
  static hashData(data: string | Uint8Array): string {
    const dataBytes = typeof data === 'string' ? encodeUTF8(data) : data;
    const hashBytes = hash(dataBytes);
    return encodeBase58(hashBytes);
  }

  /**
   * Generate deterministic key from seed
   */
  static generateDeterministicKey(seed: string): KeyPair {
    const seedBytes = encodeUTF8(seed);
    const hashedSeed = hash(seedBytes);
    return box.keyPair.fromSecretKey(hashedSeed.slice(0, 32));
  }

  /**
   * Secure key exchange using ECDH
   */
  static performKeyExchange(
    myPrivateKey: Uint8Array,
    theirPublicKey: Uint8Array
  ): Uint8Array {
    // Perform ECDH key exchange
    const sharedSecret = box.before(theirPublicKey, myPrivateKey);
    return sharedSecret;
  }

  /**
   * Encrypt with shared secret
   */
  static encryptWithSharedSecret(
    message: string,
    sharedSecret: Uint8Array
  ): EncryptedData {
    const nonce = randomBytes(secretbox.nonceLength);
    const messageBytes = encodeUTF8(message);
    const encrypted = secretbox(messageBytes, nonce, sharedSecret);
    
    if (!encrypted) {
      throw new Error('Encryption with shared secret failed');
    }

    return {
      encrypted: encodeBase58(encrypted),
      nonce: encodeBase58(nonce),
      algorithm: 'nacl-secretbox',
      version: this.VERSION,
    };
  }

  /**
   * Decrypt with shared secret
   */
  static decryptWithSharedSecret(
    encryptedData: EncryptedData,
    sharedSecret: Uint8Array
  ): string | null {
    try {
      const encryptedBytes = decodeBase58(encryptedData.encrypted);
      const nonceBytes = decodeBase58(encryptedData.nonce);
      
      const decrypted = secretbox.open(encryptedBytes, nonceBytes, sharedSecret);
      
      if (!decrypted) {
        return null;
      }

      return decodeUTF8(decrypted);
    } catch (error) {
      console.error('Decryption with shared secret failed:', error);
      return null;
    }
  }
}
