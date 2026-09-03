import { ConfigService } from '@nestjs/config';

import { MfaCryptoService } from './mfa-crypto.service';

const primaryKey = Buffer.alloc(32, 1).toString('base64url');
const recoveryPepper = Buffer.alloc(32, 2).toString('base64url');

function createService(overrides: Record<string, string | undefined> = {}) {
  const values = {
    NODE_ENV: 'production',
    MFA_ACTIVE_KEY_ID: 'primary-v1',
    MFA_ENCRYPTION_KEYS: JSON.stringify({ 'primary-v1': primaryKey }),
    MFA_RECOVERY_CODE_PEPPER: recoveryPepper,
    ...overrides,
  };
  return new MfaCryptoService({
    get: (name: string) => values[name as keyof typeof values],
  } as ConfigService);
}

describe('MfaCryptoService', () => {
  it('encrypts and authenticates a generated Base32 secret', () => {
    const service = createService();
    const secret = service.generateSecret();
    const encrypted = service.encryptSecret(secret);

    expect(secret).toMatch(/^[A-Z2-7]{32}$/);
    expect(encrypted.encryptedSecret).not.toContain(secret);
    expect(service.decryptSecret(encrypted)).toBe(secret);
    expect(() =>
      service.decryptSecret({ ...encrypted, encryptionTag: 'A'.repeat(22) }),
    ).toThrow('MFA secret could not be decrypted.');
  });

  it('matches the six-digit RFC 6238 result at 59 seconds', () => {
    const service = createService();
    expect(service.createTotp('GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ', 1)).toBe('287082');
  });

  it('accepts only the bounded clock window and prevents counter replay', () => {
    const service = createService();
    const secret = service.generateSecret();
    const time = 1_800_000;
    const counter = Math.floor(time / 30_000);
    const previous = service.createTotp(secret, counter - 1);
    const current = service.createTotp(secret, counter);

    expect(service.verifyTotp(secret, previous, time)).toBe(counter - 1);
    expect(service.verifyTotp(secret, current, time)).toBe(counter);
    expect(service.verifyTotp(secret, current, time, counter)).toBeNull();
    expect(service.verifyTotp(secret, '12345', time)).toBeNull();
    expect(service.verifyTotp(secret, service.createTotp(secret, counter - 2), time)).toBeNull();
  });

  it('creates distinct hash-only challenges and high-entropy recovery codes', () => {
    const service = createService();
    const token = service.generateChallengeToken();
    const codes = service.generateRecoveryCodes();

    expect(token).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(service.hashChallengeToken(token)).not.toContain(token);
    expect(codes).toHaveLength(10);
    expect(new Set(codes).size).toBe(10);
    expect(codes[0]).toMatch(/^[A-Z2-7]{8}-[A-Z2-7]{8}-[A-Z2-7]{10}$/);
    expect(service.hashRecoveryCode(codes[0])).toBe(
      service.hashRecoveryCode(codes[0].toLowerCase().replace(/-/g, '')),
    );
    expect(service.hashRecoveryCode(codes[0])).not.toContain(codes[0]);
  });

  it('creates an interoperable URI without exposing unrelated data', () => {
    const service = createService();
    expect(service.createOtpAuthUri('ABC234', 'owner+test@example.com')).toBe(
      'otpauth://totp/Glacier%3Aowner%2Btest%40example.com?secret=ABC234&issuer=Glacier&algorithm=SHA1&digits=6&period=30',
    );
  });

  it('uses a stable local-only configuration outside production', () => {
    const localConfig = { get: (name: string) => (name === 'NODE_ENV' ? 'development' : undefined) } as ConfigService;
    const first = new MfaCryptoService(localConfig);
    const second = new MfaCryptoService(localConfig);
    const code = first.generateRecoveryCodes(1)[0];
    expect(first.hashRecoveryCode(code)).toBe(second.hashRecoveryCode(code));
  });

  it.each([
    { MFA_ACTIVE_KEY_ID: undefined },
    { MFA_ENCRYPTION_KEYS: '{not-json' },
    { MFA_ENCRYPTION_KEYS: JSON.stringify({ 'primary-v1': Buffer.alloc(16).toString('base64url') }) },
    { MFA_ACTIVE_KEY_ID: 'missing-v1' },
    { MFA_RECOVERY_CODE_PEPPER: Buffer.alloc(16).toString('base64url') },
  ])('fails closed without exposing configured material', (overrides) => {
    let message = '';
    try {
      createService(overrides);
    } catch (error) {
      message = (error as Error).message;
    }
    expect(message).toBeTruthy();
    expect(message).not.toContain(primaryKey);
    expect(message).not.toContain(recoveryPepper);
  });
});
