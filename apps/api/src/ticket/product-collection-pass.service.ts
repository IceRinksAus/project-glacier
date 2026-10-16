import { Injectable, NotFoundException } from '@nestjs/common';
import { ProductCollectionPassStatus, Prisma } from '@prisma/client';
import { randomBytes, randomUUID } from 'crypto';
import * as QRCode from 'qrcode';

import { PrismaService } from '../prisma/prisma.service';
import { TicketCredentialService } from './ticket-credential.service';

@Injectable()
export class ProductCollectionPassService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly credentials: TicketCredentialService,
  ) {}

  async issueForBooking(bookingId: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      select: {
        id: true,
        status: true,
        paymentStatus: true,
        products: {
          select: {
            id: true,
            productId: true,
            quantity: true,
            product: { select: { name: true } },
            productVariant: { select: { name: true } },
            collectionPasses: { select: { id: true, unitNumber: true } },
          },
        },
      },
    });

    if (!booking) throw new NotFoundException('Booking not found');
    if (booking.status !== 'CONFIRMED' || booking.paymentStatus !== 'PAID') {
      return [];
    }

    const missing = booking.products.flatMap((bookingProduct) => {
      // A pre-unit pass is retained as historical grouped fulfilment evidence.
      // It already covers the full line and must never be duplicated.
      if (
        bookingProduct.collectionPasses.some(
          (pass) => pass.unitNumber === null,
        )
      ) {
        return [];
      }
      const existingUnits = new Set(
        bookingProduct.collectionPasses.map((pass) => pass.unitNumber),
      );
      return Array.from(
        { length: bookingProduct.quantity },
        (_, index) => index + 1,
      )
        .filter((unitNumber) => !existingUnits.has(unitNumber))
        .map((unitNumber) => ({ bookingProduct, unitNumber }));
    });
    if (missing.length) {
      await this.prisma.productCollectionPass.createMany({
        data: missing.map(({ bookingProduct, unitNumber }) => {
          const id = randomUUID();
          const credential = this.credentials.issueProductPass(id);
          return {
            id,
            passNumber: `PRD-${Date.now()}-${randomBytes(3)
              .toString('hex')
              .toUpperCase()}`,
            credentialSelector: credential.credentialSelector,
            credentialKeyId: credential.credentialKeyId,
            bookingId: booking.id,
            bookingProductId: bookingProduct.id,
            productId: bookingProduct.productId,
            productNameSnapshot: bookingProduct.product.name,
            variantNameSnapshot: bookingProduct.productVariant?.name ?? null,
            quantity: 1,
            unitNumber,
            unitCountSnapshot: bookingProduct.quantity,
          };
        }),
        skipDuplicates: true,
      });
    }

    return this.prisma.productCollectionPass.findMany({
      where: { bookingId },
      orderBy: { issuedAt: 'asc' },
    });
  }

  async getPublic(token: string) {
    const pass = await this.findByCredential(token);
    if (!pass) throw new NotFoundException('Product Collection Pass not found');
    return this.present(pass);
  }

  async generatePublicQrCode(token: string) {
    const pass = await this.findByCredential(token);
    if (!pass) throw new NotFoundException('Product Collection Pass not found');
    return QRCode.toBuffer(this.credentials.presentProductPass(pass), {
      type: 'png',
      width: 320,
      margin: 2,
      errorCorrectionLevel: 'M',
    });
  }

  async lookup(organizationId: string, eventId: string, reference: string) {
    const pass = await this.findOperational(organizationId, eventId, reference);
    if (!pass) throw new NotFoundException('Product Collection Pass not found');
    return this.present(pass);
  }

  async collect(
    organizationId: string,
    eventId: string,
    reference: string,
    userId: string,
  ) {
    return this.prisma.$transaction(async (transaction) => {
      const pass = await this.findOperational(
        organizationId,
        eventId,
        reference,
        transaction,
      );
      if (!pass) {
        throw new NotFoundException('Product Collection Pass not found');
      }
      if (pass.status !== ProductCollectionPassStatus.ACTIVE) {
        return this.present(pass);
      }
      const now = new Date();
      const updated = await transaction.productCollectionPass.updateMany({
        where: {
          id: pass.id,
          status: ProductCollectionPassStatus.ACTIVE,
        },
        data: {
          status: ProductCollectionPassStatus.COLLECTED,
          collectedAt: now,
          collectedByUserId: userId,
        },
      });
      const current = await transaction.productCollectionPass.findUnique({
        where: { id: pass.id },
        include: this.operationalInclude,
      });
      if (!current || updated.count > 1) {
        throw new NotFoundException('Product Collection Pass not found');
      }
      return this.present(current);
    });
  }

  private readonly operationalInclude = {
    booking: {
      include: {
        event: true,
        session: true,
      },
    },
  } satisfies Prisma.ProductCollectionPassInclude;

  private async findByCredential(token: string) {
    const where = this.credentials.lookupProductPassWhere(token);
    if (!where) return null;
    const pass = await this.prisma.productCollectionPass.findUnique({
      where,
      include: this.operationalInclude,
    });
    return pass && this.credentials.matchesProductPass(pass, token)
      ? pass
      : null;
  }

  private async findOperational(
    organizationId: string,
    eventId: string,
    reference: string,
    prisma: PrismaService | Prisma.TransactionClient = this.prisma,
  ) {
    const credentialWhere = this.credentials.lookupProductPassWhere(reference);
    const pass = await prisma.productCollectionPass.findFirst({
      where: {
        ...(credentialWhere ?? {
          passNumber: /^PRD-[A-Z0-9-]{3,80}$/i.test(reference)
            ? reference.toUpperCase()
            : '__invalid__',
        }),
        booking: {
          eventId,
          event: { organizationId },
        },
      },
      include: this.operationalInclude,
    });
    if (
      pass &&
      credentialWhere &&
      !this.credentials.matchesProductPass(pass, reference)
    ) {
      return null;
    }
    return pass;
  }

  private present(pass: {
    passNumber: string;
    status: ProductCollectionPassStatus;
    productNameSnapshot: string;
    variantNameSnapshot: string | null;
    quantity: number;
    unitNumber: number | null;
    unitCountSnapshot: number | null;
    issuedAt: Date;
    collectedAt: Date | null;
    booking: {
      bookingNumber: string;
      event: { name: string };
      session: { name: string; startDate: Date; endDate: Date } | null;
    };
  }) {
    return {
      kind: 'PRODUCT_COLLECTION_PASS' as const,
      passNumber: pass.passNumber,
      status: pass.status,
      productName: pass.productNameSnapshot,
      variantName: pass.variantNameSnapshot,
      quantity: pass.quantity,
      unitNumber: pass.unitNumber,
      unitCount: pass.unitCountSnapshot,
      issuedAt: pass.issuedAt,
      collectedAt: pass.collectedAt,
      bookingNumber: pass.booking.bookingNumber,
      event: pass.booking.event,
      session: pass.booking.session,
      grantsAdmission: false,
    };
  }
}
