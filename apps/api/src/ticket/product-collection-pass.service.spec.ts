import { NotFoundException } from '@nestjs/common';
import { ProductCollectionPassStatus } from '@prisma/client';

import { ProductCollectionPassService } from './product-collection-pass.service';

describe('ProductCollectionPassService', () => {
  const activePass = {
    id: 'pass-1',
    passNumber: 'PRD-1-ABCDEF',
    credentialSelector: 'b'.repeat(32),
    credentialKeyId: 'local-v1',
    status: ProductCollectionPassStatus.ACTIVE,
    productNameSnapshot: 'Kanga',
    variantNameSnapshot: null,
    quantity: 1,
    issuedAt: new Date('2027-07-01T00:00:00.000Z'),
    collectedAt: null,
    booking: {
      bookingNumber: 'PG-1',
      event: { name: 'Test Event' },
      session: {
        name: '10am',
        startDate: new Date('2027-07-01T00:00:00.000Z'),
        endDate: new Date('2027-07-01T02:00:00.000Z'),
      },
    },
  };
  const prisma = {
    booking: { findUnique: jest.fn() },
    productCollectionPass: {
      createMany: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      updateMany: jest.fn(),
    },
    $transaction: jest.fn(),
  };
  const credentials = {
    issueProductPass: jest.fn(() => ({
      id: 'pass-1',
      credentialSelector: 'b'.repeat(32),
      credentialKeyId: 'local-v1',
      token: `gp1_${'b'.repeat(32)}_${'c'.repeat(43)}`,
    })),
    lookupProductPassWhere: jest.fn(() => ({
      credentialSelector: 'b'.repeat(32),
    })),
    matchesProductPass: jest.fn(() => true),
    presentProductPass: jest.fn(
      () => `gp1_${'b'.repeat(32)}_${'c'.repeat(43)}`,
    ),
  };

  let service: ProductCollectionPassService;

  beforeEach(() => {
    jest.clearAllMocks();
    prisma.$transaction.mockImplementation(
      async (operation: (transaction: typeof prisma) => unknown) =>
        operation(prisma),
    );
    prisma.productCollectionPass.findMany.mockResolvedValue([activePass]);
    service = new ProductCollectionPassService(
      prisma as never,
      credentials as never,
    );
  });

  it('issues one signed non-admission pass for each paid Booking Product line', async () => {
    prisma.booking.findUnique.mockResolvedValue({
      id: 'booking-1',
      status: 'CONFIRMED',
      paymentStatus: 'PAID',
      products: [
        {
          id: 'booking-product-1',
          productId: 'product-kanga',
          quantity: 2,
          product: { name: 'Kanga' },
          productVariant: null,
          collectionPass: null,
        },
      ],
    });
    prisma.productCollectionPass.createMany.mockResolvedValue({ count: 1 });

    await service.issueForBooking('booking-1');

    expect(prisma.productCollectionPass.createMany).toHaveBeenCalledWith({
      data: [
        expect.objectContaining({
          id: expect.any(String),
          passNumber: expect.stringMatching(/^PRD-\d+-[A-F0-9]{6}$/),
          bookingId: 'booking-1',
          bookingProductId: 'booking-product-1',
          productId: 'product-kanga',
          productNameSnapshot: 'Kanga',
          quantity: 2,
          credentialSelector: 'b'.repeat(32),
          credentialKeyId: 'local-v1',
        }),
      ],
      skipDuplicates: true,
    });
  });

  it('does not duplicate an existing pass when payment fulfilment repeats', async () => {
    prisma.booking.findUnique.mockResolvedValue({
      id: 'booking-1',
      status: 'CONFIRMED',
      paymentStatus: 'PAID',
      products: [
        {
          id: 'booking-product-1',
          productId: 'product-kanga',
          quantity: 1,
          product: { name: 'Kanga' },
          productVariant: null,
          collectionPass: { id: 'pass-1' },
        },
      ],
    });

    await service.issueForBooking('booking-1');

    expect(prisma.productCollectionPass.createMany).not.toHaveBeenCalled();
  });

  it('atomically records collection and never grants admission', async () => {
    prisma.productCollectionPass.findFirst.mockResolvedValue(activePass);
    prisma.productCollectionPass.updateMany.mockResolvedValue({ count: 1 });
    prisma.productCollectionPass.findUnique.mockResolvedValue({
      ...activePass,
      status: ProductCollectionPassStatus.COLLECTED,
      collectedAt: new Date('2027-07-01T00:10:00.000Z'),
    });

    const result = await service.collect(
      'organization-1',
      'event-1',
      `gp1_${'b'.repeat(32)}_${'c'.repeat(43)}`,
      'user-1',
    );

    expect(prisma.productCollectionPass.updateMany).toHaveBeenCalledWith({
      where: { id: 'pass-1', status: ProductCollectionPassStatus.ACTIVE },
      data: {
        status: ProductCollectionPassStatus.COLLECTED,
        collectedAt: expect.any(Date),
        collectedByUserId: 'user-1',
      },
    });
    expect(result).toEqual(
      expect.objectContaining({
        status: ProductCollectionPassStatus.COLLECTED,
        grantsAdmission: false,
      }),
    );
  });

  it('rejects an invalid public credential without exposing the pass', async () => {
    prisma.productCollectionPass.findUnique.mockResolvedValue(activePass);
    credentials.matchesProductPass.mockReturnValueOnce(false);

    await expect(
      service.getPublic(`gp1_${'b'.repeat(32)}_${'d'.repeat(43)}`),
    ).rejects.toThrow(NotFoundException);
  });
});
