import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';

@Injectable()
export class CategoryService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(organizationId: string) {
    return this.prisma.category.findMany({
      where: {
        event: {
          organizationId,
        },
      },
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

  async findOne(organizationId: string, id: string) {
    const category = await this.prisma.category.findFirst({
      where: {
        id,
        event: {
          organizationId,
        },
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

  async create(organizationId: string, data: CreateCategoryDto) {
    const event = await this.prisma.event.findFirst({
      where: {
        id: data.eventId,
        organizationId,
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

  async remove(organizationId: string, id: string) {
    const category = await this.prisma.category.findFirst({
      where: {
        id,
        event: {
          organizationId,
        },
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
