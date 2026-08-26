import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { randomBytes } from 'crypto';

import {
  AccessControlService,
  AuthenticatedAccessContext,
} from '../access-control/access-control.service';
import { InventoryCommitmentService } from '../inventory/inventory-commitment.service';
import { PrismaService } from '../prisma/prisma.service';

import { CompletePosPaymentDto } from './dto/complete-pos-payment.dto';
import {
  CreateRetailSaleDto,
  CreateRetailSaleItemDto,
} from './dto/create-retail-sale.dto';
import { SearchRetailSalesQueryDto } from './dto/search-retail-sales-query.dto';

@Injectable()
export class RetailSaleService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly accessControl: AccessControlService,
    private readonly inventoryCommitments: InventoryCommitmentService,
  ) {}

  async findCatalogue(access: AuthenticatedAccessContext, eventId: string) {
    const event = await this.prisma.event.findFirst({
      where: this.accessControl.eventWhere(access, {
        id: eventId,
        status: 'ACTIVE',
      }),
      select: { id: true, name: true, timezone: true },
    });

    if (!event) throw new NotFoundException('Event not found');

    const now = new Date();
    const products = await this.prisma.product.findMany({
      where: {
        eventId,
        status: 'ACTIVE',
        availablePos: true,
        productType: { not: 'ADMISSION' },
        requiresSession: false,
        capacityControlled: false,
        OR: [{ salesStart: null }, { salesStart: { lte: now } }],
        AND: [{ OR: [{ salesEnd: null }, { salesEnd: { gte: now } }] }],
      },
      include: {
        productGroup: true,
        variants: {
          where: { status: 'ACTIVE', availablePos: true },
          orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
        },
      },
      orderBy: [
        { productGroup: { sortOrder: 'asc' } },
        { sortOrder: 'asc' },
        { name: 'asc' },
      ],
    });

    return {
      event,
      products: await Promise.all(
        products.map(async (product) => {
          const productCommitted = product.inventoryTracked
            ? await this.inventoryCommitments.productCommitted(
                this.prisma,
                product.id,
              )
            : null;
          return {
            ...product,
            price: product.price.toNumber(),
            remainingInventory:
              product.inventoryTracked && product.inventoryQuantity !== null
                ? Math.max(
                    product.inventoryQuantity - (productCommitted ?? 0),
                    0,
                  )
                : null,
            variants: await Promise.all(
              product.variants.map(async (variant) => {
                const committed = variant.inventoryTracked
                  ? await this.inventoryCommitments.variantCommitted(
                      this.prisma,
                      variant.id,
                    )
                  : null;
                return {
                  ...variant,
                  priceOverride: variant.priceOverride?.toNumber() ?? null,
                  remainingInventory:
                    variant.inventoryTracked &&
                    variant.inventoryQuantity !== null
                      ? Math.max(
                          variant.inventoryQuantity - (committed ?? 0),
                          0,
                        )
                      : null,
                };
              }),
            ),
          };
        }),
      ),
    };
  }

  async createReservation(
    access: AuthenticatedAccessContext,
    eventId: string,
    data: CreateRetailSaleDto,
  ) {
    await this.accessControl.assertEventAccess(eventId, access);
    const selections = this.combineSelections(data.items);

    return this.withSerializableRetry(async (transaction) => {
      const items = await this.resolveItems(transaction, eventId, selections);
      await this.assertInventory(transaction, items);
      const total = items.reduce(
        (sum, item) => sum.plus(item.lineTotal),
        new Prisma.Decimal(0),
      );

      const sale = await transaction.retailSale.create({
        data: {
          saleNumber: `RS-${Date.now()}-${randomBytes(3).toString('hex').toUpperCase()}`,
          eventId,
          createdByUserId: access.userId,
          total,
          currency: 'AUD',
          reservedUntil: new Date(Date.now() + 15 * 60 * 1000),
          items: {
            create: items.map((item) => ({
              productId: item.productId,
              productVariantId: item.productVariantId,
              productNameSnapshot: item.productNameSnapshot,
              variantNameSnapshot: item.variantNameSnapshot,
              skuSnapshot: item.skuSnapshot,
              barcodeSnapshot: item.barcodeSnapshot,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              gstRate: item.gstRate,
              lineTotal: item.lineTotal,
            })),
          },
        },
        select: { id: true },
      });

      return this.findOneInClient(transaction, access, eventId, sale.id);
    });
  }

  async completePayment(
    access: AuthenticatedAccessContext,
    eventId: string,
    retailSaleId: string,
    data: CompletePosPaymentDto,
  ) {
    const amount = new Prisma.Decimal(data.amount);
    const standaloneReference = data.standaloneReference?.trim() || null;
    const existingPayment = await this.prisma.payment.findUnique({
      where: { idempotencyKey: data.idempotencyKey },
    });

    if (existingPayment) {
      if (
        existingPayment.retailSaleId !== retailSaleId ||
        existingPayment.bookingId !== null ||
        existingPayment.method !== data.method ||
        !existingPayment.amount.equals(amount) ||
        existingPayment.standaloneReference !== standaloneReference
      ) {
        throw new ConflictException(
          'This payment confirmation key has already been used',
        );
      }
      return this.findOne(access, eventId, retailSaleId);
    }

    await this.withSerializableRetry(async (transaction) => {
      const sale = await transaction.retailSale.findFirst({
        where: {
          id: retailSaleId,
          eventId,
          event: this.accessControl.eventWhere(access),
        },
        include: { items: true },
      });

      if (!sale) throw new NotFoundException('Merchandise Sale not found');
      if (sale.status !== 'RESERVED' || sale.paymentStatus !== 'UNPAID') {
        throw new BadRequestException(
          'Only an unpaid reserved merchandise Sale can be completed',
        );
      }
      const now = new Date();
      if (sale.reservedUntil < now) {
        throw new BadRequestException('This merchandise Sale has expired');
      }
      if (!sale.total.equals(amount)) {
        throw new BadRequestException(
          'The confirmed payment amount must equal the authoritative amount due',
        );
      }
      await this.assertInventory(transaction, sale.items, sale.id);

      const updated = await transaction.retailSale.updateMany({
        where: {
          id: sale.id,
          status: 'RESERVED',
          paymentStatus: 'UNPAID',
          reservedUntil: { gte: now },
        },
        data: {
          status: 'COMPLETED',
          paymentStatus: 'PAID',
          completedAt: now,
          completedByUserId: access.userId,
        },
      });
      if (updated.count !== 1) {
        throw new ConflictException(
          'The merchandise Sale changed before payment could be recorded',
        );
      }
      await transaction.payment.create({
        data: {
          retailSaleId: sale.id,
          provider: data.method,
          method: data.method,
          standaloneReference,
          idempotencyKey: data.idempotencyKey,
          amount,
          currency: sale.currency,
          status: 'SUCCEEDED',
          succeededAt: now,
          receivedAt: now,
          receivedByUserId: access.userId,
        },
      });
    });

    return this.findOne(access, eventId, retailSaleId);
  }

  async findOne(
    access: AuthenticatedAccessContext,
    eventId: string,
    retailSaleId: string,
  ) {
    await this.expireIfNeeded(access, eventId, retailSaleId);
    return this.findOneInClient(this.prisma, access, eventId, retailSaleId);
  }

  async search(
    access: AuthenticatedAccessContext,
    eventId: string,
    query: SearchRetailSalesQueryDto,
  ) {
    await this.accessControl.assertEventAccess(eventId, access);
    const now = new Date();
    await this.prisma.retailSale.updateMany({
      where: {
        eventId,
        event: this.accessControl.eventWhere(access),
        status: 'RESERVED',
        reservedUntil: { lt: now },
      },
      data: { status: 'EXPIRED', expiredAt: now },
    });
    const where: Prisma.RetailSaleWhereInput = {
      eventId,
      event: this.accessControl.eventWhere(access),
      ...(query.search
        ? {
            saleNumber: {
              contains: query.search.trim(),
              mode: Prisma.QueryMode.insensitive,
            },
          }
        : {}),
      ...(query.status ? { status: query.status } : {}),
      ...(query.method
        ? { payments: { some: { method: query.method, status: 'SUCCEEDED' } } }
        : {}),
      ...(query.from || query.to
        ? {
            createdAt: {
              ...(query.from ? { gte: new Date(query.from) } : {}),
              ...(query.to ? { lte: new Date(query.to) } : {}),
            },
          }
        : {}),
    };
    const skip = (query.page - 1) * query.pageSize;
    const [total, sales] = await Promise.all([
      this.prisma.retailSale.count({ where }),
      this.prisma.retailSale.findMany({
        where,
        skip,
        take: query.pageSize,
        orderBy: { createdAt: 'desc' },
        include: {
          completedByUser: { select: { id: true, name: true } },
          payments: {
            where: { status: 'SUCCEEDED' },
            select: { method: true },
            take: 1,
          },
          _count: { select: { items: true } },
        },
      }),
    ]);
    return {
      total,
      page: query.page,
      pageSize: query.pageSize,
      sales: sales.map((sale) => ({
        ...sale,
        total: sale.total.toNumber(),
      })),
    };
  }

  private combineSelections(items: CreateRetailSaleItemDto[]) {
    const combined = new Map<string, CreateRetailSaleItemDto>();
    for (const item of items) {
      const key = `${item.productId}:${item.productVariantId ?? ''}`;
      const current = combined.get(key);
      combined.set(key, {
        ...item,
        quantity: (current?.quantity ?? 0) + item.quantity,
      });
    }
    return Array.from(combined.values());
  }

  private async resolveItems(
    transaction: Prisma.TransactionClient,
    eventId: string,
    selections: CreateRetailSaleItemDto[],
  ) {
    const productIds = [...new Set(selections.map((item) => item.productId))];
    const products = await transaction.product.findMany({
      where: { id: { in: productIds }, eventId },
      include: { variants: true },
    });
    if (products.length !== productIds.length) {
      throw new BadRequestException(
        'One or more merchandise Products are invalid',
      );
    }
    const productMap = new Map(
      products.map((product) => [product.id, product]),
    );
    const now = new Date();
    return selections.map((selection) => {
      const product = productMap.get(selection.productId);
      if (
        !product ||
        product.status !== 'ACTIVE' ||
        !product.availablePos ||
        product.productType === 'ADMISSION' ||
        product.requiresSession ||
        product.capacityControlled
      ) {
        throw new BadRequestException(
          'One or more Products are not eligible for merchandise-only sale',
        );
      }
      if (
        (product.salesStart && product.salesStart > now) ||
        (product.salesEnd && product.salesEnd < now)
      ) {
        throw new BadRequestException(
          `${product.name} is outside its sales window`,
        );
      }
      if (
        selection.quantity < product.minQuantity ||
        (product.maxQuantity !== null &&
          selection.quantity > product.maxQuantity)
      ) {
        throw new BadRequestException(
          `${product.name} quantity is not allowed`,
        );
      }
      const variant = selection.productVariantId
        ? product.variants.find(({ id }) => id === selection.productVariantId)
        : null;
      if (product.variants.length > 0 && !variant) {
        throw new BadRequestException(`${product.name} requires a Variant`);
      }
      if (variant && (variant.status !== 'ACTIVE' || !variant.availablePos)) {
        throw new BadRequestException(
          `${variant.name} is not available at POS`,
        );
      }
      const unitPrice = variant?.priceOverride ?? product.price;
      return {
        productId: product.id,
        productVariantId: variant?.id ?? null,
        productNameSnapshot: product.name,
        variantNameSnapshot: variant?.name ?? null,
        skuSnapshot: variant?.sku ?? product.sku,
        barcodeSnapshot: variant?.barcode ?? product.barcode,
        quantity: selection.quantity,
        unitPrice,
        gstRate: product.gstRate,
        lineTotal: unitPrice.mul(selection.quantity),
        product,
        variant,
      };
    });
  }

  private async assertInventory(
    transaction: Prisma.TransactionClient,
    items: Array<{
      productId: string;
      productVariantId: string | null;
      quantity: number;
      product?: {
        inventoryTracked: boolean;
        inventoryQuantity: number | null;
        name: string;
      };
      variant?: {
        inventoryTracked: boolean;
        inventoryQuantity: number | null;
        name: string;
      } | null;
    }>,
    excludeRetailSaleId?: string,
  ) {
    for (const item of items) {
      const product =
        item.product ??
        (await transaction.product.findUniqueOrThrow({
          where: { id: item.productId },
        }));
      if (product.inventoryTracked) {
        if (product.inventoryQuantity === null) {
          throw new BadRequestException(
            `${product.name} inventory is not configured`,
          );
        }
        const committed = await this.inventoryCommitments.productCommitted(
          transaction,
          item.productId,
          excludeRetailSaleId,
        );
        if (item.quantity > product.inventoryQuantity - committed) {
          throw new BadRequestException(
            `${product.name} does not have enough inventory available`,
          );
        }
      }
      if (item.productVariantId) {
        const variant =
          item.variant ??
          (await transaction.productVariant.findUniqueOrThrow({
            where: { id: item.productVariantId },
          }));
        if (variant.inventoryTracked) {
          if (variant.inventoryQuantity === null) {
            throw new BadRequestException(
              `${variant.name} inventory is not configured`,
            );
          }
          const committed = await this.inventoryCommitments.variantCommitted(
            transaction,
            item.productVariantId,
            excludeRetailSaleId,
          );
          if (item.quantity > variant.inventoryQuantity - committed) {
            throw new BadRequestException(
              `${variant.name} does not have enough inventory available`,
            );
          }
        }
      }
    }
  }

  private async findOneInClient(
    client: Prisma.TransactionClient | PrismaService,
    access: AuthenticatedAccessContext,
    eventId: string,
    retailSaleId: string,
  ) {
    const sale = await client.retailSale.findFirst({
      where: {
        id: retailSaleId,
        eventId,
        event: this.accessControl.eventWhere(access),
      },
      include: {
        event: { select: { id: true, name: true } },
        createdByUser: { select: { id: true, name: true } },
        completedByUser: { select: { id: true, name: true } },
        items: { orderBy: { createdAt: 'asc' } },
        payments: {
          where: { status: 'SUCCEEDED' },
          select: {
            id: true,
            method: true,
            amount: true,
            currency: true,
            standaloneReference: true,
            receivedAt: true,
            receivedByUser: { select: { id: true, name: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });
    if (!sale) throw new NotFoundException('Merchandise Sale not found');
    return {
      ...sale,
      total: sale.total.toNumber(),
      items: sale.items.map((item) => ({
        ...item,
        unitPrice: item.unitPrice.toNumber(),
        lineTotal: item.lineTotal.toNumber(),
      })),
      payments: sale.payments.map((payment) => ({
        ...payment,
        amount: payment.amount.toNumber(),
      })),
    };
  }

  private async expireIfNeeded(
    access: AuthenticatedAccessContext,
    eventId: string,
    retailSaleId: string,
  ) {
    await this.prisma.retailSale.updateMany({
      where: {
        id: retailSaleId,
        eventId,
        event: this.accessControl.eventWhere(access),
        status: 'RESERVED',
        reservedUntil: { lt: new Date() },
      },
      data: { status: 'EXPIRED', expiredAt: new Date() },
    });
  }

  private async withSerializableRetry<T>(
    operation: (transaction: Prisma.TransactionClient) => Promise<T>,
  ) {
    for (let attempt = 1; attempt <= 3; attempt += 1) {
      try {
        return await this.prisma.$transaction(operation, {
          isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        });
      } catch (error) {
        if (
          !(
            typeof error === 'object' &&
            error !== null &&
            'code' in error &&
            error.code === 'P2034'
          ) ||
          attempt === 3
        ) {
          throw error;
        }
      }
    }
    throw new ConflictException('Unable to reserve merchandise inventory');
  }
}
