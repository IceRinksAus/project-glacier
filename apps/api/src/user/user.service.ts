import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';

import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        organizations: {
          select: {
            organizationId: true,
            role: true,
          },
        },
      },
    });
  }

  async create(createUserDto: CreateUserDto) {
    const email = createUserDto.email.trim().toLowerCase();

    const existingUser = await this.prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (existingUser) {
      throw new ConflictException(
        'A user with this email already exists',
      );
    }

    const organization = await this.prisma.organization.findUnique({
      where: {
        id: createUserDto.organizationId,
      },
    });

    if (!organization) {
      throw new NotFoundException('Organization not found');
    }

    const passwordHash = await bcrypt.hash(
      createUserDto.password,
      10,
    );

    return this.prisma.$transaction(async (prisma) => {
      const user = await prisma.user.create({
        data: {
          email,
          name: createUserDto.name.trim(),
          passwordHash,
          isActive: true,
        },
      });

      const membership = await prisma.userOrganization.create({
        data: {
          userId: user.id,
          organizationId: createUserDto.organizationId,
          role: createUserDto.role,
        },
      });

      return {
        id: user.id,
        email: user.email,
        name: user.name,
        isActive: user.isActive,
        organizationId: membership.organizationId,
        role: membership.role,
        createdAt: user.createdAt,
      };
    });
  }
}