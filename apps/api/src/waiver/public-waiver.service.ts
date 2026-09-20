import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { createHash, randomBytes } from 'crypto';
import * as QRCode from 'qrcode';

import { getWebAppUrl } from '../config/application-security';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateWaiverSubmissionDto,
  WaiverBookingContextDto,
} from './dto/create-waiver-submission.dto';

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
    const booking = await this.validateBookingAssociation(
      eventWaiver.event.id,
      data,
    );

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
        signatoryParticipating: data.signatoryParticipating,
        mediaConsent: data.mediaConsent ?? null,
        marketingConsent: data.marketingConsent ?? null,
        bookingId: booking?.id,
        signatoryParticipantId: data.signatoryParticipantId,
        waiverContentHash: waiverVersion.contentHash,
        acceptanceStatementHash,
        verificationTokenHash,
        minors: {
          create: minors.map((minor) => ({
            fullName: minor.fullName.trim(),
            dateOfBirth: new Date(`${minor.dateOfBirth}T00:00:00.000Z`),
            bookingParticipantId: minor.bookingParticipantId,
          })),
        },
        associationAudits: booking
          ? {
              create: {
                organizationId: eventWaiver.event.organizationId,
                eventId: eventWaiver.event.id,
                bookingId: booking.id,
                action: 'BOOKING_LINKED_SUBMISSION',
                participantIds: this.participantIds(data),
              },
            }
          : undefined,
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

  async bookingContext(publicSlug: string, data: WaiverBookingContextDto) {
    const eventWaiver = await this.findPublishedRecord(publicSlug);
    if (!eventWaiver) {
      throw new NotFoundException('Published Event waiver was not found.');
    }
    const booking = await this.findAccessibleBooking(
      eventWaiver.event.id,
      data.bookingId,
      data.publicAccessToken,
    );
    if (!booking) {
      throw new NotFoundException('Booking waiver context was not found.');
    }
    return {
      bookingId: booking.id,
      bookingNumber: booking.bookingNumber,
      participants: booking.participants,
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
        signatoryParticipating: true,
        _count: { select: { minors: true } },
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

    const verificationUrl = `${getWebAppUrl()}/waivers/verify/${verificationToken}`;
    const qrCodeDataUrl = await QRCode.toDataURL(verificationUrl, {
      errorCorrectionLevel: 'H',
      width: 512,
      margin: 2,
    });

    return {
      verified: true,
      eventName: submission.eventWaiver.event.name,
      waiverTitle: submission.waiverVersion.title,
      waiverVersion: submission.waiverVersion.version,
      acceptedAt: submission.acceptedAt,
      coveredPersonCount:
        submission._count.minors + (submission.signatoryParticipating ? 1 : 0),
      verificationUrl,
      qrCodeDataUrl,
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
            id: true,
            organizationId: true,
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

  private async validateBookingAssociation(
    eventId: string,
    data: CreateWaiverSubmissionDto,
  ) {
    const hasBookingCredential = Boolean(
      data.bookingId || data.publicAccessToken,
    );
    const selectedParticipantIds = this.participantIds(data);

    if (!hasBookingCredential) {
      if (selectedParticipantIds.length > 0) {
        throw new BadRequestException(
          'Booking participant selections require Booking access.',
        );
      }
      return null;
    }
    if (!data.bookingId || !data.publicAccessToken) {
      throw new BadRequestException(
        'Booking ID and access credential must be supplied together.',
      );
    }
    if (!data.signatoryParticipating && data.signatoryParticipantId) {
      throw new BadRequestException(
        'A non-participating signatory cannot be matched to a participant.',
      );
    }
    if (
      new Set(selectedParticipantIds).size !== selectedParticipantIds.length
    ) {
      throw new BadRequestException(
        'Each Booking participant can only be covered once per submission.',
      );
    }
    if (selectedParticipantIds.length === 0) {
      throw new BadRequestException(
        'Select at least one Booking participant for linked waiver coverage.',
      );
    }

    const booking = await this.findAccessibleBooking(
      eventId,
      data.bookingId,
      data.publicAccessToken,
    );
    if (!booking) {
      throw new NotFoundException('Booking waiver context was not found.');
    }
    const allowedIds = new Set(booking.participants.map(({ id }) => id));
    if (selectedParticipantIds.some((id) => !allowedIds.has(id))) {
      throw new BadRequestException(
        'A selected participant does not belong to this Booking.',
      );
    }
    return booking;
  }

  private findAccessibleBooking(
    eventId: string,
    bookingId: string,
    publicAccessToken: string,
  ) {
    return this.prisma.booking.findFirst({
      where: {
        id: bookingId,
        eventId,
        status: 'CONFIRMED',
        paymentStatus: 'PAID',
        publicAccessTokenHash: this.hash(publicAccessToken),
      },
      select: {
        id: true,
        bookingNumber: true,
        participants: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            age: true,
            ticketType: { select: { name: true } },
          },
          orderBy: { createdAt: 'asc' as const },
        },
      },
    });
  }

  private participantIds(data: CreateWaiverSubmissionDto) {
    return [
      ...(data.signatoryParticipantId ? [data.signatoryParticipantId] : []),
      ...(data.minors ?? []).flatMap((minor) =>
        minor.bookingParticipantId ? [minor.bookingParticipantId] : [],
      ),
    ];
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
