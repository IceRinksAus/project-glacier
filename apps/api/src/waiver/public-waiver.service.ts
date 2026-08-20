import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { createHash, randomBytes } from 'crypto';

import { PrismaService } from '../prisma/prisma.service';
import { CreateWaiverSubmissionDto } from './dto/create-waiver-submission.dto';

@Injectable()
export class PublicWaiverService {
  constructor(private readonly prisma: PrismaService) {}

  async findPublishedWaiver(publicSlug: string) {
    const eventWaiver = await this.findPublishedRecord(publicSlug);

    if (!eventWaiver) {
      throw new NotFoundException('Published Event waiver was not found.');
    }

    const version = eventWaiver.versions[0];

    return {
      event: {
        name: eventWaiver.event.name,
        venueName: eventWaiver.event.venueName,
        startDate: eventWaiver.event.startDate,
        endDate: eventWaiver.event.endDate,
      },
      waiver: {
        publicSlug: eventWaiver.publicSlug,
        version: version.version,
        title: version.title,
        content: version.content,
        acceptanceStatement: version.acceptanceStatement,
        publishedAt: version.publishedAt,
      },
    };
  }

  async submit(publicSlug: string, data: CreateWaiverSubmissionDto) {
    const eventWaiver = await this.findPublishedRecord(publicSlug);

    if (!eventWaiver) {
      throw new NotFoundException('Published Event waiver was not found.');
    }

    const waiverVersion = eventWaiver.versions[0];
    const minors = data.minors ?? [];

    this.validateMinorDates(minors);

    const verificationToken = randomBytes(32).toString('hex');
    const verificationTokenHash = this.hash(verificationToken);
    const acceptanceStatementHash = this.hash(
      waiverVersion.acceptanceStatement,
    );

    const submission = await this.prisma.waiverSubmission.create({
      data: {
        eventWaiverId: eventWaiver.id,
        waiverVersionId: waiverVersion.id,
        signatoryFullName: data.signatoryFullName.trim(),
        signatureData: data.signatureData,
        waiverContentHash: waiverVersion.contentHash,
        acceptanceStatementHash,
        verificationTokenHash,
        minors: {
          create: minors.map((minor) => ({
            fullName: minor.fullName.trim(),
            dateOfBirth: new Date(`${minor.dateOfBirth}T00:00:00.000Z`),
          })),
        },
      },
      select: {
        id: true,
        acceptedAt: true,
      },
    });

    return {
      submissionId: submission.id,
      acceptedAt: submission.acceptedAt,
      verificationToken,
    };
  }

  async verify(verificationToken: string) {
    if (!/^[a-f0-9]{64}$/.test(verificationToken)) {
      throw new NotFoundException('Waiver verification was not found.');
    }

    const submission = await this.prisma.waiverSubmission.findUnique({
      where: {
        verificationTokenHash: this.hash(verificationToken),
      },
      select: {
        acceptedAt: true,
        eventWaiver: {
          select: {
            event: {
              select: {
                name: true,
              },
            },
          },
        },
        waiverVersion: {
          select: {
            version: true,
            title: true,
          },
        },
      },
    });

    if (!submission) {
      throw new NotFoundException('Waiver verification was not found.');
    }

    return {
      verified: true,
      eventName: submission.eventWaiver.event.name,
      waiverTitle: submission.waiverVersion.title,
      waiverVersion: submission.waiverVersion.version,
      acceptedAt: submission.acceptedAt,
    };
  }

  private findPublishedRecord(publicSlug: string) {
    return this.prisma.eventWaiver.findFirst({
      where: {
        publicSlug,
        event: {
          status: 'ACTIVE',
        },
        versions: {
          some: {
            status: 'PUBLISHED',
          },
        },
      },
      include: {
        event: {
          select: {
            name: true,
            venueName: true,
            startDate: true,
            endDate: true,
          },
        },
        versions: {
          where: {
            status: 'PUBLISHED',
          },
          orderBy: {
            version: 'desc',
          },
          take: 1,
        },
      },
    });
  }

  private validateMinorDates(minors: Array<{ dateOfBirth: string }>) {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    for (const minor of minors) {
      const dateOfBirth = new Date(`${minor.dateOfBirth}T00:00:00.000Z`);
      const isValidDate =
        !Number.isNaN(dateOfBirth.getTime()) &&
        dateOfBirth.toISOString().slice(0, 10) === minor.dateOfBirth;

      if (!isValidDate || dateOfBirth > today) {
        throw new BadRequestException(
          'Minor date of birth must be a valid date that is not in the future.',
        );
      }
    }
  }

  private hash(value: string) {
    return createHash('sha256').update(value).digest('hex');
  }
}
