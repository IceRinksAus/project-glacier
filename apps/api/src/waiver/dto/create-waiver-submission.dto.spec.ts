import 'reflect-metadata';

import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

import { CreateWaiverSubmissionDto } from './create-waiver-submission.dto';

describe('CreateWaiverSubmissionDto', () => {
  it('requires explicit acceptance', async () => {
    const dto = plainToInstance(CreateWaiverSubmissionDto, {
      signatoryFullName: 'Jamie Stoller',
      accepted: false,
      signatureData: 'signature',
    });

    const errors = await validate(dto);

    expect(errors.some((error) => error.property === 'accepted')).toBe(true);
  });

  it('validates each nested minor', async () => {
    const dto = plainToInstance(CreateWaiverSubmissionDto, {
      signatoryFullName: 'Jamie Stoller',
      accepted: true,
      signatureData: 'signature',
      minors: [{ fullName: '', dateOfBirth: 'not-a-date' }],
    });

    const errors = await validate(dto);

    expect(errors.some((error) => error.property === 'minors')).toBe(true);
  });

  it('allows more than five minors', async () => {
    const dto = plainToInstance(CreateWaiverSubmissionDto, {
      signatoryFullName: 'Jamie Stoller',
      accepted: true,
      signatureData: 'signature',
      minors: Array.from({ length: 6 }, (_, index) => ({
        fullName: `Child ${index + 1}`,
        dateOfBirth: '2015-01-01',
      })),
    });

    await expect(validate(dto)).resolves.toEqual([]);
  });

  it('bounds signature payload size', async () => {
    const dto = plainToInstance(CreateWaiverSubmissionDto, {
      signatoryFullName: 'Jamie Stoller',
      accepted: true,
      signatureData: 'x'.repeat(200_001),
    });

    const errors = await validate(dto);

    expect(errors.some((error) => error.property === 'signatureData')).toBe(
      true,
    );
  });

  it('rejects whitespace-only legal evidence fields', async () => {
    const dto = plainToInstance(CreateWaiverSubmissionDto, {
      signatoryFullName: '   ',
      accepted: true,
      signatureData: '   ',
    });

    const errors = await validate(dto);

    expect(errors.map((error) => error.property)).toEqual(
      expect.arrayContaining(['signatoryFullName', 'signatureData']),
    );
  });
});
