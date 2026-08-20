import { Injectable } from '@nestjs/common';

@Injectable()
export class ScannerClock {
  now() {
    return new Date();
  }
}
