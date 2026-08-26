export enum TicketValidationReason {
  VALID = 'VALID',
  NOT_FOUND = 'NOT_FOUND',
  ALREADY_SCANNED = 'ALREADY_SCANNED',
  CANCELLED = 'CANCELLED',
  EXPIRED = 'EXPIRED',
  WRONG_SESSION = 'WRONG_SESSION',
  WRONG_EVENT = 'WRONG_EVENT',
  NOT_YET_VALID = 'NOT_YET_VALID',
}

export class TicketValidationResponseDto {
  valid: boolean;

  reason: TicketValidationReason;

  message: string;

  ticketNumber: string;

  status: string;

  checkedInAt: Date | null;

  replacementTicketNumber: string | null;

  participant: {
    firstName: string;
    lastName: string | null;
  };

  event: {
    name: string;
  };

  session: {
    name: string;
    start: Date;
  };
}
