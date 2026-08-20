import { Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { AddOrganizationUserDto } from './dto/add-organization-user.dto';

@Injectable()
export class OrganizationService {
  constructor(private prisma: PrismaService) {}

  findCurrent(organizationId: string) {
    return this.prisma.organization.findUnique({
      where: {
        id: organizationId,
      },
      select: {
        id: true,
        name: true,
        slug: true,
        status: true,
        legalName: true,
        tradingName: true,
        abn: true,
        addressLine1: true,
        addressLine2: true,
        suburb: true,
        state: true,
        postcode: true,
        country: true,
        contactEmail: true,
        contactPhone: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async addUser(
    authenticatedOrganizationId: string,
    requestedOrganizationId: string,
    data: AddOrganizationUserDto,
  ) {
    if (requestedOrganizationId !== authenticatedOrganizationId) {
      throw new NotFoundException('Organization not found');
    }

    const user = await this.prisma.user.findUnique({
      where: {
        id: data.userId,
      },
      select: {
        id: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.prisma.userOrganization.create({
      data: {
        organizationId: authenticatedOrganizationId,
        userId: data.userId,
        role: data.role,
      },
    });
  }
}
