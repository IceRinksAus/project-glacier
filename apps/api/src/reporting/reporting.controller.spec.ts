import { StreamableFile } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { ROLES_KEY } from '../auth/decorators/roles.decorator';
import { ReportingController } from './reporting.controller';
import { ReportingService } from './reporting.service';

describe('ReportingController', () => {
  let controller: ReportingController;
  const service = {
    getEventReport: jest.fn(),
    getOrganizationSummary: jest.fn(),
    getTicketTypeSales: jest.fn(),
    getSessionSales: jest.fn(),
    getProductSales: jest.fn(),
    getDateSales: jest.fn(),
    getSalesPace: jest.fn(),
    getEventGroupComparison: jest.fn(),
    getEventCsv: jest.fn(),
    getEventGroupComparisonCsv: jest.fn(),
  };

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

  it('uses trusted Organisation context for the summary', async () => {
    service.getOrganizationSummary.mockResolvedValue({});

    await controller.getOrganizationSummary({
      organizationId: 'organization-1',
    });

    expect(service.getOrganizationSummary).toHaveBeenCalledWith(
      'organization-1',
    );
  });

  it('allows only operator roles at the controller boundary', () => {
    expect(Reflect.getMetadata(ROLES_KEY, ReportingController)).toEqual([
      'OWNER',
      'MEMBER',
    ]);
  });

  it('uses trusted Organisation context for detailed sales reports', async () => {
    const query = { sessionId: 'session-1' };
    await controller.getTicketTypeSales('event-1', { organizationId: 'org-1' }, query);
    await controller.getSessionSales('event-1', { organizationId: 'org-1' }, query);
    await controller.getProductSales('event-1', { organizationId: 'org-1' }, query);
    await controller.getDateSales('event-1', { organizationId: 'org-1' }, query);
    await controller.getSalesPace('event-1', { organizationId: 'org-1' }, query);
    expect(service.getTicketTypeSales).toHaveBeenCalledWith('org-1', 'event-1', query);
    expect(service.getSessionSales).toHaveBeenCalledWith('org-1', 'event-1', query);
    expect(service.getProductSales).toHaveBeenCalledWith('org-1', 'event-1', query);
    expect(service.getDateSales).toHaveBeenCalledWith('org-1', 'event-1', query);
    expect(service.getSalesPace).toHaveBeenCalledWith('org-1', 'event-1', query);
  });

  it('uses trusted Organisation context for Event Group comparisons', async () => {
    await controller.getEventGroupComparison('group-1', { organizationId: 'org-1' });
    expect(service.getEventGroupComparison).toHaveBeenCalledWith('org-1', 'group-1');
  });

  it('sets safe download headers for Event CSV exports', async () => {
    const response = { set: jest.fn() };
    service.getEventCsv.mockResolvedValue({ filename: 'event-sessions-2027-09-01.csv', content: Buffer.from('csv') });

    const result = await controller.exportEventReport('event-1', 'sessions', { organizationId: 'org-1' }, { date: '2027-09-01' }, response as never);

    expect(service.getEventCsv).toHaveBeenCalledWith('org-1', 'event-1', 'sessions', { date: '2027-09-01' });
    expect(response.set).toHaveBeenCalledWith(expect.objectContaining({ 'Content-Type': 'text/csv; charset=utf-8', 'Cache-Control': 'private, no-store' }));
    expect(result).toBeInstanceOf(StreamableFile);
  });
});
