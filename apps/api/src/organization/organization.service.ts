import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class OrganizationService {
  constructor(
    private prisma: PrismaService,
  ) {}

  findAll() {
    return this.prisma.organization.findMany({
      include: {
        events: true,
        users: {
          include: {
            user: true,
          },
        },
      },
    });
  }

  create(data: { name: string; slug: string }) {
    return this.prisma.organization.create({
      data,
    });
  }

  addUser(
    organizationId: string,
    data: {
      userId: string;
      role: string;
    },
  ) {
    return this.prisma.userOrganization.create({
      data: {
        organizationId,
        userId: data.userId,
        role: data.role,
      },
    });
  }
}