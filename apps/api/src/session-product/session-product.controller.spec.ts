import { Test, TestingModule } from '@nestjs/testing';
import { SessionProductController } from './session-product.controller';
import { SessionProductService } from './session-product.service';

describe('SessionProductController', () => {
  let controller: SessionProductController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SessionProductController],
      providers: [SessionProductService],
    }).compile();

    controller = module.get<SessionProductController>(SessionProductController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
