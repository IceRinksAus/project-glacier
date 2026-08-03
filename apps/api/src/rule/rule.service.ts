import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRuleDto } from './dto/create-rule.dto';
import { UpdateRuleDto } from './dto/update-rule.dto';

@Injectable()
export class RuleService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createRuleDto: CreateRuleDto) {
    const event = await this.prisma.event.findUnique({
      where: {
        id: createRuleDto.eventId,
      },
    });

    if (!event) {
      throw new BadRequestException('Event not found.');
    }

    const existingRule = await this.prisma.rule.findUnique({
      where: {
        eventId_slug: {
          eventId: createRuleDto.eventId,
          slug: createRuleDto.slug,
        },
      },
    });

    if (existingRule) {
      throw new ConflictException(
        'A rule with this slug already exists for the event.',
      );
    }

    return this.prisma.rule.create({
      data: {
        eventId: createRuleDto.eventId,
        name: createRuleDto.name,
        slug: createRuleDto.slug,
        description: createRuleDto.description,
        ruleType: createRuleDto.ruleType,
        scope: createRuleDto.scope ?? 'BOOKING',
        status: createRuleDto.status ?? 'ACTIVE',
        priority: createRuleDto.priority ?? 0,
        conditions: createRuleDto.conditions as Prisma.InputJsonValue,
        actions: createRuleDto.actions as Prisma.InputJsonValue,
        message: createRuleDto.message,
        stopProcessing: createRuleDto.stopProcessing ?? false,
      },
      include: {
        event: true,
      },
    });
  }

  findAll() {
    return this.prisma.rule.findMany({
      include: {
        event: true,
      },
      orderBy: [
        {
          priority: 'desc',
        },
        {
          name: 'asc',
        },
      ],
    });
  }

  async findOne(id: string) {
    const rule = await this.prisma.rule.findUnique({
      where: {
        id,
      },
      include: {
        event: true,
      },
    });

    if (!rule) {
      throw new NotFoundException('Rule not found.');
    }

    return rule;
  }

  async update(id: string, updateRuleDto: UpdateRuleDto) {
    const existingRule = await this.prisma.rule.findUnique({
      where: {
        id,
      },
    });

    if (!existingRule) {
      throw new NotFoundException('Rule not found.');
    }

    const eventId = updateRuleDto.eventId ?? existingRule.eventId;
    const slug = updateRuleDto.slug ?? existingRule.slug;

    if (updateRuleDto.eventId) {
      const event = await this.prisma.event.findUnique({
        where: {
          id: updateRuleDto.eventId,
        },
      });

      if (!event) {
        throw new BadRequestException('Event not found.');
      }
    }

    const duplicateRule = await this.prisma.rule.findFirst({
      where: {
        eventId,
        slug,
        id: {
          not: id,
        },
      },
    });

    if (duplicateRule) {
      throw new ConflictException(
        'A rule with this slug already exists for the event.',
      );
    }

    return this.prisma.rule.update({
      where: {
        id,
      },
      data: {
        ...(updateRuleDto.eventId !== undefined && {
          eventId: updateRuleDto.eventId,
        }),
        ...(updateRuleDto.name !== undefined && {
          name: updateRuleDto.name,
        }),
        ...(updateRuleDto.slug !== undefined && {
          slug: updateRuleDto.slug,
        }),
        ...(updateRuleDto.description !== undefined && {
          description: updateRuleDto.description,
        }),
        ...(updateRuleDto.ruleType !== undefined && {
          ruleType: updateRuleDto.ruleType,
        }),
        ...(updateRuleDto.scope !== undefined && {
          scope: updateRuleDto.scope,
        }),
        ...(updateRuleDto.status !== undefined && {
          status: updateRuleDto.status,
        }),
        ...(updateRuleDto.priority !== undefined && {
          priority: updateRuleDto.priority,
        }),
        ...(updateRuleDto.conditions !== undefined && {
          conditions: updateRuleDto.conditions as Prisma.InputJsonValue,
        }),
        ...(updateRuleDto.actions !== undefined && {
          actions: updateRuleDto.actions as Prisma.InputJsonValue,
        }),
        ...(updateRuleDto.message !== undefined && {
          message: updateRuleDto.message,
        }),
        ...(updateRuleDto.stopProcessing !== undefined && {
          stopProcessing: updateRuleDto.stopProcessing,
        }),
      },
      include: {
        event: true,
      },
    });
  }

  async remove(id: string) {
    const rule = await this.prisma.rule.findUnique({
      where: {
        id,
      },
    });

    if (!rule) {
      throw new NotFoundException('Rule not found.');
    }

    return this.prisma.rule.delete({
      where: {
        id,
      },
    });
  }
}