import { ConfigService } from '@nestjs/config';

import { TicketCredentialService } from './ticket-credential.service';

const primaryKey = Buffer.alloc(32, 1).toString('base64url');
const previousKey = Buffer.alloc(32, 2).toString('base64url');

function createService(overrides: Record<string, string | undefined> = {}) {
  const values = {
    NODE_ENV: 'production',
    TICKET_TOKEN_ACTIVE_KEY_ID: 'primary-v1',
    TICKET_TOKEN_SIGNING_KEYS: JSON.stringify({
      'primary-v1': primaryKey,
      'previous-v1': previousKey,
    }),
    ...overrides,
  };

  return new TicketCredentialService({
    get: (name: string) => values[name as keyof typeof values],
  } as ConfigService);
}

describe('TicketCredentialService', () => {
  it('issues a bounded current credential without embedding the Ticket ID', () => {
    const credential = createService().issue('ticket-sensitive-id');

    expect(credential.credentialSelector).toMatch(/^[a-f0-9]{32}$/);
    expect(credential.credentialKeyId).toBe('primary-v1');
    expect(credential.token).toMatch(/^gt1_[a-f0-9]{32}_[A-Za-z0-9_-]{43}$/);
    expect(credential.token).not.toContain('ticket-sensitive-id');
  });

  it('creates distinct selectors and credentials for the same Ticket', () => {
    const service = createService();
    const first = service.issue('ticket-1');
    const second = service.issue('ticket-1');

    expect(first.credentialSelector).not.toBe(second.credentialSelector);
    expect(first.token).not.toBe(second.token);
  });

  it('invalidates the previous current and legacy credentials after rotation', () => {
    const service = createService();
    const previous = service.issue('ticket-1');
    const legacyToken = 'a'.repeat(64);
    const rotated = service.issue('ticket-1');
    const storedAfterRotation = {
      ...rotated,
      legacyCredentialHash: null,
    };

    expect(service.matches(storedAfterRotation, rotated.token)).toBe(true);
    expect(service.matches(storedAfterRotation, previous.token)).toBe(false);
    expect(service.matches(storedAfterRotation, legacyToken)).toBe(false);
  });

  it('reconstructs and verifies the current credential', () => {
    const service = createService();
    const credential = service.issue('ticket-1');

    expect(service.present(credential)).toBe(credential.token);
    expect(service.verifyCurrent(credential, credential.token)).toBe(true);
  });

  it('rejects changed versions, selectors and MACs', () => {
    const service = createService();
    const credential = service.issue('ticket-1');
    const parts = credential.token.split('_');

    expect(
      service.verifyCurrent(credential, `gt2_${parts[1]}_${parts[2]}`),
    ).toBe(false);
    expect(
      service.verifyCurrent(credential, `gt1_${'f'.repeat(32)}_${parts[2]}`),
    ).toBe(false);
    expect(
      service.verifyCurrent(
        credential,
        `gt1_${parts[1]}_${parts[2][0] === 'A' ? 'B' : 'A'}${parts[2].slice(1)}`,
      ),
    ).toBe(false);
  });

  it('binds the MAC to Ticket ID, selector and key ID', () => {
    const service = createService();
    const credential = service.issue('ticket-1');

    expect(
      service.verifyCurrent(
        { ...credential, id: 'ticket-2' },
        credential.token,
      ),
    ).toBe(false);
    expect(
      service.verifyCurrent(
        { ...credential, credentialKeyId: 'previous-v1' },
        credential.token,
      ),
    ).toBe(false);
  });

  it('parses legacy credentials only as one-way hashes', () => {
    const service = createService();
    const legacyToken = 'a'.repeat(64);

    expect(service.parse(legacyToken)).toEqual({
      kind: 'legacy',
      hash: service.hashLegacy(legacyToken),
    });
    expect(service.hashLegacy(legacyToken)).not.toBe(legacyToken);
    expect(service.isLegacy(legacyToken)).toBe(true);
  });

  it('rejects malformed credentials before cryptographic work', () => {
    const service = createService();

    expect(service.parse('not-a-ticket-credential')).toBeNull();
    expect(service.parse(`gt1_${'a'.repeat(32)}_short`)).toBeNull();
  });

  it('supports Tickets that reference a retained previous key', () => {
    const service = createService();
    const previousService = createService({
      TICKET_TOKEN_ACTIVE_KEY_ID: 'previous-v1',
    });
    const credential = previousService.issue('ticket-1');

    expect(service.present(credential)).toBe(credential.token);
    expect(service.verifyCurrent(credential, credential.token)).toBe(true);
  });

  it('uses a stable local-only default outside production', () => {
    const config = {
      get: (name: string) => (name === 'NODE_ENV' ? 'development' : undefined),
    } as ConfigService;
    const first = new TicketCredentialService(config);
    const second = new TicketCredentialService(config);
    const stored = {
      id: 'ticket-1',
      credentialSelector: 'a'.repeat(32),
      credentialKeyId: first.getActiveKeyId(),
    };

    expect(first.present(stored)).toBe(second.present(stored));
  });

  it.each([
    {
      name: 'missing configuration',
      overrides: {
        TICKET_TOKEN_ACTIVE_KEY_ID: undefined,
        TICKET_TOKEN_SIGNING_KEYS: undefined,
      },
    },
    {
      name: 'short key',
      overrides: {
        TICKET_TOKEN_SIGNING_KEYS: JSON.stringify({
          'primary-v1': Buffer.alloc(16).toString('base64url'),
        }),
      },
    },
    {
      name: 'unknown active key',
      overrides: {
        TICKET_TOKEN_ACTIVE_KEY_ID: 'missing-v1',
      },
    },
    {
      name: 'malformed key ring',
      overrides: {
        TICKET_TOKEN_SIGNING_KEYS: '{not-json',
      },
    },
  ])(
    'fails closed for $name without exposing key material',
    ({ overrides }) => {
      let message = '';
      try {
        createService(overrides);
      } catch (error) {
        message = (error as Error).message;
      }

      expect(message).toBeTruthy();
      expect(message).not.toContain(primaryKey);
      expect(message).not.toContain(previousKey);
    },
  );
});
