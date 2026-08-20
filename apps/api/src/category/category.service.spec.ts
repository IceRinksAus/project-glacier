import { Test, TestingModule } from '@nestjs/testing';

import { PrismaService } from '../prisma/prisma.service';
import { CategoryService } from './category.service';

describe('CategoryService', () => {
  let service: CategoryService;

  const prismaMock = {
    category: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
    },
    event: {
      findFirst: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategoryService,
        {
          provide: PrismaService,
          useValue: prismaMock,
        },
      ],
    }).compile();

    service = module.get<CategoryService>(CategoryService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('tenant-scopes category lists through the Event', async () => {
    prismaMock.category.findMany.mockResolvedValue([]);

    await service.findAll('organization-1');

    expect(prismaMock.category.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          event: {
            organizationId: 'organization-1',
          },
        },
      }),
    );
  });

  it('does not create a category for another tenant Event', async () => {
    prismaMock.event.findFirst.mockResolvedValue(null);

    await expect(
      service.create('organization-1', {
        name: 'Admissions',
        slug: 'admissions',
        eventId: 'event-2',
      }),
    ).rejects.toThrow('Event not found');
    expect(prismaMock.category.create).not.toHaveBeenCalled();
  });

  it('tenant-scopes category deletion before dependency checks', async () => {
    prismaMock.category.findFirst.mockResolvedValue(null);

    await expect(
      service.remove('organization-1', 'category-2'),
    ).rejects.toThrow('Category not found');
    expect(prismaMock.category.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          id: 'category-2',
          event: {
            organizationId: 'organization-1',
          },
        },
      }),
    );
  });
});
