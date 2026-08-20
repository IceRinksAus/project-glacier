import 'reflect-metadata';

import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

import { CreateBookingDto } from '../../booking/dto/create-booking.dto';
import { CreatePublicCustomerDto } from './create-public-customer.dto';
import { CreatePublicPaymentDto } from './create-public-payment.dto';
import { EvaluatePublicRulesDto } from './evaluate-public-rules.dto';

describe('public Booking DTOs', () => {
  it('rejects malformed Customer identity input', async () => {
    const dto = plainToInstance(CreatePublicCustomerDto, {
      firstName: '   ',
      lastName: 'Customer',
      email: 'not-an-email',
      phone: 'x'.repeat(51),
    });

    const errors = await validate(dto);

    expect(errors.map((error) => error.property)).toEqual(
      expect.arrayContaining(['firstName', 'email', 'phone']),
    );
  });

  it('requires a high-entropy public payment token', async () => {
    const dto = plainToInstance(CreatePublicPaymentDto, {
      publicAccessToken: 'guessable-token',
    });

    const errors = await validate(dto);

    expect(errors.map((error) => error.property)).toContain(
      'publicAccessToken',
    );
  });

  it('bounds public rule evaluation participants', async () => {
    const dto = plainToInstance(EvaluatePublicRulesDto, {
      sessionId: 'session-1',
      participants: Array.from({ length: 51 }, (_, index) => ({
        firstName: `Participant ${index}`,
        age: 20,
        ticketTypeId: 'ticket-type-1',
      })),
    });

    const errors = await validate(dto);

    expect(errors.map((error) => error.property)).toContain('participants');
  });

  it('validates nested Booking participants', async () => {
    const dto = plainToInstance(CreateBookingDto, {
      customerId: 'customer-1',
      eventId: 'event-1',
      sessionId: 'session-1',
      participants: [
        {
          firstName: 'Participant',
          age: 131,
          ticketTypeId: 'ticket-type-1',
        },
      ],
    });

    const errors = await validate(dto);

    expect(errors.map((error) => error.property)).toContain('participants');
  });
});
