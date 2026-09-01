import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { ConfigService } from '@nestjs/config';

import { LocalStorageProvider } from './local-storage.provider';

describe('LocalStorageProvider', () => {
  let root: string;
  let provider: LocalStorageProvider;

  beforeEach(async () => {
    root = await mkdtemp(join(tmpdir(), 'glacier-assets-test-'));
    provider = new LocalStorageProvider({
      get: jest.fn().mockReturnValue(root),
    } as unknown as ConfigService);
  });

  afterEach(async () => {
    await rm(root, { recursive: true, force: true });
  });

  it('writes only a server-generated branding key beneath its root', async () => {
    const key =
      'event-branding/org-1/event-1/123e4567-e89b-12d3-a456-426614174000.png';
    await provider.put(key, Buffer.from('image'));

    await expect(
      readFile(join(root, key), 'utf8'),
    ).resolves.toBe('image');
  });

  it.each([
    '../outside.png',
    'event-branding/org-1/event-1/not-a-uuid.png',
    'event-branding/org-1/event-1/123e4567-e89b-12d3-a456-426614174000.svg',
    'other/org-1/event-1/123e4567-e89b-12d3-a456-426614174000.png',
  ])('rejects an unexpected storage key: %s', async (key) => {
    await expect(provider.put(key, Buffer.from('image'))).rejects.toThrow(
      'Invalid storage key.',
    );
  });
});
