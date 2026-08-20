import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';

import { BookingValidationService } from './booking-validation.service';
import { PrismaService } from '../prisma/prisma.service';

describe('BookingValidationService', () => {
  let service: BookingValidationService;

  const prismaMock = {
    customer: {
      findUnique: jest.fn(),
    },
    event: {
      findUnique: jest.fn(),
    },
    session: {
      findUnique: jest.fn(),
    },
    product: {
      findUnique: jest.fn(),
    },
    productVariant: {
      findUnique: jest.fn(),
    },
    sessionProduct: {
      findUnique: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule =
      await Test.createTestingModule({
        providers: [
          BookingValidationService,
          {
            provide: PrismaService,
            useValue: prismaMock,
          },
        ],
      }).compile();

    service = module.get<BookingValidationService>(
      BookingValidationService,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

it('should throw when customer does not exist', async () => {
  prismaMock.customer.findUnique.mockResolvedValue(null);

  await expect(
    (service as any).validateCustomer('customer-id'),
  ).rejects.toThrow(NotFoundException);
});

it('should return customer when it exists', async () => {
  const customer = {
    id: 'customer-id',
  };

  prismaMock.customer.findUnique.mockResolvedValue(customer);

  await expect(
    (service as any).validateCustomer('customer-id'),
  ).resolves.toEqual(customer);
});
it('should throw when event does not exist', async () => {
  prismaMock.event.findUnique.mockResolvedValue(null);

  await expect(
    (service as any).validateEvent('event-id'),
  ).rejects.toThrow(NotFoundException);
});

it('should throw when event is inactive', async () => {
  prismaMock.event.findUnique.mockResolvedValue({
    id: 'event-id',
    status: 'DRAFT',
  });

  await expect(
    (service as any).validateEvent('event-id'),
  ).rejects.toThrow(BadRequestException);
});

it('should return active event', async () => {
  const event = {
    id: 'event-id',
    status: 'ACTIVE',
  };

  prismaMock.event.findUnique.mockResolvedValue(event);

  await expect(
    (service as any).validateEvent('event-id'),
  ).resolves.toEqual(event);
});
it('should throw when session does not exist', async () => {
  prismaMock.session.findUnique.mockResolvedValue(null);

  await expect(
    (service as any).validateSession('session-id', 'event-id'),
  ).rejects.toThrow(NotFoundException);
});

it('should throw when session belongs to another event', async () => {
  prismaMock.session.findUnique.mockResolvedValue({
    id: 'session-id',
    eventId: 'another-event',
    status: 'ACTIVE',
  });

  await expect(
    (service as any).validateSession('session-id', 'event-id'),
  ).rejects.toThrow(BadRequestException);
});

it('should throw when session is inactive', async () => {
  prismaMock.session.findUnique.mockResolvedValue({
    id: 'session-id',
    eventId: 'event-id',
    status: 'DRAFT',
  });

  await expect(
    (service as any).validateSession('session-id', 'event-id'),
  ).rejects.toThrow(BadRequestException);
});

it('should return active session', async () => {
  const session = {
    id: 'session-id',
    eventId: 'event-id',
    status: 'ACTIVE',
    salesStart: null,
    salesEnd: null,
  };

  prismaMock.session.findUnique.mockResolvedValue(session);

  await expect(
    (service as any).validateSession('session-id', 'event-id'),
  ).resolves.toEqual(session);
});
it('should throw when product does not exist', async () => {
  prismaMock.product.findUnique.mockResolvedValue(null);

  await expect(
    (service as any).validateProduct('event-id', 'product-id'),
  ).rejects.toThrow(NotFoundException);
});

it('should throw when product belongs to another event', async () => {
  prismaMock.product.findUnique.mockResolvedValue({
    id: 'product-id',
    eventId: 'another-event',
    status: 'ACTIVE',
  });

  await expect(
    (service as any).validateProduct('event-id', 'product-id'),
  ).rejects.toThrow(BadRequestException);
});

it('should throw when product is inactive', async () => {
  prismaMock.product.findUnique.mockResolvedValue({
    id: 'product-id',
    eventId: 'event-id',
    status: 'DRAFT',
  });

  await expect(
    (service as any).validateProduct('event-id', 'product-id'),
  ).rejects.toThrow(BadRequestException);
});

it('should return active product', async () => {
  const product = {
    id: 'product-id',
    eventId: 'event-id',
    status: 'ACTIVE',
  };

  prismaMock.product.findUnique.mockResolvedValue(product);

  await expect(
    (service as any).validateProduct('event-id', 'product-id'),
  ).resolves.toEqual(product);
});

it('should throw when product is not assigned to session', async () => {
  prismaMock.sessionProduct.findUnique.mockResolvedValue(null);

  await expect(
    (service as any).validateSessionProduct(
      'session-id',
      'product-id',
    ),
  ).rejects.toThrow(BadRequestException);
});

it('should throw when session product is inactive', async () => {
  prismaMock.sessionProduct.findUnique.mockResolvedValue({
    id: 'session-product-id',
    active: false,
  });

  await expect(
    (service as any).validateSessionProduct(
      'session-id',
      'product-id',
    ),
  ).rejects.toThrow(BadRequestException);
});

it('should return active session product', async () => {
  const sessionProduct = {
    id: 'session-product-id',
    active: true,
  };

  prismaMock.sessionProduct.findUnique.mockResolvedValue(
    sessionProduct,
  );

  await expect(
    (service as any).validateSessionProduct(
      'session-id',
      'product-id',
    ),
  ).resolves.toEqual(sessionProduct);
});

it('should throw when quantity is below product minimum', () => {
  expect(() =>
    (service as any).validateQuantity(1, {
      minQuantity: 2,
      maxQuantity: 20,
    }),
  ).toThrow(BadRequestException);
});

it('should throw when quantity exceeds product maximum', () => {
  expect(() =>
    (service as any).validateQuantity(21, {
      minQuantity: 0,
      maxQuantity: 20,
    }),
  ).toThrow(BadRequestException);
});

it('should allow quantity within product limits', () => {
  expect(() =>
    (service as any).validateQuantity(5, {
      minQuantity: 0,
      maxQuantity: 20,
    }),
  ).not.toThrow();
});

it('should throw when product is unavailable online', () => {
  expect(() =>
    (service as any).validateOnlineAvailability({
      availableOnline: false,
    }),
  ).toThrow(BadRequestException);
});

it('should allow product available online', () => {
  expect(() =>
    (service as any).validateOnlineAvailability({
      availableOnline: true,
    }),
  ).not.toThrow();
});

it('should throw when product sales have not opened', () => {
  expect(() =>
    (service as any).validateProductSalesWindow({
      salesStart: new Date(Date.now() + 60_000),
      salesEnd: null,
    }),
  ).toThrow(BadRequestException);
});

it('should throw when product sales have closed', () => {
  expect(() =>
    (service as any).validateProductSalesWindow({
      salesStart: null,
      salesEnd: new Date(Date.now() - 60_000),
    }),
  ).toThrow(BadRequestException);
});

it('should allow product inside sales window', () => {
  expect(() =>
    (service as any).validateProductSalesWindow({
      salesStart: new Date(Date.now() - 60_000),
      salesEnd: new Date(Date.now() + 60_000),
    }),
  ).not.toThrow();
});

it('should skip inventory validation when inventory is not tracked', () => {
  expect(() =>
    (service as any).validateInventory(100, {
      inventoryTracked: false,
      inventoryQuantity: null,
    }),
  ).not.toThrow();
});

it('should throw when tracked inventory is not configured', () => {
  expect(() =>
    (service as any).validateInventory(1, {
      inventoryTracked: true,
      inventoryQuantity: null,
    }),
  ).toThrow(BadRequestException);
});

it('should throw when requested quantity exceeds inventory', () => {
  expect(() =>
    (service as any).validateInventory(6, {
      inventoryTracked: true,
      inventoryQuantity: 5,
    }),
  ).toThrow(BadRequestException);
});

it('should allow quantity within inventory', () => {
  expect(() =>
    (service as any).validateInventory(5, {
      inventoryTracked: true,
      inventoryQuantity: 5,
    }),
  ).not.toThrow();
});

it('should reject a Product Variant from another Product', async () => {
  prismaMock.productVariant.findUnique.mockResolvedValue({
    id: 'variant-small',
    productId: 'product-other',
    status: 'ACTIVE',
    availableOnline: true,
    inventoryTracked: true,
    inventoryQuantity: 50,
  });

  await expect(
    (service as any).validateProductVariants([
      {
        productId: 'product-hoodie',
        productVariantId: 'variant-small',
        quantity: 1,
      },
    ]),
  ).rejects.toThrow(
    'The selected Product Variant does not belong to the selected Product',
  );
});

it('should reject a Product Variant selection above its configured inventory', async () => {
  prismaMock.productVariant.findUnique.mockResolvedValue({
    id: 'variant-small',
    productId: 'product-hoodie',
    status: 'ACTIVE',
    availableOnline: true,
    inventoryTracked: true,
    inventoryQuantity: 1,
  });

  await expect(
    (service as any).validateProductVariants([
      {
        productId: 'product-hoodie',
        productVariantId: 'variant-small',
        quantity: 2,
      },
    ]),
  ).rejects.toThrow(
    'The selected Product Variant does not have enough inventory available',
  );
});
});
