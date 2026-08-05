import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { CreateBookingDto } from '../booking/dto/create-booking.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class BookingValidationService {
  constructor(private readonly prisma: PrismaService) {}

  async validateBooking(createBookingDto: CreateBookingDto) {
    await this.validateCustomer(createBookingDto.customerId);

    await this.validateEvent(createBookingDto.eventId);

    await this.validateSession(
      createBookingDto.sessionId,
      createBookingDto.eventId,
    );
const consolidatedProducts = this.consolidateProducts(
  createBookingDto.products ?? [],
);

await this.validateProducts(
  createBookingDto.eventId,
  createBookingDto.sessionId,
  consolidatedProducts,
);

    return true;
  }

  private async validateCustomer(customerId: string) {
    const customer = await this.prisma.customer.findUnique({
      where: {
        id: customerId,
      },
    });

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    return customer;
  }

  private async validateEvent(eventId: string) {
    const event = await this.prisma.event.findUnique({
      where: {
        id: eventId,
      },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    if (event.status !== 'ACTIVE') {
      throw new BadRequestException(
        'Bookings are not available for this event',
      );
    }

    return event;
  }

  private async validateSession(
    sessionId: string,
    eventId: string,
  ) {
    const session = await this.prisma.session.findUnique({
      where: {
        id: sessionId,
      },
    });

    if (!session) {
      throw new NotFoundException('Session not found');
    }

    if (session.eventId !== eventId) {
      throw new BadRequestException(
        'The selected session does not belong to the selected event',
      );
    }

    if (session.status !== 'ACTIVE') {
      throw new BadRequestException(
        'Bookings are not available for this session',
      );
    }

    const now = new Date();

    if (session.salesStart && now < session.salesStart) {
      throw new BadRequestException(
        'Sales have not opened for this session',
      );
    }

    if (session.salesEnd && now > session.salesEnd) {
      throw new BadRequestException(
        'Sales have closed for this session',
      );
    }

    return session;
  }

  private consolidateProducts(
  products: NonNullable<CreateBookingDto['products']>,
) {
  const quantitiesByProductId = new Map<string, number>();

  for (const product of products) {
    const currentQuantity =
      quantitiesByProductId.get(product.productId) ?? 0;

    quantitiesByProductId.set(
      product.productId,
      currentQuantity + product.quantity,
    );
  }

  return Array.from(
    quantitiesByProductId.entries(),
  ).map(([productId, quantity]) => ({
    productId,
    quantity,
  }));
}

  private async validateProducts(
    eventId: string,
    sessionId: string,
    products: CreateBookingDto['products'],
  ) {
    return Promise.all(
      (products ?? []).map(async (bookingProduct) => {
        const product = await this.validateProduct(
          eventId,
          bookingProduct.productId,
        );

        const sessionProduct =
          await this.validateSessionProduct(
            sessionId,
            bookingProduct.productId,
          );

        this.validateQuantity(
          bookingProduct.quantity,
          product,
        );

        this.validateOnlineAvailability(product);

        this.validateProductSalesWindow(product);

        this.validateInventory(
  bookingProduct.quantity,
  product,
);

        return {
          product,
          sessionProduct,
          quantity: bookingProduct.quantity,
        };
      }),
    );
  }

  private async validateProduct(
    eventId: string,
    productId: string,
  ) {
    const product = await this.prisma.product.findUnique({
      where: {
        id: productId,
      },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    if (product.eventId !== eventId) {
      throw new BadRequestException(
        'The selected product does not belong to the selected event',
      );
    }

    if (product.status !== 'ACTIVE') {
      throw new BadRequestException(
        'The selected product is not available',
      );
    }

    return product;
  }

  private async validateSessionProduct(
    sessionId: string,
    productId: string,
  ) {
    const sessionProduct =
      await this.prisma.sessionProduct.findUnique({
        where: {
          sessionId_productId: {
            sessionId,
            productId,
          },
        },
      });

    if (!sessionProduct) {
      throw new BadRequestException(
        'The selected product is not available for the selected session',
      );
    }

    if (!sessionProduct.active) {
      throw new BadRequestException(
        'The selected product is not active for this session',
      );
    }

    return sessionProduct;
  }

  private validateQuantity(
    quantity: number,
    product: {
      minQuantity: number | null;
      maxQuantity: number | null;
    },
  ) {
    if (
      product.minQuantity !== null &&
      quantity < product.minQuantity
    ) {
      throw new BadRequestException(
        `Minimum quantity for this product is ${product.minQuantity}`,
      );
    }

    if (
      product.maxQuantity !== null &&
      quantity > product.maxQuantity
    ) {
      throw new BadRequestException(
        `Maximum quantity for this product is ${product.maxQuantity}`,
      );
    }
  }
  private validateOnlineAvailability(
  product: {
    availableOnline: boolean;
  },
) {
  if (!product.availableOnline) {
    throw new BadRequestException(
      'The selected product is not available for online purchase',
    );
  }
}
private validateProductSalesWindow(
  product: {
    salesStart: Date | null;
    salesEnd: Date | null;
  },
) {
  const now = new Date();

  if (product.salesStart && now < product.salesStart) {
    throw new BadRequestException(
      'Sales have not opened for this product',
    );
  }

  if (product.salesEnd && now > product.salesEnd) {
    throw new BadRequestException(
      'Sales have closed for this product',
    );
  }
}
private validateInventory(
  quantity: number,
  product: {
    inventoryTracked: boolean;
    inventoryQuantity: number | null;
  },
) {
  if (!product.inventoryTracked) {
    return;
  }

  if (product.inventoryQuantity === null) {
    throw new BadRequestException(
      'Inventory quantity has not been configured for this product',
    );
  }

  if (quantity > product.inventoryQuantity) {
    throw new BadRequestException(
      'The selected product does not have enough inventory available',
    );
  }
}
}