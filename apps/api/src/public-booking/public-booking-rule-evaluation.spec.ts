import { NotFoundException } from '@nestjs/common';

import { BookingService } from '../booking/booking.service';
import { RuleEvaluationService } from '../rule/rule-evaluation/rule-evaluation.service';
import { PublicBookingService } from './public-booking.service';

describe('PublicBookingService public rule evaluation', () => {
  let service: PublicBookingService;

  const prisma = {
    event: {
      findFirst: jest.fn(),
    },
    session: {
      findFirst: jest.fn(),
    },
  };

  const bookingService = {
    create: jest.fn(),
  };

  const ruleEvaluationService = {
    evaluate: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();

    prisma.event.findFirst.mockResolvedValue({
      id: 'event-1',
    });

    prisma.session.findFirst.mockResolvedValue({
      id: 'session-1',
    });

    ruleEvaluationService.evaluate.mockResolvedValue({
      valid: true,
      matchedRuleIds: [],
      requiredProducts: [],
      errors: [],
      warnings: [],
    });

    service = new PublicBookingService(
      prisma as never,
      bookingService as unknown as BookingService,
      ruleEvaluationService as unknown as RuleEvaluationService,
    );
  });

  it('should require one Kanga for an age-4 participant', async () => {
    ruleEvaluationService.evaluate.mockResolvedValue({
      valid: true,
      matchedRuleIds: [
        'rule-kanga-age-3-5',
      ],
      requiredProducts: [
        {
          productSlug:
            'kanga-skating-aid',
          quantity: 1,
          ruleId:
            'rule-kanga-age-3-5',
          ruleName:
            'Age 3-5 Requires Kanga',
          message:
            'Children aged 3 to 5 require a Kanga Skating Aid.',
        },
      ],
      errors: [],
      warnings: [],
    });

    const result =
      await service.evaluateRules(
        'event-1',
        {
          sessionId:
            'session-1',
          flexibleBooking:
            false,
          participants: [
            {
              firstName:
                'Young',
              lastName:
                'Skater',
              age: 4,
              ticketTypeId:
                'ticket-child',
            },
          ],
        },
      );

    expect(
      ruleEvaluationService.evaluate,
    ).toHaveBeenCalledWith(
      'event-1',
      {
        customerAge: 4,
        participantAge: 4,
        participantFirstName:
          'Young',
        participantLastName:
          'Skater',
        ticketTypeId:
          'ticket-child',
        sessionId:
          'session-1',
        eventId:
          'event-1',
        flexibleBooking:
          false,
        participantCount: 1,
        bookingTicketTypeIds: [
  'ticket-child',
],
      },
    );

    expect(result).toEqual({
      valid: true,
      matchedRuleIds: [
        'rule-kanga-age-3-5',
      ],
      requiredProducts: [
        {
          productSlug:
            'kanga-skating-aid',
          quantity: 1,
          ruleIds: [
            'rule-kanga-age-3-5',
          ],
          messages: [
            'Children aged 3 to 5 require a Kanga Skating Aid.',
          ],
        },
      ],
      errors: [],
      warnings: [],
    });
  });

  it('should consolidate Kanga quantities across multiple matching participants', async () => {
    ruleEvaluationService.evaluate
      .mockResolvedValueOnce({
        valid: true,
        matchedRuleIds: [
          'rule-kanga-age-3-5',
        ],
        requiredProducts: [
          {
            productSlug:
              'kanga-skating-aid',
            quantity: 1,
            ruleId:
              'rule-kanga-age-3-5',
            ruleName:
              'Age 3-5 Requires Kanga',
            message:
              'Children aged 3 to 5 require a Kanga Skating Aid.',
          },
        ],
        errors: [],
        warnings: [],
      })
      .mockResolvedValueOnce({
        valid: true,
        matchedRuleIds: [
          'rule-kanga-age-3-5',
        ],
        requiredProducts: [
          {
            productSlug:
              'kanga-skating-aid',
            quantity: 1,
            ruleId:
              'rule-kanga-age-3-5',
            ruleName:
              'Age 3-5 Requires Kanga',
            message:
              'Children aged 3 to 5 require a Kanga Skating Aid.',
          },
        ],
        errors: [],
        warnings: [],
      });

    const result =
      await service.evaluateRules(
        'event-1',
        {
          sessionId:
            'session-1',
          participants: [
            {
              firstName:
                'Child',
              lastName:
                'One',
              age: 3,
              ticketTypeId:
                'ticket-child',
            },
            {
              firstName:
                'Child',
              lastName:
                'Two',
              age: 5,
              ticketTypeId:
                'ticket-child',
            },
          ],
        },
      );

    expect(
      ruleEvaluationService.evaluate,
    ).toHaveBeenCalledTimes(
      2,
    );

    expect(result).toEqual({
      valid: true,
      matchedRuleIds: [
        'rule-kanga-age-3-5',
      ],
      requiredProducts: [
        {
          productSlug:
            'kanga-skating-aid',
          quantity: 2,
          ruleIds: [
            'rule-kanga-age-3-5',
          ],
          messages: [
            'Children aged 3 to 5 require a Kanga Skating Aid.',
          ],
        },
      ],
      errors: [],
      warnings: [],
    });
  });

  it('should return no required products when no participant rules match', async () => {
    const result =
      await service.evaluateRules(
        'event-1',
        {
          sessionId:
            'session-1',
          participants: [
            {
              firstName:
                'Older',
              lastName:
                'Skater',
              age: 6,
              ticketTypeId:
                'ticket-child',
            },
          ],
        },
      );

    expect(result).toEqual({
      valid: true,
      matchedRuleIds: [],
      requiredProducts: [],
      errors: [],
      warnings: [],
    });
  });

  it('should reject rule preview for an inactive or missing public event', async () => {
    prisma.event.findFirst.mockResolvedValue(
      null,
    );

    await expect(
      service.evaluateRules(
        'event-1',
        {
          sessionId:
            'session-1',
          participants: [
            {
              firstName:
                'Young',
              age: 4,
              ticketTypeId:
                'ticket-child',
            },
          ],
        },
      ),
    ).rejects.toThrow(
      NotFoundException,
    );

    expect(
      prisma.session.findFirst,
    ).not.toHaveBeenCalled();

    expect(
      ruleEvaluationService.evaluate,
    ).not.toHaveBeenCalled();
  });

  it('should reject rule preview when the session is not active for the public event', async () => {
    prisma.session.findFirst.mockResolvedValue(
      null,
    );

    await expect(
      service.evaluateRules(
        'event-1',
        {
          sessionId:
            'session-1',
          participants: [
            {
              firstName:
                'Young',
              age: 4,
              ticketTypeId:
                'ticket-child',
            },
          ],
        },
      ),
    ).rejects.toThrow(
      NotFoundException,
    );

    expect(
      prisma.session.findFirst,
    ).toHaveBeenCalledWith({
      where: {
        id: 'session-1',
        eventId: 'event-1',
        status: 'ACTIVE',
      },
      select: {
        id: true,
      },
    });

    expect(
      ruleEvaluationService.evaluate,
    ).not.toHaveBeenCalled();
  });
});