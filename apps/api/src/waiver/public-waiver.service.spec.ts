import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { createHash } from 'crypto';

import { PrismaService } from '../prisma/prisma.service';
import { PublicWaiverService } from './public-waiver.service';

jest.mock('qrcode', () => ({
  toDataURL: jest.fn().mockResolvedValue('data:image/png;base64,proof-qr'),
}));

describe('PublicWaiverService', () => {
  let service: PublicWaiverService;

  const prismaMock = {
    eventWaiver: {
      findFirst: jest.fn(),
    },
    waiverSubmission: {
      create: jest.fn(),
      findUnique: jest.fn(),
    },
    booking: {
      findFirst: jest.fn(),
    },
  };
  const acceptedAt = new Date('2026-08-20T01:00:00.000Z');
  const publishedRecord = {
    id: 'event-waiver-1',
    publicSlug: 'public-slug',
    event: {
      id: 'event-1',
      organizationId: 'organization-1',
      name: 'Bathurst Ice Rink',
      venueName: 'Bathurst Showground',
      startDate: new Date('2026-06-20T00:00:00.000Z'),
      endDate: new Date('2026-07-19T00:00:00.000Z'),
    },
    versions: [
      {
        id: 'waiver-version-2',
        version: 2,
        title: 'Bathurst Ice Rink Waiver',
        content: 'Published legal content',
        acceptanceStatement: 'I agree to this waiver.',
        contentHash: 'authoritative-content-hash',
        status: 'PUBLISHED',
        publishedAt: new Date('2026-06-01T00:00:00.000Z'),
      },
    ],
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PublicWaiverService,
        {
          provide: PrismaService,
          useValue: prismaMock,
        },
      ],
    }).compile();

    service = module.get<PublicWaiverService>(PublicWaiverService);
    prismaMock.eventWaiver.findFirst.mockResolvedValue(publishedRecord);
    prismaMock.waiverSubmission.create.mockResolvedValue({
      id: 'submission-1',
      acceptedAt,
    });
  });

  it('returns only the current published public Waiver data', async () => {
    await expect(service.findPublishedWaiver('public-slug')).resolves.toEqual({
      event: {
        name: publishedRecord.event.name,
        venueName: publishedRecord.event.venueName,
        startDate: publishedRecord.event.startDate,
        endDate: publishedRecord.event.endDate,
      },
      waiver: {
        publicSlug: 'public-slug',
        version: 2,
        title: 'Bathurst Ice Rink Waiver',
        content: 'Published legal content',
        acceptanceStatement: 'I agree to this waiver.',
        publishedAt: new Date('2026-06-01T00:00:00.000Z'),
      },
    });
    expect(prismaMock.eventWaiver.findFirst).toHaveBeenCalledWith({
      where: {
        publicSlug: 'public-slug',
        event: {
          status: 'ACTIVE',
        },
        versions: {
          some: {
            status: 'PUBLISHED',
          },
        },
      },
      include: expect.objectContaining({
        versions: {
          where: {
            status: 'PUBLISHED',
          },
          orderBy: {
            version: 'desc',
          },
          take: 1,
        },
      }),
    });
  });

  it('does not expose an inactive or unpublished Event waiver', async () => {
    prismaMock.eventWaiver.findFirst.mockResolvedValue(null);

    await expect(service.findPublishedWaiver('hidden-slug')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('atomically persists server-authoritative adult acceptance evidence', async () => {
    const result = await service.submit('public-slug', {
      signatoryFullName: '  Jamie Stoller  ',
      accepted: true,
      signatureData: 'data:image/png;base64,signature',
      signatoryParticipating: true,
    });

    expect(prismaMock.waiverSubmission.create).toHaveBeenCalledWith({
      data: {
        eventWaiverId: 'event-waiver-1',
        waiverVersionId: 'waiver-version-2',
        signatoryFullName: 'Jamie Stoller',
        signatureData: 'data:image/png;base64,signature',
        signatoryParticipating: true,
        mediaConsent: null,
        marketingConsent: null,
        bookingId: undefined,
        signatoryParticipantId: undefined,
        waiverContentHash: 'authoritative-content-hash',
        acceptanceStatementHash: createHash('sha256')
          .update('I agree to this waiver.')
          .digest('hex'),
        verificationTokenHash: expect.stringMatching(/^[a-f0-9]{64}$/),
        minors: {
          create: [],
        },
        associationAudits: undefined,
      },
      select: {
        id: true,
        acceptedAt: true,
      },
    });
    expect(result).toEqual({
      submissionId: 'submission-1',
      acceptedAt,
      verificationToken: expect.stringMatching(/^[a-f0-9]{64}$/),
    });

    const storedHash =
      prismaMock.waiverSubmission.create.mock.calls[0][0].data
        .verificationTokenHash;
    expect(storedHash).toBe(
      createHash('sha256').update(result.verificationToken).digest('hex'),
    );
    expect(storedHash).not.toBe(result.verificationToken);
  });

  it('supports more than five minors in one atomic submission', async () => {
    const minors = Array.from({ length: 6 }, (_, index) => ({
      fullName: `Child ${index + 1}`,
      dateOfBirth: `201${index}-01-01`,
    }));

    await service.submit('public-slug', {
      signatoryFullName: 'Responsible Adult',
      accepted: true,
      signatureData: 'signature',
      signatoryParticipating: false,
      minors,
    });

    expect(prismaMock.waiverSubmission.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          minors: {
            create: minors.map((minor) => ({
              fullName: minor.fullName,
              dateOfBirth: new Date(`${minor.dateOfBirth}T00:00:00.000Z`),
              bookingParticipantId: undefined,
            })),
          },
        }),
      }),
    );
  });

  it('links only explicitly selected participants from the authorised Booking', async () => {
    prismaMock.booking.findFirst.mockResolvedValue({
      id: 'booking-1',
      bookingNumber: 'GLA-1001',
      participants: [
        {
          id: 'adult-1',
          firstName: 'Alex',
          lastName: 'Adult',
          age: 35,
          ticketType: { name: 'Adult' },
        },
        {
          id: 'child-1',
          firstName: 'Casey',
          lastName: 'Child',
          age: 8,
          ticketType: { name: 'Child' },
        },
      ],
    });

    await service.submit('public-slug', {
      signatoryFullName: 'Alex Adult',
      accepted: true,
      signatureData: 'signature',
      signatoryParticipating: true,
      signatoryParticipantId: 'adult-1',
      bookingId: 'booking-1',
      publicAccessToken: 'a'.repeat(64),
      mediaConsent: false,
      marketingConsent: true,
      minors: [
        {
          fullName: 'Casey Child',
          dateOfBirth: '2018-01-01',
          bookingParticipantId: 'child-1',
        },
      ],
    });

    expect(prismaMock.booking.findFirst).toHaveBeenCalledWith({
      where: {
        id: 'booking-1',
        eventId: 'event-1',
        status: 'CONFIRMED',
        paymentStatus: 'PAID',
        publicAccessTokenHash: createHash('sha256')
          .update('a'.repeat(64))
          .digest('hex'),
      },
      select: expect.any(Object),
    });
    expect(prismaMock.waiverSubmission.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          bookingId: 'booking-1',
          signatoryParticipantId: 'adult-1',
          mediaConsent: false,
          marketingConsent: true,
          minors: {
            create: [
              expect.objectContaining({ bookingParticipantId: 'child-1' }),
            ],
          },
          associationAudits: {
            create: {
              organizationId: 'organization-1',
              eventId: 'event-1',
              bookingId: 'booking-1',
              action: 'BOOKING_LINKED_SUBMISSION',
              participantIds: ['adult-1', 'child-1'],
            },
          },
        }),
      }),
    );
  });

  it('rejects participant association when the Booking credential is invalid', async () => {
    prismaMock.booking.findFirst.mockResolvedValue(null);

    await expect(
      service.submit('public-slug', {
        signatoryFullName: 'Alex Adult',
        accepted: true,
        signatureData: 'signature',
        signatoryParticipating: true,
        signatoryParticipantId: 'participant-1',
        bookingId: 'booking-1',
        publicAccessToken: 'b'.repeat(64),
      }),
    ).rejects.toThrow(NotFoundException);
    expect(prismaMock.waiverSubmission.create).not.toHaveBeenCalled();
  });

  it('returns a paid Booking context without exposing its access credential', async () => {
    prismaMock.booking.findFirst.mockResolvedValue({
      id: 'booking-1',
      bookingNumber: 'GLA-1001',
      participants: [{ id: 'participant-1', firstName: 'Alex' }],
    });

    await expect(
      service.bookingContext('public-slug', {
        bookingId: 'booking-1',
        publicAccessToken: 'c'.repeat(64),
      }),
    ).resolves.toEqual({
      bookingId: 'booking-1',
      bookingNumber: 'GLA-1001',
      participants: [{ id: 'participant-1', firstName: 'Alex' }],
    });
  });

  it('rejects a future minor date of birth before persistence', async () => {
    await expect(
      service.submit('public-slug', {
        signatoryFullName: 'Responsible Adult',
        accepted: true,
        signatureData: 'signature',
        signatoryParticipating: false,
        minors: [
          {
            fullName: 'Future Child',
            dateOfBirth: '2999-01-01',
          },
        ],
      }),
    ).rejects.toThrow(BadRequestException);

    expect(prismaMock.waiverSubmission.create).not.toHaveBeenCalled();
  });

  it('rejects an impossible minor calendar date', async () => {
    await expect(
      service.submit('public-slug', {
        signatoryFullName: 'Responsible Adult',
        accepted: true,
        signatureData: 'signature',
        signatoryParticipating: false,
        minors: [
          {
            fullName: 'Child One',
            dateOfBirth: '2025-02-30',
          },
        ],
      }),
    ).rejects.toThrow(BadRequestException);

    expect(prismaMock.waiverSubmission.create).not.toHaveBeenCalled();
  });

  it('verifies completion without exposing personal or evidence data', async () => {
    const verificationToken = 'a'.repeat(64);
    prismaMock.waiverSubmission.findUnique.mockResolvedValue({
      acceptedAt,
      signatoryParticipating: true,
      _count: { minors: 2 },
      eventWaiver: {
        event: {
          name: 'Bathurst Ice Rink',
        },
      },
      waiverVersion: {
        version: 2,
        title: 'Bathurst Ice Rink Waiver',
      },
    });

    await expect(service.verify(verificationToken)).resolves.toEqual({
      verified: true,
      eventName: 'Bathurst Ice Rink',
      waiverTitle: 'Bathurst Ice Rink Waiver',
      waiverVersion: 2,
      acceptedAt,
      coveredPersonCount: 3,
      verificationUrl: `http://localhost:3001/waivers/verify/${verificationToken}`,
      qrCodeDataUrl: 'data:image/png;base64,proof-qr',
    });
    expect(prismaMock.waiverSubmission.findUnique).toHaveBeenCalledWith({
      where: {
        verificationTokenHash: createHash('sha256')
          .update(verificationToken)
          .digest('hex'),
      },
      select: expect.any(Object),
    });
  });

  it('rejects malformed and unknown verification credentials', async () => {
    await expect(service.verify('not-a-token')).rejects.toThrow(
      NotFoundException,
    );
    expect(prismaMock.waiverSubmission.findUnique).not.toHaveBeenCalled();

    prismaMock.waiverSubmission.findUnique.mockResolvedValue(null);
    await expect(service.verify('b'.repeat(64))).rejects.toThrow(
      NotFoundException,
    );
  });
});
