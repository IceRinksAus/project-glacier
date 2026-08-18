import { Test, TestingModule } from '@nestjs/testing';

import { PrismaService } from '../prisma/prisma.service';
import { RuleService } from './rule.service';

describe('RuleService', () => {
  let service: RuleService;

  const prismaMock = {};

  beforeEach(async () => {
    const module: TestingModule =
      await Test.createTestingModule({
        providers: [
          RuleService,
          {
            provide: PrismaService,
            useValue: prismaMock,
          },
        ],
      }).compile();

    service =
      module.get<RuleService>(
        RuleService,
      );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
