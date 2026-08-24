import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { PrismaService } from '../prisma/prisma.service';
import { ProductGroupService } from './product-group.service';

describe('ProductGroupService', () => {
  let service: ProductGroupService;
  const prisma = {
    event: { findFirst: jest.fn() },
    productGroup: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      aggregate: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    product: {
      findMany: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductGroupService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();
    service = module.get(ProductGroupService);
    prisma.event.findFirst.mockResolvedValue({ id: 'event-1' });
    prisma.productGroup.findMany.mockResolvedValue([]);
    prisma.$transaction.mockImplementation(async (operations: unknown) =>
      Array.isArray(operations) ? Promise.all(operations) : undefined,
    );
  });

  it('rejects an Event outside the authenticated Organisation', async () => {
    prisma.event.findFirst.mockResolvedValue(null);

    await expect(service.findAll('org-1', 'event-other')).rejects.toThrow(
      NotFoundException,
    );
    expect(prisma.productGroup.findMany).not.toHaveBeenCalled();
  });

  it('creates a trimmed Event-owned group after the current final order', async () => {
    prisma.productGroup.findFirst.mockResolvedValue(null);
    prisma.productGroup.aggregate.mockResolvedValue({ _max: { sortOrder: 3 } });
    prisma.productGroup.create.mockResolvedValue({ id: 'group-1' });

    await service.create('org-1', {
      eventId: 'event-1',
      name: '  Merchandise  ',
      description: '  Event clothing  ',
    });

    expect(prisma.productGroup.create).toHaveBeenCalledWith({
      data: {
        eventId: 'event-1',
        name: 'Merchandise',
        description: 'Event clothing',
        sortOrder: 4,
      },
    });
  });

  it('requires the complete current group set for transactional ordering', async () => {
    prisma.productGroup.findMany.mockResolvedValue([
      { id: 'group-1' },
      { id: 'group-2' },
    ]);

    await expect(
      service.reorderGroups('org-1', {
        eventId: 'event-1',
        groupIds: ['group-1'],
      }),
    ).rejects.toThrow(BadRequestException);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('reassigns and orders every non-admission Product in one transaction', async () => {
    prisma.productGroup.findMany
      .mockResolvedValueOnce([{ id: 'group-1' }])
      .mockResolvedValueOnce([]);
    prisma.product.findMany.mockResolvedValue([
      { id: 'product-1' },
      { id: 'product-2' },
    ]);
    prisma.product.update.mockImplementation(({ where }) =>
      Promise.resolve({ id: where.id }),
    );

    await service.reorderProducts('org-1', {
      eventId: 'event-1',
      groups: [
        { groupId: 'group-1', productIds: ['product-2'] },
        { groupId: null, productIds: ['product-1'] },
      ],
    });

    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(prisma.product.update).toHaveBeenNthCalledWith(1, {
      where: { id: 'product-2' },
      data: { productGroupId: 'group-1', sortOrder: 0 },
    });
    expect(prisma.product.update).toHaveBeenNthCalledWith(2, {
      where: { id: 'product-1' },
      data: { productGroupId: null, sortOrder: 0 },
    });
  });

  it('rejects duplicated Product IDs instead of partially reordering', async () => {
    prisma.productGroup.findMany.mockResolvedValue([{ id: 'group-1' }]);
    prisma.product.findMany.mockResolvedValue([
      { id: 'product-1' },
      { id: 'product-2' },
    ]);

    await expect(
      service.reorderProducts('org-1', {
        eventId: 'event-1',
        groups: [
          { groupId: 'group-1', productIds: ['product-1', 'product-1'] },
        ],
      }),
    ).rejects.toThrow(BadRequestException);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });
});
