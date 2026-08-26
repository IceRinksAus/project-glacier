import { Module } from '@nestjs/common';

import { InventoryCommitmentService } from './inventory-commitment.service';

@Module({
  providers: [InventoryCommitmentService],
  exports: [InventoryCommitmentService],
})
export class InventoryModule {}
