import { ROLES_KEY } from '../auth/decorators/roles.decorator';
import { FlexibleTicketRequestOperatorController } from './flexible-ticket-request-operator.controller';

describe('FlexibleTicketRequestOperatorController', () => {
  const service = {
    operatorContext: jest.fn(),
    markUnderReview: jest.fn(),
    previewDecision: jest.fn(),
    executeDecision: jest.fn(),
  };
  const controller = new FlexibleTicketRequestOperatorController(
    service as any,
  );
  const access = {
    userId: 'owner-1',
    organizationId: 'organization-1',
    role: 'OWNER' as const,
    accessScope: 'ALL_EVENTS' as const,
  };

  beforeEach(() => jest.clearAllMocks());

  it('limits every operator endpoint to management roles', () => {
    expect(
      Reflect.getMetadata(ROLES_KEY, FlexibleTicketRequestOperatorController),
    ).toEqual(['OWNER', 'MANAGER']);
  });

  it('delegates context and mutation decisions with authenticated access', async () => {
    service.operatorContext.mockResolvedValue({ requests: [] });
    service.markUnderReview.mockResolvedValue({ status: 'UNDER_REVIEW' });
    service.previewDecision.mockResolvedValue({ previewHash: 'a'.repeat(64) });
    service.executeDecision.mockResolvedValue({ status: 'COMPLETED' });

    await controller.context(access, 'booking-1');
    await controller.review(access, 'booking-1', 'FTR-1');
    await controller.previewDecision(access, 'booking-1', 'FTR-1', {
      decision: 'DECLINE',
      reason: 'OTHER',
      note: 'A controlled operator note.',
    });
    await controller.decide(access, 'booking-1', 'FTR-1', {
      decision: 'DECLINE',
      reason: 'OTHER',
      note: 'A controlled operator note.',
      previewHash: 'a'.repeat(64),
    });

    expect(service.operatorContext).toHaveBeenCalledWith(access, 'booking-1');
    expect(service.markUnderReview).toHaveBeenCalledWith(
      access,
      'booking-1',
      'FTR-1',
    );
    expect(service.previewDecision).toHaveBeenCalledWith(
      access,
      'booking-1',
      'FTR-1',
      expect.objectContaining({ decision: 'DECLINE' }),
    );
    expect(service.executeDecision).toHaveBeenCalledWith(
      access,
      'booking-1',
      'FTR-1',
      expect.objectContaining({ previewHash: 'a'.repeat(64) }),
    );
  });
});
