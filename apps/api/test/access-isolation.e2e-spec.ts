import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import request from 'supertest';
import { App } from 'supertest/types';

import { AppModule } from '../src/app.module';
import {
  applyApplicationSecurityHeaders,
  createApplicationValidationPipe,
} from '../src/config/application-security';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Tenant and role isolation (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  const password = 'Isolation-test-password-31!';

  async function login(email: string) {
    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email, password })
      .expect(201);

    return response.body.accessToken as string;
  }

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication({ rawBody: true });
    app.set('trust proxy', 1);
    applyApplicationSecurityHeaders(app);
    app.useGlobalPipes(createApplicationValidationPipe());
    await app.init();

    prisma = app.get(PrismaService);
    const passwordHash = await bcrypt.hash(password, 4);
    const startsAt = new Date('2031-06-01T00:00:00.000Z');
    const endsAt = new Date('2031-06-30T00:00:00.000Z');

    await prisma.organization.create({
      data: {
        id: 'isolation-org-a',
        name: 'Isolation Organisation A',
        slug: 'isolation-organisation-a',
        events: {
          create: [
            {
              id: 'isolation-event-a-assigned',
              name: 'Assigned Event A',
              slug: 'isolation-event-a-assigned',
              startDate: startsAt,
              endDate: endsAt,
            },
            {
              id: 'isolation-event-a-unassigned',
              name: 'Unassigned Event A',
              slug: 'isolation-event-a-unassigned',
              startDate: startsAt,
              endDate: endsAt,
            },
          ],
        },
      },
    });
    await prisma.organization.create({
      data: {
        id: 'isolation-org-b',
        name: 'Isolation Organisation B',
        slug: 'isolation-organisation-b',
        events: {
          create: {
            id: 'isolation-event-b',
            name: 'Event B',
            slug: 'isolation-event-b',
            startDate: startsAt,
            endDate: endsAt,
          },
        },
      },
    });

    for (const user of [
      {
        id: 'isolation-owner-a',
        email: 'owner-a@isolation.invalid',
        name: 'Owner A',
        organizationId: 'isolation-org-a',
        role: 'OWNER' as const,
        accessScope: 'ALL_EVENTS' as const,
      },
      {
        id: 'isolation-owner-b',
        email: 'owner-b@isolation.invalid',
        name: 'Owner B',
        organizationId: 'isolation-org-b',
        role: 'OWNER' as const,
        accessScope: 'ALL_EVENTS' as const,
      },
      {
        id: 'isolation-staff-a',
        email: 'staff-a@isolation.invalid',
        name: 'Restricted Staff A',
        organizationId: 'isolation-org-a',
        role: 'STAFF' as const,
        accessScope: 'ASSIGNED_EVENTS' as const,
      },
      {
        id: 'isolation-scanner-a',
        email: 'scanner-a@isolation.invalid',
        name: 'Scanner A',
        organizationId: 'isolation-org-a',
        role: 'SCANNER' as const,
        accessScope: 'ASSIGNED_EVENTS' as const,
      },
    ]) {
      await prisma.user.create({
        data: {
          id: user.id,
          email: user.email,
          name: user.name,
          passwordHash,
          organizations: {
            create: {
              organizationId: user.organizationId,
              role: user.role,
              accessScope: user.accessScope,
            },
          },
        },
      });
    }

    await prisma.userEventAccess.createMany({
      data: [
        {
          userId: 'isolation-staff-a',
          eventId: 'isolation-event-a-assigned',
        },
        {
          userId: 'isolation-scanner-a',
          eventId: 'isolation-event-a-assigned',
        },
      ],
    });
  });

  afterAll(async () => {
    await app.close();
  });

  it('keeps each owner inside their organisation', async () => {
    const ownerAToken = await login('owner-a@isolation.invalid');
    const ownerBToken = await login('owner-b@isolation.invalid');

    const ownerAEvents = await request(app.getHttpServer())
      .get('/event')
      .set('Authorization', `Bearer ${ownerAToken}`)
      .expect(200);
    expect(
      ownerAEvents.body.map(({ id }: { id: string }) => id).sort(),
    ).toEqual(['isolation-event-a-assigned', 'isolation-event-a-unassigned']);

    await request(app.getHttpServer())
      .get('/event/isolation-event-b')
      .set('Authorization', `Bearer ${ownerAToken}`)
      .expect(404, {
        message: 'Event not found',
        error: 'Not Found',
        statusCode: 404,
      });
    await request(app.getHttpServer())
      .get('/event/isolation-event-a-assigned')
      .set('Authorization', `Bearer ${ownerBToken}`)
      .expect(404, {
        message: 'Event not found',
        error: 'Not Found',
        statusCode: 404,
      });
  });

  it('limits restricted staff to explicitly assigned events', async () => {
    const token = await login('staff-a@isolation.invalid');
    const events = await request(app.getHttpServer())
      .get('/event')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(events.body.map(({ id }: { id: string }) => id)).toEqual([
      'isolation-event-a-assigned',
    ]);
    await request(app.getHttpServer())
      .get('/event/isolation-event-a-unassigned')
      .set('Authorization', `Bearer ${token}`)
      .expect(404);
  });

  it('denies scanner credentials access to event administration routes', async () => {
    const token = await login('scanner-a@isolation.invalid');

    await request(app.getHttpServer())
      .get('/event/isolation-event-a-assigned')
      .set('Authorization', `Bearer ${token}`)
      .expect(403);
  });

  it('returns a generic 429 after repeated login attempts from one source', async () => {
    for (let attempt = 0; attempt < 20; attempt += 1) {
      await request(app.getHttpServer())
        .post('/auth/login')
        .set('X-Forwarded-For', '203.0.113.31')
        .send({ email: 'unknown@isolation.invalid', password })
        .expect(401, {
          message: 'Invalid email or password',
          error: 'Unauthorized',
          statusCode: 401,
        });
    }

    const blocked = await request(app.getHttpServer())
      .post('/auth/login')
      .set('X-Forwarded-For', '203.0.113.31')
      .send({ email: 'unknown@isolation.invalid', password })
      .expect(429, {
        statusCode: 429,
        message: 'Too many requests. Please try again later.',
      });

    expect(blocked.headers['retry-after']).toBeDefined();
    expect(blocked.headers['ratelimit-limit']).toBe('20');
  });

  it('invalidates an authenticated token immediately after all-session revocation', async () => {
    const token = await login('owner-a@isolation.invalid');

    await request(app.getHttpServer())
      .get('/auth/me')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    await request(app.getHttpServer())
      .post('/auth/logout-all')
      .set('Authorization', `Bearer ${token}`)
      .expect(201, { revoked: true });
    await request(app.getHttpServer())
      .get('/auth/me')
      .set('Authorization', `Bearer ${token}`)
      .expect(401);
  });
});
