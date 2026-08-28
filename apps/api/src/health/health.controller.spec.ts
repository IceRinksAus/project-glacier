import { Test, TestingModule } from '@nestjs/testing';

import { HealthController } from './health.controller';
import { HealthService } from './health.service';

describe('HealthController', () => {
  let controller: HealthController;
  const service = {
    liveness: jest.fn(),
    readiness: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        {
          provide: HealthService,
          useValue: service,
        },
      ],
    }).compile();

    controller = module.get(HealthController);
  });

  it('delegates the liveness probe', () => {
    service.liveness.mockReturnValue({ status: 'ok' });

    expect(controller.liveness()).toEqual({ status: 'ok' });
    expect(service.liveness).toHaveBeenCalledTimes(1);
  });

  it('delegates the readiness probe', async () => {
    service.readiness.mockResolvedValue({ status: 'ready' });

    await expect(controller.readiness()).resolves.toEqual({ status: 'ready' });
    expect(service.readiness).toHaveBeenCalledTimes(1);
  });
});
