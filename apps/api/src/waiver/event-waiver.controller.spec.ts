import { Test, TestingModule } from '@nestjs/testing';

import { EventWaiverController } from './event-waiver.controller';
import { EventWaiverService } from './event-waiver.service';

describe('EventWaiverController', () => {
  let controller: EventWaiverController;

  const serviceMock = {
    findForEvent: jest.fn(),
    generatePublicQrCode: jest.fn(),
    listSubmissions: jest.fn(),
    findSubmission: jest.fn(),
    createDraft: jest.fn(),
    publishDraft: jest.fn(),
  };
  const user = {
    userId: 'user-1',
    email: 'owner@example.com',
    role: 'OWNER',
    organizationId: 'organization-1',
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [EventWaiverController],
      providers: [
        {
          provide: EventWaiverService,
          useValue: serviceMock,
        },
      ],
    }).compile();

    controller = module.get<EventWaiverController>(EventWaiverController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('retrieves Waiver data within the authenticated organization', async () => {
    serviceMock.findForEvent.mockResolvedValue(null);

    await expect(controller.findForEvent('event-1', user)).resolves.toBeNull();
    expect(serviceMock.findForEvent).toHaveBeenCalledWith(
      'organization-1',
      'event-1',
    );
  });

  it('lists submissions using trusted organization scope', async () => {
    serviceMock.listSubmissions.mockResolvedValue([]);

    await controller.listSubmissions('event-1', 'Jamie', user);

    expect(serviceMock.listSubmissions).toHaveBeenCalledWith(
      'organization-1',
      'event-1',
      'Jamie',
    );
  });

  it('generates a public QR code using trusted organization scope', async () => {
    serviceMock.generatePublicQrCode.mockResolvedValue({
      publicUrl: 'https://events.example/waivers/public-slug',
      qrCodeDataUrl: 'data:image/png;base64,qr-code',
    });

    await expect(
      controller.generatePublicQrCode('event-1', user),
    ).resolves.toEqual({
      publicUrl: 'https://events.example/waivers/public-slug',
      qrCodeDataUrl: 'data:image/png;base64,qr-code',
    });
    expect(serviceMock.generatePublicQrCode).toHaveBeenCalledWith(
      'organization-1',
      'event-1',
    );
  });

  it('retrieves submission evidence using trusted organization scope', async () => {
    serviceMock.findSubmission.mockResolvedValue({
      id: 'submission-1',
    });

    await controller.findSubmission('event-1', 'submission-1', user);

    expect(serviceMock.findSubmission).toHaveBeenCalledWith(
      'organization-1',
      'event-1',
      'submission-1',
    );
  });

  it('creates a draft within the authenticated organization', async () => {
    serviceMock.createDraft.mockResolvedValue({
      id: 'waiver-version-1',
    });

    await expect(controller.createDraft('event-1', user)).resolves.toEqual({
      id: 'waiver-version-1',
    });
    expect(serviceMock.createDraft).toHaveBeenCalledWith(
      'organization-1',
      'event-1',
    );
  });

  it('publishes with trusted organization and user identifiers', async () => {
    serviceMock.publishDraft.mockResolvedValue({
      id: 'waiver-version-1',
      status: 'PUBLISHED',
    });

    await expect(
      controller.publishDraft('event-1', 'waiver-version-1', user),
    ).resolves.toEqual({
      id: 'waiver-version-1',
      status: 'PUBLISHED',
    });
    expect(serviceMock.publishDraft).toHaveBeenCalledWith(
      'organization-1',
      'event-1',
      'waiver-version-1',
      'user-1',
    );
  });
});
