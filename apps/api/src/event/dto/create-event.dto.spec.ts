import 'reflect-metadata';

import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

import { CreateEventDto } from './create-event.dto';

describe('CreateEventDto', () => {
  const valid = {
    name: 'Winter Ice Event',
    slug: 'winter-ice-event',
    startDate: '2027-09-01T00:00:00.000Z',
    endDate: '2027-09-05T00:00:00.000Z',
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
});
