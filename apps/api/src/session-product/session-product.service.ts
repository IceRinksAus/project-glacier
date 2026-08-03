import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { CreateSessionProductDto } from './dto/create-session-product.dto';
import { UpdateSessionProductDto } from './dto/update-session-product.dto';

@Injectable()
export class SessionProductService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    organizationId: string,
    createSessionProductDto: CreateSessionProductDto,
  ) {
    const {
      sessionId,
      productId,
      capacityOverride,
      ...sessionProductData
    } = createSessionProductDto;

    const session = await this.prisma.session.findFirst({
      where: {
        id: sessionId,
        event: {
          organizationId,
        },
      },
      include: {
        event: true,
      },
    });

    if (!session) {
      throw new NotFoundException(
        'Session was not found in your organization.',
      );
    }

    const product = await this.prisma.product.findFirst({
      where: {
        id: productId,
        event: {
          organizationId,
        },
      },
      include: {
        event: true,
      },
    });

    if (!product) {
      throw new NotFoundException(
        'Product was not found in your organization.',
      );
    }

    if (session.eventId !== product.eventId) {
      throw new BadRequestException(
        'The product and session must belong to the same event.',
      );
    }

    const existingSessionProduct =
      await this.prisma.sessionProduct.findUnique({
        where: {
          sessionId_productId: {
            sessionId: session.id,
            productId: product.id,
          },
        },
      });

    if (existingSessionProduct) {
      throw new ConflictException(
        'This product is already assigned to the session.',
      );
    }

    if (
      capacityOverride !== undefined &&
      product.capacityControlled === false
    ) {
      throw new BadRequestException(
        'capacityOverride can only be set for a capacity-controlled product.',
      );
    }

    return this.prisma.sessionProduct.create({
      data: {
        ...sessionProductData,
        sessionId: session.id,
        productId: product.id,
        capacityOverride,
      },
      include: {
        session: {
          include: {
            event: true,
          },
        },
        product: {
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
          },
        },
      },
    });
  }

  findAll(organizationId: string) {
    return this.prisma.sessionProduct.findMany({
      where: {
        session: {
          event: {
            organizationId,
          },
        },
        product: {
          event: {
            organizationId,
          },
        },
      },
      include: {
        session: {
          include: {
            event: true,
          },
        },
        product: {
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
          },
        },
      },
      orderBy: [
        {
          sortOrder: 'asc',
        },
        {
          createdAt: 'asc',
        },
      ],
    });
  }

  async findOne(
    id: string,
    organizationId: string,
  ) {
    const sessionProduct =
      await this.prisma.sessionProduct.findFirst({
        where: {
          id,
          session: {
            event: {
              organizationId,
            },
          },
          product: {
            event: {
              organizationId,
            },
          },
        },
        include: {
          session: {
            include: {
              event: true,
            },
          },
          product: {
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
            },
          },
        },
      });

    if (!sessionProduct) {
      throw new NotFoundException(
        'Session product not found.',
      );
    }

    return sessionProduct;
  }

  async update(
    id: string,
    organizationId: string,
    updateSessionProductDto: UpdateSessionProductDto,
  ) {
    const existingSessionProduct =
      await this.prisma.sessionProduct.findFirst({
        where: {
          id,
          session: {
            event: {
              organizationId,
            },
          },
          product: {
            event: {
              organizationId,
            },
          },
        },
        include: {
          product: true,
        },
      });

    if (!existingSessionProduct) {
      throw new NotFoundException(
        'Session product not found.',
      );
    }

    if (
      updateSessionProductDto.capacityOverride !== undefined &&
      existingSessionProduct.product.capacityControlled === false
    ) {
      throw new BadRequestException(
        'capacityOverride can only be set for a capacity-controlled product.',
      );
    }

    return this.prisma.sessionProduct.update({
      where: {
        id: existingSessionProduct.id,
      },
      data: updateSessionProductDto,
      include: {
        session: {
          include: {
            event: true,
          },
        },
        product: {
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
          },
        },
      },
    });
  }

  async remove(
    id: string,
    organizationId: string,
  ) {
    const sessionProduct =
      await this.findOne(id, organizationId);

    return this.prisma.sessionProduct.delete({
      where: {
        id: sessionProduct.id,
      },
    });
  }
}