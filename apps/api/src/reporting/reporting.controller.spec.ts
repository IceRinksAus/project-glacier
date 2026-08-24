import { Test, TestingModule } from '@nestjs/testing';

import { ROLES_KEY } from '../auth/decorators/roles.decorator';
import { ReportingController } from './reporting.controller';
import { ReportingService } from './reporting.service';

describe('ReportingController', () => {
  let controller: ReportingController;
  const service = { getEventReport: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ReportingController],
      providers: [{ provide: ReportingService, useValue: service }],
    }).compile();
    controller = module.get(ReportingController);
  });

  it('uses trusted Organisation context instead of request query data', async () => {
    const query = { date: '2027-09-01' };
    service.getEventReport.mockResolvedValue({});

    await controller.getEventReport(
      'event-1',
      { organizationId: 'organization-1' },
      query,
    );

    expect(service.getEventReport).toHaveBeenCalledWith(
      'organization-1',
      'event-1',
      query,
    );
  });

  it('allows only operator roles at the controller boundary', () => {
    expect(Reflect.getMetadata(ROLES_KEY, ReportingController)).toEqual([
      'OWNER',
      'MEMBER',
    ]);
  });
});
