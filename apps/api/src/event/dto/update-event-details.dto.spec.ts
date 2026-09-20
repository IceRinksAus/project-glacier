import 'reflect-metadata';

import { AustralianJurisdiction, EventActivityType } from '@prisma/client';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

import { UpdateEventDetailsDto } from './update-event-details.dto';

describe('UpdateEventDetailsDto', () => {
  const valid = {
    name: 'Winter Ice Event',
    startDate: '2027-09-01T00:00:00.000Z',
    endDate: '2027-09-05T00:00:00.000Z',
    timezone: 'Australia/Melbourne',
    venueName: 'Preview Ice Arena',
    addressLine1: '1 Example Street',
    suburb: 'Melbourne',
    postcode: '3000',
    jurisdiction: AustralianJurisdiction.VIC,
    activityType: EventActivityType.ICE_SKATING,
  };

  it('accepts complete Australian Event details', async () => {
    await expect(
      validate(plainToInstance(UpdateEventDetailsDto, valid)),
    ).resolves.toEqual([]);
  });

  it('rejects unsupported timezone, postcode and legal classifications', async () => {
    const dto = plainToInstance(UpdateEventDetailsDto, {
      ...valid,
      timezone: 'UTC',
      postcode: '30',
      jurisdiction: 'OTHER',
      activityType: 'SURFING',
    });
    await expect(validate(dto)).resolves.toHaveLength(4);
  });
});
