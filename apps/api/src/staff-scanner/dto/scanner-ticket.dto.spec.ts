import { TicketScanMode } from '@prisma/client';
import { validate } from 'class-validator';

import { ScannerTicketDto } from './scanner-ticket.dto';

describe('ScannerTicketDto', () => {
  it('accepts a bounded Glacier token and scanner mode', async () => {
    const dto = Object.assign(new ScannerTicketDto(), {
      token: 'a'.repeat(64),
      mode: TicketScanMode.GATE_ENTRY,
    });
    await expect(validate(dto)).resolves.toEqual([]);
  });

  it('accepts the current signed Ticket credential format', async () => {
    const dto = Object.assign(new ScannerTicketDto(), {
      token: `gt1_${'a'.repeat(32)}_${'A'.repeat(43)}`,
      mode: TicketScanMode.TICKET_LOOKUP,
    });

    await expect(validate(dto)).resolves.toEqual([]);
  });

  it('rejects malformed tokens and unknown modes', async () => {
    const dto = Object.assign(new ScannerTicketDto(), {
      token: 'not-a-ticket-token',
      mode: 'ADMIN',
    });
    await expect(validate(dto)).resolves.toHaveLength(2);
  });
});
