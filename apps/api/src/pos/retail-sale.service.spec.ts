import { Prisma } from '@prisma/client';

import { RetailSaleService } from './retail-sale.service';

describe('RetailSaleService', () => {
  const access = {
    userId: 'user-1',
    organizationId: 'org-1',
    role: 'STAFF' as const,
    accessScope: 'ASSIGNED_EVENTS' as const,
  };
  const product = {
    id: 'product-1',
    eventId: 'event-1',
    name: 'Hoodie',
    description: null,
    productType: 'MERCHANDISE',
    price: new Prisma.Decimal(50),
    gstRate: 10,
    sku: null,
    barcode: null,
    imageUrl: null,
    status: 'ACTIVE',
    inventoryTracked: true,
    inventoryQuantity: 10,
    capacityControlled: false,
    capacity: null,
    requiresSession: false,
    availableOnline: true,
    availablePos: true,
    minQuantity: 0,
    maxQuantity: null,
    sortOrder: 0,
    salesStart: null,
    salesEnd: null,
    productGroupId: null,
    productGroup: null,
    variants: [],
    sessionProducts: [],
  };
  const sale = {
    id: 'sale-1',
    saleNumber: 'RS-1',
    status: 'COMPLETED',
    paymentStatus: 'PAID',
    total: new Prisma.Decimal(50),
    currency: 'AUD',
    reservedUntil: new Date(Date.now() + 60_000),
    completedAt: new Date(),
    expiredAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    eventId: 'event-1',
    sessionId: null,
    createdByUserId: 'user-1',
    completedByUserId: 'user-1',
    event: { id: 'event-1', name: 'Winter Festival' },
    createdByUser: { id: 'user-1', name: 'Jamie' },
    completedByUser: { id: 'user-1', name: 'Jamie' },
    items: [],
    payments: [],
  };
  const prisma = {
    event: { findFirst: jest.fn() },
    product: { findMany: jest.fn() },
    payment: { findUnique: jest.fn() },
    retailSale: {
      updateMany: jest.fn(),
      findFirst: jest.fn(),
    },
    $transaction: jest.fn(),
  };
  const accessControl = {
    eventWhere: jest.fn((_access, where = {}) => ({
      ...where,
      organizationId: 'org-1',
    })),
    assertEventAccess: jest.fn(),
  };
  const inventory = {
    productCommitted: jest.fn(),
    variantCommitted: jest.fn(),
    sessionProductCommitted: jest.fn(),
  };
  let service: RetailSaleService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new RetailSaleService(
      prisma as never,
      accessControl as never,
      inventory as never,
    );
  });

  it('returns only the server-filtered merchandise catalogue with remaining stock', async () => {
    prisma.event.findFirst.mockResolvedValue({
      id: 'event-1',
      name: 'Winter Festival',
      timezone: 'Australia/Melbourne',
      sessions: [],
    });
    prisma.product.findMany.mockResolvedValue([product]);
    inventory.productCommitted.mockResolvedValue(3);

    const result = await service.findCatalogue(access, 'event-1');

    expect(prisma.product.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          eventId: 'event-1',
          availablePos: true,
          OR: expect.arrayContaining([
            { requiresSession: false, capacityControlled: false },
          ]),
        }),
      }),
    );
    expect(result.products[0].remainingInventory).toBe(7);
    expect(result.products[0].price).toBe(50);
  });

  it('includes a Session Product and reports capacity remaining for that Session', async () => {
    prisma.event.findFirst.mockResolvedValue({
      id: 'event-1',
      name: 'Winter Festival',
      timezone: 'Australia/Melbourne',
      sessions: [
        {
          id: 'session-1',
          name: '10:00 session',
          startDate: new Date(),
          endDate: new Date(),
        },
      ],
    });
    prisma.product.findMany.mockResolvedValue([
      {
        ...product,
        id: 'kanga-1',
        name: 'Kanga',
        inventoryTracked: false,
        inventoryQuantity: null,
        requiresSession: true,
        capacityControlled: true,
        capacity: 20,
        sessionProducts: [{ capacityOverride: 15 }],
      },
    ]);
    inventory.sessionProductCommitted.mockResolvedValue(4);

    const result = await service.findCatalogue(
      access,
      'event-1',
      'session-1',
    );

    expect(result.products[0].requiresSessionSelection).toBe(true);
    expect(result.products[0].remainingSessionCapacity).toBe(11);
    expect(inventory.sessionProductCommitted).toHaveBeenCalledWith(
      prisma,
      'session-1',
      'kanga-1',
    );
  });

  it('rejects a Session-controlled Product when no Session is supplied', async () => {
    const transaction = {
      product: {
        findMany: jest.fn().mockResolvedValue([
          {
            ...product,
            id: 'kanga-1',
            name: 'Kanga',
            inventoryTracked: false,
            inventoryQuantity: null,
            requiresSession: true,
            capacityControlled: true,
            capacity: 20,
            sessionProducts: [],
          },
        ]),
      },
    };
    prisma.$transaction.mockImplementation(
      (operation: (client: typeof transaction) => unknown) =>
        operation(transaction),
    );

    await expect(
      service.createReservation(access, 'event-1', {
        items: [{ productId: 'kanga-1', quantity: 1 }],
      }),
    ).rejects.toThrow('Kanga requires an active selected Session');
  });

  it('stores the selected Session on a valid operational Product reservation', async () => {
    const kanga = {
      ...product,
      id: 'kanga-1',
      name: 'Kanga',
      inventoryTracked: false,
      inventoryQuantity: null,
      requiresSession: true,
      capacityControlled: true,
      capacity: 20,
      sessionProducts: [{ capacityOverride: 15 }],
    };
    const reservedSale = {
      ...sale,
      status: 'RESERVED',
      paymentStatus: 'UNPAID',
      sessionId: 'session-1',
      session: {
        id: 'session-1',
        name: '10:00 session',
        startDate: new Date(),
        endDate: new Date(),
      },
      items: [],
    };
    const transaction = {
      product: {
        findMany: jest.fn().mockResolvedValue([kanga]),
      },
      session: {
        findFirst: jest.fn().mockResolvedValue({ id: 'session-1' }),
      },
      retailSale: {
        create: jest.fn().mockResolvedValue({ id: 'sale-1' }),
        findFirst: jest.fn().mockResolvedValue(reservedSale),
      },
    };
    prisma.$transaction.mockImplementation(
      (operation: (client: typeof transaction) => unknown) =>
        operation(transaction),
    );
    inventory.sessionProductCommitted.mockResolvedValue(4);

    const result = await service.createReservation(access, 'event-1', {
      sessionId: 'session-1',
      items: [{ productId: 'kanga-1', quantity: 1 }],
    });

    expect(transaction.retailSale.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          eventId: 'event-1',
          sessionId: 'session-1',
        }),
      }),
    );
    expect(result.session.id).toBe('session-1');
    expect(inventory.sessionProductCommitted).toHaveBeenCalledWith(
      transaction,
      'session-1',
      'kanga-1',
      undefined,
    );
  });

  it('returns the existing result for an exact idempotent payment retry', async () => {
    prisma.payment.findUnique.mockResolvedValue({
      bookingId: null,
      retailSaleId: 'sale-1',
      method: 'CASH',
      amount: new Prisma.Decimal(50),
      standaloneReference: null,
    });
    prisma.retailSale.updateMany.mockResolvedValue({ count: 0 });
    prisma.retailSale.findFirst.mockResolvedValue(sale);

    const result = await service.completePayment(access, 'event-1', 'sale-1', {
      method: 'CASH',
      amount: 50,
      idempotencyKey: 'retail-payment-1',
    });

    expect(result.saleNumber).toBe('RS-1');
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });
});
