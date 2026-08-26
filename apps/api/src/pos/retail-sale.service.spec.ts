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
    });
    prisma.product.findMany.mockResolvedValue([product]);
    inventory.productCommitted.mockResolvedValue(3);

    const result = await service.findCatalogue(access, 'event-1');

    expect(prisma.product.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          eventId: 'event-1',
          availablePos: true,
          requiresSession: false,
          capacityControlled: false,
        }),
      }),
    );
    expect(result.products[0].remainingInventory).toBe(7);
    expect(result.products[0].price).toBe(50);
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
