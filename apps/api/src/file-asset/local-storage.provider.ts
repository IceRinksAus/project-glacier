import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { mkdir, readFile, unlink, writeFile } from 'node:fs/promises';
import { dirname, resolve, sep } from 'node:path';

import { StorageProvider } from './file-asset.types';

@Injectable()
export class LocalStorageProvider implements StorageProvider {
  readonly name = 'LOCAL_DEVELOPMENT';
  private readonly root: string;

  constructor(config: ConfigService) {
    this.root = resolve(
      config.get<string>('GLACIER_LOCAL_ASSET_ROOT') ??
        resolve(process.cwd(), '../../.glacier-storage'),
    );
  }

  private resolveKey(storageKey: string) {
    if (
      !/^event-branding\/[A-Za-z0-9_-]+\/[A-Za-z0-9_-]+\/[0-9a-f-]{36}\.(png|jpg)$/.test(
        storageKey,
      )
    ) {
      throw new Error('Invalid storage key.');
    }
    const target = resolve(this.root, storageKey);
    if (!target.startsWith(`${this.root}${sep}`))
      throw new Error('Invalid storage key.');
    return target;
  }

  async put(storageKey: string, content: Buffer) {
    const target = this.resolveKey(storageKey);
    await mkdir(dirname(target), { recursive: true });
    await writeFile(target, content, { flag: 'wx' });
  }

  get(storageKey: string) {
    return readFile(this.resolveKey(storageKey));
  }

  async remove(storageKey: string) {
    await unlink(this.resolveKey(storageKey)).catch(
      (error: NodeJS.ErrnoException) => {
        if (error.code !== 'ENOENT') throw error;
      },
    );
  }
}
