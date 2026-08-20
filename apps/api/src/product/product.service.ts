import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    organizationId: string,
    createProductDto: CreateProductDto,
  ) {
    const {
      eventId,
      categoryId,
      inventoryTracked,
      inventoryQuantity,
      capacityControlled,
      capacity,
      minQuantity,
      maxQuantity,
      ...productData
    } = createProductDto;

    const event = await this.prisma.event.findFirst({
      where: {
        id: eventId,
        organizationId,
      },
    });

    if (!event) {
      throw new NotFoundException(
        'Event was not found in your organization.',
      );
    }

    if (categoryId) {
      const category = await this.prisma.category.findFirst({
        where: {
          id: categoryId,
          eventId,
          event: {
            organizationId,
          },
        },
      });

      if (!category) {
        throw new NotFoundException(
          'Category was not found for this event.',
        );
      }
    }

    const slug = createProductDto.slug.trim();
    const sku = createProductDto.sku?.trim();

    const existingSlug = await this.prisma.product.findFirst({
      where: {
        eventId,
        slug,
      },
    });

    if (existingSlug) {
      throw new ConflictException(
        `A product with slug "${slug}" already exists for this event.`,
      );
    }

    if (sku) {
      const existingSku = await this.prisma.product.findFirst({
        where: {
          eventId,
          sku,
        },
      });

      if (existingSku) {
        throw new ConflictException(
          `A product with SKU "${sku}" already exists for this event.`,
        );
      }
    }

    const tracksInventory = inventoryTracked ?? false;

    if (
      tracksInventory &&
      inventoryQuantity === undefined
    ) {
      throw new BadRequestException(
        'inventoryQuantity is required when inventoryTracked is true.',
      );
    }

    if (
      !tracksInventory &&
      inventoryQuantity !== undefined
    ) {
      throw new BadRequestException(
        'inventoryQuantity can only be supplied when inventoryTracked is true.',
      );
    }

    const controlsCapacity = capacityControlled ?? false;

    if (
      controlsCapacity &&
      capacity === undefined
    ) {
      throw new BadRequestException(
        'capacity is required when capacityControlled is true.',
      );
    }

    if (
      !controlsCapacity &&
      capacity !== undefined
    ) {
      throw new BadRequestException(
        'capacity can only be supplied when capacityControlled is true.',
      );
    }

    const minimumQuantity = minQuantity ?? 0;

    if (
      maxQuantity !== undefined &&
      maxQuantity < minimumQuantity
    ) {
      throw new BadRequestException(
        'maxQuantity cannot be less than minQuantity.',
      );
    }

    return this.prisma.product.create({
      data: {
        ...productData,
        name: productData.name.trim(),
        slug,
        sku,
        eventId: event.id,
        categoryId,
        inventoryTracked: tracksInventory,
        inventoryQuantity: tracksInventory
          ? inventoryQuantity
          : null,
        capacityControlled: controlsCapacity,
        capacity: controlsCapacity ? capacity : null,
        minQuantity: minimumQuantity,
        maxQuantity,
      },
      include: {
        category: true,
        variants: true,
        sessionProducts: true,
      },
    });
  }

  findAll(organizationId: string, eventId?: string) {
    return this.prisma.product.findMany({
      where: {
        ...(eventId ? { eventId } : {}),
        event: {
          organizationId,
        },
      },
      include: {
        event: true,
        category: true,
        variants: {
          orderBy: [
            {
              sortOrder: 'asc',
            },
            {
              name: 'asc',
            },
          ],
        },
        sessionProducts: {
          include: {
            session: true,
          },
        },
      },
      orderBy: [
        {
          sortOrder: 'asc',
        },
        {
          name: 'asc',
        },
      ],
    });
  }

  async findOne(
    id: string,
    organizationId: string,
  ) {
    const product = await this.prisma.product.findFirst({
      where: {
        id,
        event: {
          organizationId,
        },
      },
      include: {
        event: true,
        category: true,
        variants: {
          orderBy: [
            {
              sortOrder: 'asc',
            },
            {
              name: 'asc',
            },
          ],
        },
        sessionProducts: {
          include: {
            session: true,
          },
        },
        bookingProducts: true,
      },
    });

    if (!product) {
      throw new NotFoundException('Product not found.');
    }

    return product;
  }

  async update(
    id: string,
    organizationId: string,
    updateProductDto: UpdateProductDto,
  ) {
    const existingProduct =
      await this.prisma.product.findFirst({
        where: {
          id,
          event: {
            organizationId,
          },
        },
        include: {
          event: true,
        },
      });

    if (!existingProduct) {
      throw new NotFoundException('Product not found.');
    }

    if (updateProductDto.categoryId !== undefined) {
      const category = await this.prisma.category.findFirst({
        where: {
          id: updateProductDto.categoryId,
          eventId: existingProduct.eventId,
          event: {
            organizationId,
          },
        },
      });

      if (!category) {
        throw new NotFoundException(
          'Category was not found for this event.',
        );
      }
    }

    const slug =
      updateProductDto.slug?.trim() ??
      existingProduct.slug;

    const duplicateSlug = await this.prisma.product.findFirst({
      where: {
        eventId: existingProduct.eventId,
        slug,
        id: {
          not: existingProduct.id,
        },
      },
    });

    if (duplicateSlug) {
      throw new ConflictException(
        `A product with slug "${slug}" already exists for this event.`,
      );
    }

    const sku =
      updateProductDto.sku !== undefined
        ? updateProductDto.sku.trim()
        : existingProduct.sku;

    if (sku) {
      const duplicateSku = await this.prisma.product.findFirst({
        where: {
          eventId: existingProduct.eventId,
          sku,
          id: {
            not: existingProduct.id,
          },
        },
      });

      if (duplicateSku) {
        throw new ConflictException(
          `A product with SKU "${sku}" already exists for this event.`,
        );
      }
    }

    const inventoryTracked =
      updateProductDto.inventoryTracked ??
      existingProduct.inventoryTracked;

    const inventoryQuantity =
      updateProductDto.inventoryQuantity !== undefined
        ? updateProductDto.inventoryQuantity
        : existingProduct.inventoryQuantity;

    if (
      inventoryTracked &&
      inventoryQuantity === null
    ) {
      throw new BadRequestException(
        'inventoryQuantity is required when inventoryTracked is true.',
      );
    }

    if (
      !inventoryTracked &&
      updateProductDto.inventoryQuantity !== undefined
    ) {
      throw new BadRequestException(
        'inventoryQuantity can only be supplied when inventoryTracked is true.',
      );
    }

    const capacityControlled =
      updateProductDto.capacityControlled ??
      existingProduct.capacityControlled;

    const capacity =
      updateProductDto.capacity !== undefined
        ? updateProductDto.capacity
        : existingProduct.capacity;

    if (
      capacityControlled &&
      capacity === null
    ) {
      throw new BadRequestException(
        'capacity is required when capacityControlled is true.',
      );
    }

    if (
      !capacityControlled &&
      updateProductDto.capacity !== undefined
    ) {
      throw new BadRequestException(
        'capacity can only be supplied when capacityControlled is true.',
      );
    }

    const minQuantity =
      updateProductDto.minQuantity ??
      existingProduct.minQuantity;

    const maxQuantity =
      updateProductDto.maxQuantity !== undefined
        ? updateProductDto.maxQuantity
        : existingProduct.maxQuantity;

    if (
      maxQuantity !== null &&
      maxQuantity < minQuantity
    ) {
      throw new BadRequestException(
        'maxQuantity cannot be less than minQuantity.',
      );
    }

    return this.prisma.product.update({
      where: {
        id: existingProduct.id,
      },
      data: {
        ...updateProductDto,
        name:
          updateProductDto.name?.trim() ??
          existingProduct.name,
        slug,
        sku,
        categoryId:
          updateProductDto.categoryId ??
          existingProduct.categoryId,
        inventoryTracked,
        inventoryQuantity: inventoryTracked
          ? inventoryQuantity
          : null,
        capacityControlled,
        capacity: capacityControlled
          ? capacity
          : null,
        minQuantity,
        maxQuantity,
      },
      include: {
        event: true,
        category: true,
        variants: true,
        sessionProducts: true,
      },
    });
  }

  async remove(
    id: string,
    organizationId: string,
  ) {
    const product = await this.findOne(
      id,
      organizationId,
    );

    if (product.variants.length > 0) {
      throw new BadRequestException(
        'This product cannot be deleted while product variants exist.',
      );
    }

    if (product.sessionProducts.length > 0) {
      throw new BadRequestException(
        'This product cannot be deleted while it is assigned to sessions.',
      );
    }

    if (product.bookingProducts.length > 0) {
      throw new BadRequestException(
        'This product cannot be deleted because it has been used in bookings.',
      );
    }

    return this.prisma.product.delete({
      where: {
        id: product.id,
      },
    });
  }
}
