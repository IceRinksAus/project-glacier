import { Test, TestingModule } from '@nestjs/testing';

import { TicketTypeController } from './ticket-type.controller';
import { TicketTypeService } from './ticket-type.service';
import { FileAssetService } from '../file-asset/file-asset.service';

describe('TicketTypeController', () => {
  let controller: TicketTypeController;

  const serviceMock = {
    findAll: jest.fn(),
  };
  const fileAssetServiceMock = {
    createCatalogueAsset: jest.fn(),
    getCatalogueAsset: jest.fn(),
    removeCatalogueAsset: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TicketTypeController],
      providers: [
        {
          provide: TicketTypeService,
          useValue: serviceMock,
        },
        {
          provide: FileAssetService,
          useValue: fileAssetServiceMock,
        },
      ],
    }).compile();

    controller = module.get<TicketTypeController>(TicketTypeController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('passes trusted Organisation and optional Event filter to the service', () => {
    controller.findAll(
      { organizationId: 'organization-1', userId: 'user-1' },
      { eventId: 'event-1' },
    );

    expect(serviceMock.findAll).toHaveBeenCalledWith(
      'organization-1',
      'event-1',
    );
  });

  it('passes Ticket Type image uploads through trusted Organisation scope', () => {
    const file = {
      originalname: 'adult.png',
      mimetype: 'image/png',
      size: 1,
      buffer: Buffer.from('x'),
    };
    controller.uploadImage(
      'ticket-type-1',
      { organizationId: 'organization-1', userId: 'user-1' },
      { displayName: 'Adult tile' },
      file,
    );

    expect(fileAssetServiceMock.createCatalogueAsset).toHaveBeenCalledWith({
      target: 'TICKET_TYPE',
      targetId: 'ticket-type-1',
      organizationId: 'organization-1',
      userId: 'user-1',
      displayName: 'Adult tile',
      file,
    });
  });
});
