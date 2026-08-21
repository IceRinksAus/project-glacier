import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

import { EventBrandingDto } from './event-branding.dto';

describe('EventBrandingDto', () => {
  const validBranding = {
    primaryColor: '#112233',
    secondaryColor: '#223344',
    accentColor: '#334455',
    backgroundColor: '#FFFFFF',
    surfaceColor: '#F8FAFC',
    textColor: '#0F172A',
    headingFont: 'OSWALD',
    bodyFont: 'INTER',
    heroHeadline: 'Skate into winter',
    heroDescription: 'A fictional branded Event.',
  };

  it('accepts controlled branding and normalises hexadecimal colour casing', async () => {
    const dto = plainToInstance(EventBrandingDto, {
      ...validBranding,
      primaryColor: '#aabbcc',
    });

    await expect(validate(dto)).resolves.toHaveLength(0);
    expect(dto.primaryColor).toBe('#AABBCC');
  });

  it('rejects non-canonical colours and fonts outside the allowlist', async () => {
    const dto = plainToInstance(EventBrandingDto, {
      ...validBranding,
      accentColor: 'rgb(1, 2, 3)',
      headingFont: 'REMOTE_CUSTOM_FONT',
    });

    const errors = await validate(dto);

    expect(errors.map(({ property }) => property)).toEqual(
      expect.arrayContaining(['accentColor', 'headingFont']),
    );
  });

  it('rejects unbounded hero content', async () => {
    const dto = plainToInstance(EventBrandingDto, {
      ...validBranding,
      heroHeadline: 'x'.repeat(121),
      heroDescription: 'x'.repeat(501),
    });

    const errors = await validate(dto);

    expect(errors.map(({ property }) => property)).toEqual(
      expect.arrayContaining(['heroHeadline', 'heroDescription']),
    );
  });
});
