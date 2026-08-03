import { Test, TestingModule } from '@nestjs/testing';
import { SessionProductService } from './session-product.service';

describe('SessionProductService', () => {
  let service: SessionProductService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SessionProductService],
    }).compile();

    service = module.get<SessionProductService>(SessionProductService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
