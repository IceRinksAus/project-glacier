import 'dotenv/config';

import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

async function main() {
  const organizationId = 'dev-sprint18-scanner-organization';
  const eventId = 'dev-sprint18-scanner-event';
  const sessionId = 'dev-sprint18-scanner-session';
  const ticketTypeId = 'dev-sprint18-scanner-ticket-type';
  const customerId = 'dev-sprint18-scanner-customer';
  const bookingId = 'dev-sprint18-scanner-booking';
  const participantId = 'dev-sprint18-scanner-participant';
  const ticketId = 'dev-sprint18-scanner-ticket';
  const userId = 'dev-sprint18-scanner-user';
  const ownerUserId = 'dev-sprint18-owner-user';
  const now = new Date();
  const sessionStart = new Date(now.getTime() + 15 * 60_000);
  const sessionEnd = new Date(now.getTime() + 75 * 60_000);

  await prisma.organization.upsert({
    where: { id: organizationId },
    update: { name: 'Sprint 18 Scanner Preview', status: 'ACTIVE' },
    create: {
      id: organizationId,
      name: 'Sprint 18 Scanner Preview',
      slug: 'sprint-18-scanner-preview',
      status: 'ACTIVE',
    },
  });

  await prisma.user.upsert({
    where: { email: 'scanner.preview@glacier.local' },
    update: {
      name: 'Scanner Preview Staff',
      passwordHash: await bcrypt.hash('ScannerPreview!2026', 10),
      isActive: true,
    },
    create: {
      id: userId,
      email: 'scanner.preview@glacier.local',
      name: 'Scanner Preview Staff',
      passwordHash: await bcrypt.hash('ScannerPreview!2026', 10),
      isActive: true,
    },
  });

  const user = await prisma.user.findUniqueOrThrow({
    where: { email: 'scanner.preview@glacier.local' },
  });

  await prisma.userOrganization.upsert({
    where: {
      userId_organizationId: { userId: user.id, organizationId },
    },
    update: { role: 'SCANNER' },
    create: { userId: user.id, organizationId, role: 'SCANNER' },
  });

  await prisma.user.upsert({
    where: { email: 'owner.preview@glacier.local' },
    update: {
      name: 'Owner Preview Staff',
      passwordHash: await bcrypt.hash('OwnerPreview!2026', 10),
      isActive: true,
    },
    create: {
      id: ownerUserId,
      email: 'owner.preview@glacier.local',
      name: 'Owner Preview Staff',
      passwordHash: await bcrypt.hash('OwnerPreview!2026', 10),
      isActive: true,
    },
  });

  const ownerUser = await prisma.user.findUniqueOrThrow({
    where: { email: 'owner.preview@glacier.local' },
  });

  await prisma.userOrganization.upsert({
    where: {
      userId_organizationId: { userId: ownerUser.id, organizationId },
    },
    update: { role: 'OWNER' },
    create: { userId: ownerUser.id, organizationId, role: 'OWNER' },
  });

  await prisma.event.upsert({
    where: { id: eventId },
    update: {
      status: 'ACTIVE',
      startDate: new Date(now.getTime() - 60 * 60_000),
      endDate: new Date(now.getTime() + 4 * 60 * 60_000),
      entryOpensMinutesBeforeStart: 30,
      entryClosesMinutesAfterEnd: 0,
    },
    create: {
      id: eventId,
      organizationId,
      name: 'Sprint 18 Gate Preview',
      slug: 'sprint-18-gate-preview',
      description: 'Fictional local Staff Scanner verification Event',
      status: 'ACTIVE',
      timezone: 'Australia/Melbourne',
      venueName: 'Preview Ice Arena',
      startDate: new Date(now.getTime() - 60 * 60_000),
      endDate: new Date(now.getTime() + 4 * 60 * 60_000),
      entryOpensMinutesBeforeStart: 30,
      entryClosesMinutesAfterEnd: 0,
    },
  });

  await prisma.session.upsert({
    where: { id: sessionId },
    update: { startDate: sessionStart, endDate: sessionEnd, status: 'ACTIVE' },
    create: {
      id: sessionId,
      eventId,
      name: 'Preview Session',
      startDate: sessionStart,
      endDate: sessionEnd,
      status: 'ACTIVE',
      capacity: 100,
    },
  });

  await prisma.ticketType.upsert({
    where: { id: ticketTypeId },
    update: { name: 'Preview Admission', active: true },
    create: {
      id: ticketTypeId,
      eventId,
      name: 'Preview Admission',
      price: 25,
      capacity: 100,
      active: true,
    },
  });

  await prisma.customer.upsert({
    where: { id: customerId },
    update: { firstName: 'Alex', lastName: 'Preview' },
    create: {
      id: customerId,
      firstName: 'Alex',
      lastName: 'Preview',
      email: 'alex.preview@glacier.local',
    },
  });

  await prisma.booking.upsert({
    where: { id: bookingId },
    update: { status: 'CONFIRMED', sessionId, eventId },
    create: {
      id: bookingId,
      bookingNumber: 'SPRINT18-PREVIEW',
      status: 'CONFIRMED',
      paymentStatus: 'PAID',
      total: 25,
      customerId,
      eventId,
      sessionId,
    },
  });

  await prisma.bookingParticipant.upsert({
    where: { id: participantId },
    update: { firstName: 'Alex', lastName: 'Preview', ticketTypeId },
    create: {
      id: participantId,
      bookingId,
      ticketTypeId,
      firstName: 'Alex',
      lastName: 'Preview',
      age: 30,
    },
  });

  await prisma.ticket.upsert({
    where: { id: ticketId },
    update: {
      status: 'ACTIVE',
      checkedInAt: null,
      secureToken: 'b'.repeat(64),
    },
    create: {
      id: ticketId,
      ticketNumber: 'TKT-SPRINT18-PREVIEW',
      secureToken: 'b'.repeat(64),
      status: 'ACTIVE',
      bookingId,
      participantId,
    },
  });

  console.log('Sprint 18 Staff Scanner preview fixture is ready.');
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => prisma.$disconnect());
