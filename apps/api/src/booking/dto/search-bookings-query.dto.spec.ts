import 'reflect-metadata';

import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

import { SearchBookingsQueryDto } from './search-bookings-query.dto';

describe('SearchBookingsQueryDto', () => {
  it('normalises bounded paging values and search text', async () => {
    const dto = plainToInstance(
      SearchBookingsQueryDto,
      {
        search: '  Jamie  ',
        page: '2',
        pageSize: '50',
        sortBy: 'total',
        sortDirection: 'asc',
      },
    );

    await expect(
      validate(dto),
    ).resolves.toHaveLength(0);
    expect(dto.search).toBe('Jamie');
    expect(dto.page).toBe(2);
    expect(dto.pageSize).toBe(50);
  });

  it('rejects unbounded or unsupported query values', async () => {
    const dto = plainToInstance(
      SearchBookingsQueryDto,
      {
        search: '   ',
        page: '0',
        pageSize: '101',
        bookingStatus:
          'UNKNOWN',
        sortBy: 'email',
      },
    );

    const errors = await validate(dto);

    expect(errors).toHaveLength(5);
  });
});
