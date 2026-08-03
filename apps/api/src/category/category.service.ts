import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CategoryService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  findAll() {
    return this.prisma.category.findMany({
      include: {
        products: true,
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

  async findOne(id: string) {
    const category = await this.prisma.category.findUnique({
      where: {
        id,
      },
      include: {
        products: true,
      },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    return category;
  }

  async create(data: {
    name: string;
    slug: string;
    description?: string;
    eventId: string;
    sortOrder?: number;
  }) {
    const event = await this.prisma.event.findUnique({
      where: {
        id: data.eventId,
      },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    const existingCategory = await this.prisma.category.findFirst({
      where: {
        eventId: data.eventId,
        slug: data.slug,
      },
    });

    if (existingCategory) {
      throw new BadRequestException(
        'A category with this slug already exists for this event',
      );
    }

    return this.prisma.category.create({
      data: {
        name: data.name,
        slug: data.slug,
        description: data.description,
        eventId: data.eventId,
        sortOrder: data.sortOrder ?? 0,
      },
    });
  }

  async remove(id: string) {
    const category = await this.prisma.category.findUnique({
      where: {
        id,
      },
      include: {
        products: true,
      },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    if (category.products.length > 0) {
      throw new BadRequestException(
        'Cannot delete a category that contains products',
      );
    }

    return this.prisma.category.delete({
      where: {
        id,
      },
    });
  }
}