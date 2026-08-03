export enum TicketScanResult {
  ENTRY_GRANTED = 'ENTRY_GRANTED',
  ALREADY_SCANNED = 'ALREADY_SCANNED',
  CANCELLED = 'CANCELLED',
  INVALID = 'INVALID',
}

export class TicketScanResponseDto {
  result: TicketScanResult;

  message: string;

  ticketNumber: string;

  participantName: string;

  eventName: string;

  sessionName: string | null;

  checkedInAt: Date | null;
}