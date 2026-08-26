import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

type InventoryClient = Pick<
  Prisma.TransactionClient,
  'bookingProduct' | 'retailSaleItem'
>;

@Injectable()
export class InventoryCommitmentService {
  async productCommitted(
    transaction: InventoryClient,
    productId: string,
    excludeRetailSaleId?: string,
  ) {
    const now = new Date();
    const [bookings, retailSales] = await Promise.all([
      transaction.bookingProduct.aggregate({
        where: {
          productId,
          booking: { status: { in: ['RESERVED', 'CONFIRMED'] } },
        },
        _sum: { quantity: true },
      }),
      transaction.retailSaleItem.aggregate({
        where: {
          productId,
          ...(excludeRetailSaleId
            ? { retailSaleId: { not: excludeRetailSaleId } }
            : {}),
          retailSale: {
            OR: [
              { status: 'COMPLETED' },
              { status: 'RESERVED', reservedUntil: { gte: now } },
            ],
          },
        },
        _sum: { quantity: true },
      }),
    ]);

    return (bookings._sum.quantity ?? 0) + (retailSales._sum.quantity ?? 0);
  }

  async variantCommitted(
    transaction: InventoryClient,
    productVariantId: string,
    excludeRetailSaleId?: string,
  ) {
    const now = new Date();
    const [bookings, retailSales] = await Promise.all([
      transaction.bookingProduct.aggregate({
        where: {
          productVariantId,
          booking: { status: { in: ['RESERVED', 'CONFIRMED'] } },
        },
        _sum: { quantity: true },
      }),
      transaction.retailSaleItem.aggregate({
        where: {
          productVariantId,
          ...(excludeRetailSaleId
            ? { retailSaleId: { not: excludeRetailSaleId } }
            : {}),
          retailSale: {
            OR: [
              { status: 'COMPLETED' },
              { status: 'RESERVED', reservedUntil: { gte: now } },
            ],
          },
        },
        _sum: { quantity: true },
      }),
    ]);

    return (bookings._sum.quantity ?? 0) + (retailSales._sum.quantity ?? 0);
  }
}
