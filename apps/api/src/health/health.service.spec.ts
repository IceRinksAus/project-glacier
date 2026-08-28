import { ServiceUnavailableException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { PrismaService } from '../prisma/prisma.service';
import { HealthService } from './health.service';

describe('HealthService', () => {
  let service: HealthService;
  const prisma = {
    $queryRaw: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HealthService,
        {
          provide: PrismaService,
          useValue: prisma,
        },
      ],
    }).compile();

    service = module.get(HealthService);
  });

  it('reports process liveness without querying dependencies', () => {
    expect(service.liveness()).toEqual({ status: 'ok' });
    expect(prisma.$queryRaw).not.toHaveBeenCalled();
  });

  it('reports readiness after the database responds', async () => {
    prisma.$queryRaw.mockResolvedValue([{ '?column?': 1 }]);

    await expect(service.readiness()).resolves.toEqual({ status: 'ready' });
    expect(prisma.$queryRaw).toHaveBeenCalledTimes(1);
  });

  it('fails readiness without disclosing dependency details', async () => {
    prisma.$queryRaw.mockRejectedValue(new Error('database host and password'));

    await expect(service.readiness()).rejects.toMatchObject(
      new ServiceUnavailableException({ status: 'not_ready' }),
    );
  });
});
