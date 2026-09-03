import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  createCipheriv,
  createDecipheriv,
  createHash,
  createHmac,
  randomBytes,
  timingSafeEqual,
} from 'node:crypto';

const KEY_ID_PATTERN = /^[A-Za-z0-9-]{1,32}$/;
const KEY_VALUE_PATTERN = /^[A-Za-z0-9_-]{43}$/;
const MAX_KEYS = 4;
const LOCAL_KEY_ID = 'local-mfa-v1';
const LOCAL_ENCRYPTION_KEY = createHash('sha256')
  .update('project-glacier-local-mfa-encryption-key-v1')
  .digest();
const LOCAL_RECOVERY_PEPPER = createHash('sha256')
  .update('project-glacier-local-mfa-recovery-pepper-v1')
  .digest();
const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

export type EncryptedMfaSecret = {
  encryptionKeyId: string;
  encryptedSecret: string;
  encryptionNonce: string;
  encryptionTag: string;
};

@Injectable()
export class MfaCryptoService {
  private readonly activeKeyId: string;
  private readonly encryptionKeys: ReadonlyMap<string, Buffer>;
  private readonly recoveryPepper: Buffer;

  constructor(config: ConfigService) {
    const loaded = this.loadConfiguration(config);
    this.activeKeyId = loaded.activeKeyId;
    this.encryptionKeys = loaded.encryptionKeys;
    this.recoveryPepper = loaded.recoveryPepper;
  }

  generateSecret(): string {
    return this.encodeBase32(randomBytes(20));
  }

  encryptSecret(secret: string): EncryptedMfaSecret {
    const key = this.encryptionKeys.get(this.activeKeyId)!;
    const nonce = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', key, nonce);
    const encrypted = Buffer.concat([
      cipher.update(secret, 'utf8'),
      cipher.final(),
    ]);

    return {
      encryptionKeyId: this.activeKeyId,
      encryptedSecret: encrypted.toString('base64url'),
      encryptionNonce: nonce.toString('base64url'),
      encryptionTag: cipher.getAuthTag().toString('base64url'),
    };
  }

  decryptSecret(encrypted: EncryptedMfaSecret): string {
    const key = this.encryptionKeys.get(encrypted.encryptionKeyId);
    if (!key) throw new Error('MFA encryption key is not configured.');

    try {
      const decipher = createDecipheriv(
        'aes-256-gcm',
        key,
        Buffer.from(encrypted.encryptionNonce, 'base64url'),
      );
      decipher.setAuthTag(Buffer.from(encrypted.encryptionTag, 'base64url'));
      return Buffer.concat([
        decipher.update(
          Buffer.from(encrypted.encryptedSecret, 'base64url'),
        ),
        decipher.final(),
      ]).toString('utf8');
    } catch {
      throw new Error('MFA secret could not be decrypted.');
    }
  }

  createTotp(secret: string, counter: number): string {
    const counterBuffer = Buffer.alloc(8);
    counterBuffer.writeBigUInt64BE(BigInt(counter));
    const digest = createHmac('sha1', this.decodeBase32(secret))
      .update(counterBuffer)
      .digest();
    const offset = digest[digest.length - 1] & 0x0f;
    const value =
      (digest.readUInt32BE(offset) & 0x7fffffff) % 1_000_000;
    return value.toString().padStart(6, '0');
  }

  verifyTotp(
    secret: string,
    code: string,
    timeMs = Date.now(),
    lastUsedCounter: number | null = null,
  ): number | null {
    if (!/^\d{6}$/.test(code)) return null;
    const currentCounter = Math.floor(timeMs / 30_000);

    for (const counter of [currentCounter, currentCounter - 1, currentCounter + 1]) {
      if (counter <= (lastUsedCounter ?? -1)) continue;
      const expected = Buffer.from(this.createTotp(secret, counter));
      const supplied = Buffer.from(code);
      if (expected.length === supplied.length && timingSafeEqual(expected, supplied)) {
        return counter;
      }
    }
    return null;
  }

  createOtpAuthUri(secret: string, email: string): string {
    const label = encodeURIComponent(`Glacier:${email}`);
    return `otpauth://totp/${label}?secret=${secret}&issuer=Glacier&algorithm=SHA1&digits=6&period=30`;
  }

  generateChallengeToken(): string {
    return randomBytes(32).toString('base64url');
  }

  hashChallengeToken(token: string): string {
    return createHash('sha256')
      .update('project-glacier:mfa-challenge:v1:')
      .update(token)
      .digest('hex');
  }

  generateRecoveryCodes(count = 10): string[] {
    return Array.from({ length: count }, () => {
      const encoded = this.encodeBase32(randomBytes(16));
      return `${encoded.slice(0, 8)}-${encoded.slice(8, 16)}-${encoded.slice(16)}`;
    });
  }

  hashRecoveryCode(code: string): string {
    return createHmac('sha256', this.recoveryPepper)
      .update('project-glacier:mfa-recovery:v1:')
      .update(this.normalizeRecoveryCode(code))
      .digest('hex');
  }

  normalizeRecoveryCode(code: string): string {
    return code.trim().toUpperCase().replace(/-/g, '');
  }

  private encodeBase32(value: Buffer): string {
    let bits = 0;
    let accumulator = 0;
    let output = '';
    for (const byte of value) {
      accumulator = (accumulator << 8) | byte;
      bits += 8;
      while (bits >= 5) {
        output += BASE32_ALPHABET[(accumulator >>> (bits - 5)) & 31];
        bits -= 5;
      }
    }
    if (bits > 0) output += BASE32_ALPHABET[(accumulator << (5 - bits)) & 31];
    return output;
  }

  private decodeBase32(value: string): Buffer {
    if (!/^[A-Z2-7]+$/.test(value)) throw new Error('MFA secret is invalid.');
    let bits = 0;
    let accumulator = 0;
    const output: number[] = [];
    for (const character of value) {
      accumulator = (accumulator << 5) | BASE32_ALPHABET.indexOf(character);
      bits += 5;
      if (bits >= 8) {
        output.push((accumulator >>> (bits - 8)) & 255);
        bits -= 8;
      }
    }
    return Buffer.from(output);
  }

  private loadConfiguration(config: ConfigService) {
    const environment = config.get<string>('NODE_ENV');
    const activeKeyId = config.get<string>('MFA_ACTIVE_KEY_ID')?.trim();
    const serializedKeys = config.get<string>('MFA_ENCRYPTION_KEYS')?.trim();
    const serializedPepper = config.get<string>('MFA_RECOVERY_CODE_PEPPER')?.trim();

    if (!activeKeyId && !serializedKeys && !serializedPepper && environment !== 'production') {
      return {
        activeKeyId: LOCAL_KEY_ID,
        encryptionKeys: new Map([[LOCAL_KEY_ID, LOCAL_ENCRYPTION_KEY]]),
        recoveryPepper: LOCAL_RECOVERY_PEPPER,
      };
    }
    if (!activeKeyId || !serializedKeys || !serializedPepper) {
      throw new Error('MFA secret configuration is incomplete.');
    }
    if (!KEY_ID_PATTERN.test(activeKeyId) || !KEY_VALUE_PATTERN.test(serializedPepper)) {
      throw new Error('MFA secret configuration is invalid.');
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(serializedKeys);
    } catch {
      throw new Error('MFA secret configuration is invalid.');
    }
    if (!parsed || Array.isArray(parsed) || typeof parsed !== 'object') {
      throw new Error('MFA secret configuration is invalid.');
    }
    const entries = Object.entries(parsed);
    if (entries.length < 1 || entries.length > MAX_KEYS) {
      throw new Error('MFA secret configuration is invalid.');
    }
    const encryptionKeys = new Map<string, Buffer>();
    for (const [keyId, encoded] of entries) {
      if (!KEY_ID_PATTERN.test(keyId) || typeof encoded !== 'string' || !KEY_VALUE_PATTERN.test(encoded)) {
        throw new Error('MFA secret configuration is invalid.');
      }
      const key = Buffer.from(encoded, 'base64url');
      if (key.length !== 32) throw new Error('MFA secret configuration is invalid.');
      encryptionKeys.set(keyId, key);
    }
    if (!encryptionKeys.has(activeKeyId)) {
      throw new Error('MFA active encryption key is not configured.');
    }
    const recoveryPepper = Buffer.from(serializedPepper, 'base64url');
    if (recoveryPepper.length !== 32) throw new Error('MFA secret configuration is invalid.');
    return { activeKeyId, encryptionKeys, recoveryPepper };
  }
}
