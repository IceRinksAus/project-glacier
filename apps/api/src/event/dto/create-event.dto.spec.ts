import 'reflect-metadata';

import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { AustralianJurisdiction, EventActivityType } from '@prisma/client';

import { CreateEventDto } from './create-event.dto';

describe('CreateEventDto', () => {
  const valid = {
    name: 'Winter Ice Event',
    slug: 'winter-ice-event',
    startDate: '2027-09-01T00:00:00.000Z',
    endDate: '2027-09-05T00:00:00.000Z',
    timezone: 'Australia/Melbourne',
    venueName: 'Preview Ice Arena',
    addressLine1: '1 Example Street',
    suburb: 'Melbourne',
    postcode: '3000',
    country: 'AU',
    jurisdiction: AustralianJurisdiction.VIC,
    activityType: EventActivityType.ICE_SKATING,
  };

  it('allows Event creation to use database entry-policy defaults', async () => {
    await expect(
      validate(plainToInstance(CreateEventDto, valid)),
    ).resolves.toEqual([]);
  });

  it('accepts customised entry-window settings during Event setup', async () => {
    const dto = plainToInstance(CreateEventDto, {
      ...valid,
      entryOpensMinutesBeforeStart: 60,
      entryClosesMinutesAfterEnd: 20,
    });
    await expect(validate(dto)).resolves.toEqual([]);
  });

  it('rejects an out-of-range Event setup policy', async () => {
    const dto = plainToInstance(CreateEventDto, {
      ...valid,
      entryOpensMinutesBeforeStart: 241,
    });
    await expect(validate(dto)).resolves.toHaveLength(1);
  });

  it('rejects unsupported timezone, postcode, jurisdiction and activity values', async () => {
    const dto = plainToInstance(CreateEventDto, {
      ...valid,
      timezone: 'UTC',
      postcode: '300',
      jurisdiction: 'CALIFORNIA',
      activityType: 'SURFING',
    });
    await expect(validate(dto)).resolves.toHaveLength(4);
  });

  it('requires the pilot Event setup fields', async () => {
    const dto = plainToInstance(CreateEventDto, {
      name: valid.name,
      slug: valid.slug,
      startDate: valid.startDate,
      endDate: valid.endDate,
    });
    expect((await validate(dto)).length).toBeGreaterThanOrEqual(8);
  });
});
