import { Module } from '@nestjs/common';

import { FileAssetService } from './file-asset.service';
import { LocalStorageProvider } from './local-storage.provider';

@Module({
  providers: [FileAssetService, LocalStorageProvider],
  exports: [FileAssetService],
})
export class FileAssetModule {}
