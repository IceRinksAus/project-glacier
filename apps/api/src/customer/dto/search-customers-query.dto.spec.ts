import 'reflect-metadata';

import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

import { SearchCustomersQueryDto } from './search-customers-query.dto';

describe('SearchCustomersQueryDto', () => {
  it('trims a bounded search and converts pagination values', async () => {
    const dto = plainToInstance(SearchCustomersQueryDto, {
      search: '  Taylor  ',
      page: '2',
      pageSize: '25',
    });

    await expect(validate(dto)).resolves.toHaveLength(0);
    expect(dto).toEqual(expect.objectContaining({ search: 'Taylor', page: 2 }));
  });

  it('rejects one-character discovery searches and excessive page sizes', async () => {
    const dto = plainToInstance(SearchCustomersQueryDto, {
      search: 'T',
      pageSize: '101',
    });

    expect(await validate(dto)).not.toHaveLength(0);
  });
});
