import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash, createHmac, randomBytes, timingSafeEqual } from 'crypto';

const CURRENT_TOKEN_PATTERN = /^gt1_([a-f0-9]{32})_([A-Za-z0-9_-]{43})$/;
const LEGACY_TOKEN_PATTERN = /^[a-f0-9]{64}$/;
const KEY_ID_PATTERN = /^[A-Za-z0-9-]{1,32}$/;
const KEY_VALUE_PATTERN = /^[A-Za-z0-9_-]{43}$/;
const MAX_SIGNING_KEYS = 4;
const LOCAL_KEY_ID = 'local-v1';
const LOCAL_KEY = createHash('sha256')
  .update('project-glacier-local-ticket-signing-key-v1')
  .digest();

type ParsedTicketCredential =
  | {
      kind: 'current';
      selector: string;
      mac: string;
    }
  | {
      kind: 'legacy';
      hash: string;
    };

export type StoredTicketCredential = {
  id: string;
  credentialSelector: string;
  credentialKeyId: string;
};

export type IssuedTicketCredential = StoredTicketCredential & {
  token: string;
};

@Injectable()
export class TicketCredentialService {
  private readonly activeKeyId: string;
  private readonly signingKeys: ReadonlyMap<string, Buffer>;

  constructor(config: ConfigService) {
    const configuration = this.loadConfiguration(config);
    this.activeKeyId = configuration.activeKeyId;
    this.signingKeys = configuration.signingKeys;
  }

  issue(ticketId: string): IssuedTicketCredential {
    const credentialSelector = randomBytes(16).toString('hex');
    const credentialKeyId = this.activeKeyId;

    return {
      id: ticketId,
      credentialSelector,
      credentialKeyId,
      token: this.present({
        id: ticketId,
        credentialSelector,
        credentialKeyId,
      }),
    };
  }

  present(ticket: StoredTicketCredential): string {
    this.assertSelector(ticket.credentialSelector);
    this.assertKeyId(ticket.credentialKeyId);

    const mac = this.createMac(ticket);
    return `gt1_${ticket.credentialSelector}_${mac}`;
  }

  parse(token: string): ParsedTicketCredential | null {
    const currentMatch = CURRENT_TOKEN_PATTERN.exec(token);
    if (currentMatch) {
      return {
        kind: 'current',
        selector: currentMatch[1],
        mac: currentMatch[2],
      };
    }

    if (LEGACY_TOKEN_PATTERN.test(token)) {
      return {
        kind: 'legacy',
        hash: this.hashLegacy(token),
      };
    }

    return null;
  }

  verifyCurrent(ticket: StoredTicketCredential, token: string): boolean {
    const parsed = this.parse(token);
    if (
      !parsed ||
      parsed.kind !== 'current' ||
      parsed.selector !== ticket.credentialSelector
    ) {
      return false;
    }

    let expectedMac: Buffer;
    let suppliedMac: Buffer;

    try {
      expectedMac = Buffer.from(this.createMac(ticket), 'base64url');
      suppliedMac = Buffer.from(parsed.mac, 'base64url');
    } catch {
      return false;
    }

    return (
      expectedMac.length === suppliedMac.length &&
      timingSafeEqual(expectedMac, suppliedMac)
    );
  }

  hashLegacy(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  isLegacy(token: string): boolean {
    return LEGACY_TOKEN_PATTERN.test(token);
  }

  getActiveKeyId(): string {
    return this.activeKeyId;
  }

  private createMac(ticket: StoredTicketCredential): string {
    const signingKey = this.signingKeys.get(ticket.credentialKeyId);
    if (!signingKey) {
      throw new Error(
        `Ticket signing key ${ticket.credentialKeyId} is not configured.`,
      );
    }

    const message = [
      'project-glacier',
      'ticket',
      'gt1',
      ticket.id,
      ticket.credentialSelector,
      ticket.credentialKeyId,
    ].join(':');

    return createHmac('sha256', signingKey).update(message).digest('base64url');
  }

  private loadConfiguration(config: ConfigService): {
    activeKeyId: string;
    signingKeys: ReadonlyMap<string, Buffer>;
  } {
    const environment = config.get<string>('NODE_ENV');
    const activeKeyId = config
      .get<string>('TICKET_TOKEN_ACTIVE_KEY_ID')
      ?.trim();
    const serializedKeys = config
      .get<string>('TICKET_TOKEN_SIGNING_KEYS')
      ?.trim();

    if (!activeKeyId && !serializedKeys && environment !== 'production') {
      return {
        activeKeyId: LOCAL_KEY_ID,
        signingKeys: new Map([[LOCAL_KEY_ID, LOCAL_KEY]]),
      };
    }

    if (!activeKeyId || !serializedKeys) {
      throw new Error('Ticket signing-key configuration is incomplete.');
    }

    this.assertKeyId(activeKeyId);

    let parsed: unknown;
    try {
      parsed = JSON.parse(serializedKeys);
    } catch {
      throw new Error('Ticket signing-key configuration is invalid.');
    }

    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      throw new Error('Ticket signing-key configuration is invalid.');
    }

    const entries = Object.entries(parsed);
    if (entries.length < 1 || entries.length > MAX_SIGNING_KEYS) {
      throw new Error(
        `Ticket signing-key configuration must contain 1 to ${MAX_SIGNING_KEYS} keys.`,
      );
    }

    const signingKeys = new Map<string, Buffer>();
    for (const [keyId, encodedKey] of entries) {
      this.assertKeyId(keyId);
      if (
        typeof encodedKey !== 'string' ||
        !KEY_VALUE_PATTERN.test(encodedKey)
      ) {
        throw new Error('Ticket signing-key configuration is invalid.');
      }

      const key = Buffer.from(encodedKey, 'base64url');
      if (key.length !== 32) {
        throw new Error('Ticket signing-key configuration is invalid.');
      }

      signingKeys.set(keyId, key);
    }

    if (!signingKeys.has(activeKeyId)) {
      throw new Error(
        `Active Ticket signing key ${activeKeyId} is not configured.`,
      );
    }

    return { activeKeyId, signingKeys };
  }

  private assertSelector(selector: string) {
    if (!/^[a-f0-9]{32}$/.test(selector)) {
      throw new Error('Ticket credential selector is invalid.');
    }
  }

  private assertKeyId(keyId: string) {
    if (!KEY_ID_PATTERN.test(keyId)) {
      throw new Error('Ticket signing-key identifier is invalid.');
    }
  }
}
