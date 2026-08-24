import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { CreateProductGroupDto } from './dto/create-product-group.dto';
import { ReorderProductGroupsDto } from './dto/reorder-product-groups.dto';
import { ReorderProductsDto } from './dto/reorder-products.dto';
import { UpdateProductGroupDto } from './dto/update-product-group.dto';

@Injectable()
export class ProductGroupService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(organizationId: string, eventId: string) {
    await this.requireEvent(organizationId, eventId);

    return this.prisma.productGroup.findMany({
      where: { eventId },
      include: {
        products: {
          where: { productType: { not: 'ADMISSION' } },
          orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }, { id: 'asc' }],
        },
      },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }, { id: 'asc' }],
    });
  }

  async create(organizationId: string, data: CreateProductGroupDto) {
    await this.requireEvent(organizationId, data.eventId);
    const name = data.name.trim();
    const duplicate = await this.prisma.productGroup.findFirst({
      where: {
        eventId: data.eventId,
        name: { equals: name, mode: 'insensitive' },
      },
    });
    if (duplicate) {
      throw new ConflictException(
        'A Product group with this name already exists.',
      );
    }

    const maximum = await this.prisma.productGroup.aggregate({
      where: { eventId: data.eventId },
      _max: { sortOrder: true },
    });

    return this.prisma.productGroup.create({
      data: {
        eventId: data.eventId,
        name,
        description: data.description?.trim() || null,
        sortOrder: data.sortOrder ?? (maximum._max.sortOrder ?? -1) + 1,
      },
    });
  }

  async update(
    organizationId: string,
    id: string,
    data: UpdateProductGroupDto,
  ) {
    const group = await this.requireGroup(organizationId, id);
    const name = data.name?.trim();
    if (name) {
      const duplicate = await this.prisma.productGroup.findFirst({
        where: {
          eventId: group.eventId,
          id: { not: id },
          name: { equals: name, mode: 'insensitive' },
        },
      });
      if (duplicate) {
        throw new ConflictException(
          'A Product group with this name already exists.',
        );
      }
    }

    return this.prisma.productGroup.update({
      where: { id },
      data: {
        ...(name ? { name } : {}),
        ...(data.description !== undefined
          ? { description: data.description.trim() || null }
          : {}),
      },
    });
  }

  async reorderGroups(organizationId: string, data: ReorderProductGroupsDto) {
    await this.requireEvent(organizationId, data.eventId);
    const groups = await this.prisma.productGroup.findMany({
      where: { eventId: data.eventId },
      select: { id: true },
    });
    this.requireExactIds(
      groups.map(({ id }) => id),
      data.groupIds,
      'Product groups',
    );

    await this.prisma.$transaction(
      data.groupIds.map((id, sortOrder) =>
        this.prisma.productGroup.update({ where: { id }, data: { sortOrder } }),
      ),
    );
    return this.findAll(organizationId, data.eventId);
  }

  async reorderProducts(organizationId: string, data: ReorderProductsDto) {
    await this.requireEvent(organizationId, data.eventId);
    const groupIds = data.groups
      .map(({ groupId }) => groupId)
      .filter((id): id is string => Boolean(id));
    if (new Set(groupIds).size !== groupIds.length) {
      throw new BadRequestException('Each Product group may appear only once.');
    }
    const eventGroups = await this.prisma.productGroup.findMany({
      where: { eventId: data.eventId },
      select: { id: true },
    });
    for (const groupId of groupIds) {
      if (!eventGroups.some(({ id }) => id === groupId)) {
        throw new NotFoundException(
          'Product group was not found for this Event.',
        );
      }
    }

    const products = await this.prisma.product.findMany({
      where: { eventId: data.eventId, productType: { not: 'ADMISSION' } },
      select: { id: true },
    });
    const orderedProductIds = data.groups.flatMap(
      ({ productIds }) => productIds,
    );
    this.requireExactIds(
      products.map(({ id }) => id),
      orderedProductIds,
      'Products',
    );

    const updates = data.groups.flatMap(({ groupId, productIds }) =>
      productIds.map((id, sortOrder) =>
        this.prisma.product.update({
          where: { id },
          data: { productGroupId: groupId ?? null, sortOrder },
        }),
      ),
    );
    await this.prisma.$transaction(updates);
    return this.findAll(organizationId, data.eventId);
  }

  async remove(organizationId: string, id: string) {
    const group = await this.requireGroup(organizationId, id);
    return this.prisma.$transaction(async (transaction) => {
      await transaction.product.updateMany({
        where: { productGroupId: id },
        data: { productGroupId: null },
      });
      await transaction.productGroup.delete({ where: { id } });
      return { id: group.id };
    });
  }

  private async requireEvent(organizationId: string, eventId: string) {
    const event = await this.prisma.event.findFirst({
      where: { id: eventId, organizationId },
      select: { id: true },
    });
    if (!event) throw new NotFoundException('Event not found.');
    return event;
  }

  private async requireGroup(organizationId: string, id: string) {
    const group = await this.prisma.productGroup.findFirst({
      where: { id, event: { organizationId } },
    });
    if (!group) throw new NotFoundException('Product group not found.');
    return group;
  }

  private requireExactIds(actual: string[], supplied: string[], label: string) {
    if (
      actual.length !== supplied.length ||
      new Set(supplied).size !== supplied.length ||
      actual.some((id) => !supplied.includes(id))
    ) {
      throw new BadRequestException(
        `${label} must contain every current item exactly once.`,
      );
    }
  }
}
