import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { CreateProductVariantDto } from './dto/create-product-variant.dto';
import { UpdateProductVariantDto } from './dto/update-product-variant.dto';

@Injectable()
export class ProductVariantService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    organizationId: string,
    createProductVariantDto: CreateProductVariantDto,
  ) {
    const {
      productId,
      inventoryTracked,
      inventoryQuantity,
      ...variantData
    } = createProductVariantDto;

    const product = await this.prisma.product.findFirst({
      where: {
        id: productId,
        event: {
          organizationId,
        },
      },
    });

    if (!product) {
      throw new NotFoundException(
        'Product was not found in your organization.',
      );
    }

    const slug = createProductVariantDto.slug.trim();
    const sku = createProductVariantDto.sku?.trim();

    const existingSlug =
      await this.prisma.productVariant.findFirst({
        where: {
          productId: product.id,
          slug,
        },
      });

    if (existingSlug) {
      throw new ConflictException(
        `A variant with slug "${slug}" already exists for this product.`,
      );
    }

    if (sku) {
      const existingSku =
        await this.prisma.productVariant.findFirst({
          where: {
            productId: product.id,
            sku,
          },
        });

      if (existingSku) {
        throw new ConflictException(
          `A variant with SKU "${sku}" already exists for this product.`,
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

    return this.prisma.productVariant.create({
      data: {
        ...variantData,
        name: variantData.name.trim(),
        slug,
        sku,
        productId: product.id,
        inventoryTracked: tracksInventory,
        inventoryQuantity: tracksInventory
          ? inventoryQuantity
          : null,
      },
      include: {
        product: {
          include: {
            event: true,
            category: true,
          },
        },
      },
    });
  }

  findAll(organizationId: string) {
    return this.prisma.productVariant.findMany({
      where: {
        product: {
          event: {
            organizationId,
          },
        },
      },
      include: {
        product: {
          include: {
            event: true,
            category: true,
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
    const variant =
      await this.prisma.productVariant.findFirst({
        where: {
          id,
          product: {
            event: {
              organizationId,
            },
          },
        },
        include: {
          product: {
            include: {
              event: true,
              category: true,
            },
          },
        },
      });

    if (!variant) {
      throw new NotFoundException(
        'Product variant not found.',
      );
    }

    return variant;
  }

  async update(
    id: string,
    organizationId: string,
    updateProductVariantDto: UpdateProductVariantDto,
  ) {
    const existingVariant =
      await this.prisma.productVariant.findFirst({
        where: {
          id,
          product: {
            event: {
              organizationId,
            },
          },
        },
        include: {
          product: {
            include: {
              event: true,
              category: true,
            },
          },
        },
      });

    if (!existingVariant) {
      throw new NotFoundException(
        'Product variant not found.',
      );
    }

    const slug =
      updateProductVariantDto.slug?.trim() ??
      existingVariant.slug;

    const duplicateSlug =
      await this.prisma.productVariant.findFirst({
        where: {
          productId: existingVariant.productId,
          slug,
          id: {
            not: existingVariant.id,
          },
        },
      });

    if (duplicateSlug) {
      throw new ConflictException(
        `A variant with slug "${slug}" already exists for this product.`,
      );
    }

    const sku =
      updateProductVariantDto.sku !== undefined
        ? updateProductVariantDto.sku.trim()
        : existingVariant.sku;

    if (sku) {
      const duplicateSku =
        await this.prisma.productVariant.findFirst({
          where: {
            productId: existingVariant.productId,
            sku,
            id: {
              not: existingVariant.id,
            },
          },
        });

      if (duplicateSku) {
        throw new ConflictException(
          `A variant with SKU "${sku}" already exists for this product.`,
        );
      }
    }

    const inventoryTracked =
      updateProductVariantDto.inventoryTracked ??
      existingVariant.inventoryTracked;

    const inventoryQuantity =
      updateProductVariantDto.inventoryQuantity !== undefined
        ? updateProductVariantDto.inventoryQuantity
        : existingVariant.inventoryQuantity;

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
      updateProductVariantDto.inventoryQuantity !== undefined
    ) {
      throw new BadRequestException(
        'inventoryQuantity can only be supplied when inventoryTracked is true.',
      );
    }

    return this.prisma.productVariant.update({
      where: {
        id: existingVariant.id,
      },
      data: {
        ...updateProductVariantDto,
        name:
          updateProductVariantDto.name?.trim() ??
          existingVariant.name,
        slug,
        sku,
        inventoryTracked,
        inventoryQuantity: inventoryTracked
          ? inventoryQuantity
          : null,
      },
      include: {
        product: {
          include: {
            event: true,
            category: true,
          },
        },
      },
    });
  }

  async remove(
    id: string,
    organizationId: string,
  ) {
    const variant = await this.findOne(
      id,
      organizationId,
    );

    return this.prisma.productVariant.delete({
      where: {
        id: variant.id,
      },
    });
  }
}