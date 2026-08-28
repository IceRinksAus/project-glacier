import { Controller, Get, Header } from '@nestjs/common';

import { HealthService } from './health.service';

@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get('live')
  @Header('Cache-Control', 'no-store')
  liveness() {
    return this.healthService.liveness();
  }

  @Get('ready')
  @Header('Cache-Control', 'no-store')
  readiness() {
    return this.healthService.readiness();
  }
}
