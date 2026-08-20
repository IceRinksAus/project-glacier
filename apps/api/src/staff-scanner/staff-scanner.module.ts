import { Module } from '@nestjs/common';

import { ScannerClock } from './scanner-clock';
import { StaffScannerController } from './staff-scanner.controller';
import { StaffScannerService } from './staff-scanner.service';

@Module({
  controllers: [StaffScannerController],
  providers: [StaffScannerService, ScannerClock],
})
export class StaffScannerModule {}
