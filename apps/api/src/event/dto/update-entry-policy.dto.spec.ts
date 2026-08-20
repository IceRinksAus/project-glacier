import 'reflect-metadata';

import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

import { UpdateEntryPolicyDto } from './update-entry-policy.dto';

describe('UpdateEntryPolicyDto', () => {
  it('accepts bounded whole-minute policy values', async () => {
    const dto = plainToInstance(UpdateEntryPolicyDto, {
      entryOpensMinutesBeforeStart: 30,
      entryClosesMinutesAfterEnd: 15,
    });
    await expect(validate(dto)).resolves.toEqual([]);
  });

  it('rejects negative, fractional and excessive policy values', async () => {
    const dto = plainToInstance(UpdateEntryPolicyDto, {
      entryOpensMinutesBeforeStart: -1,
      entryClosesMinutesAfterEnd: 240.5,
    });
    await expect(validate(dto)).resolves.toHaveLength(2);
  });
});
