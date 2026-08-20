import { Test, TestingModule } from '@nestjs/testing';

import { PublicWaiverController } from './public-waiver.controller';
import { PublicWaiverService } from './public-waiver.service';

describe('PublicWaiverController', () => {
  let controller: PublicWaiverController;

  const serviceMock = {
    verify: jest.fn(),
    findPublishedWaiver: jest.fn(),
    submit: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [PublicWaiverController],
      providers: [
        {
          provide: PublicWaiverService,
          useValue: serviceMock,
        },
      ],
    }).compile();

    controller = module.get<PublicWaiverController>(PublicWaiverController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('verifies a high-entropy completion credential', async () => {
    serviceMock.verify.mockResolvedValue({ verified: true });

    await controller.verify('a'.repeat(64));

    expect(serviceMock.verify).toHaveBeenCalledWith('a'.repeat(64));
  });

  it('retrieves a published Waiver by stable public slug', async () => {
    serviceMock.findPublishedWaiver.mockResolvedValue({
      waiver: { publicSlug: 'public-slug' },
    });

    await controller.findPublishedWaiver('public-slug');

    expect(serviceMock.findPublishedWaiver).toHaveBeenCalledWith('public-slug');
  });

  it('submits acceptance without Booking, Ticket, account, or email', async () => {
    const data = {
      signatoryFullName: 'Jamie Stoller',
      accepted: true as const,
      signatureData: 'signature',
    };

    await controller.submit('public-slug', data);

    expect(serviceMock.submit).toHaveBeenCalledWith('public-slug', data);
  });
});
