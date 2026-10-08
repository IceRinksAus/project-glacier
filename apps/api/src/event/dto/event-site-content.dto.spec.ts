import 'reflect-metadata';

import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

import { EventSiteContentDto } from './event-site-content.dto';

describe('EventSiteContentDto', () => {
  it('accepts bounded structured homepage content', async () => {
    const dto = plainToInstance(EventSiteContentDto, {
      aboutTitle: 'About the fictional festival',
      aboutBody: 'A fictional family skating experience.',
      highlights: [
        { title: 'Ice skating', description: 'Sessions for all ages.' },
      ],
      faqs: [{ question: 'What should I bring?', answer: 'Warm clothing.' }],
    });

    await expect(validate(dto)).resolves.toHaveLength(0);
  });

  it('rejects excessive child records and unbounded text', async () => {
    const dto = plainToInstance(EventSiteContentDto, {
      aboutBody: 'x'.repeat(3001),
      highlights: Array.from({ length: 9 }, (_, index) => ({
        title: `Highlight ${index}`,
        description: 'Fictional description',
      })),
      faqs: [],
    });

    const errors = await validate(dto);

    expect(errors.map(({ property }) => property)).toEqual(
      expect.arrayContaining(['aboutBody', 'highlights']),
    );
  });

  it('rejects empty or invalid nested content', async () => {
    const dto = plainToInstance(EventSiteContentDto, {
      highlights: [{ title: '', description: 'Description' }],
      faqs: [{ question: 'Question', answer: '' }],
    });

    const errors = await validate(dto);

    expect(errors.map(({ property }) => property)).toEqual(
      expect.arrayContaining(['highlights', 'faqs']),
    );
  });
});
