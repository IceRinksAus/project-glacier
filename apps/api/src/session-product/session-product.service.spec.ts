import { Test, TestingModule } from '@nestjs/testing';

import { PrismaService } from '../prisma/prisma.service';
import { SessionProductService } from './session-product.service';

describe('SessionProductService', () => {
  let service: SessionProductService;

  const prismaMock = {};

  beforeEach(async () => {
    const module: TestingModule =
      await Test.createTestingModule({
        providers: [
          SessionProductService,
          {
            provide: PrismaService,
            useValue: prismaMock,
          },
        ],
      }).compile();

    service =
      module.get<SessionProductService>(
        SessionProductService,
      );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
