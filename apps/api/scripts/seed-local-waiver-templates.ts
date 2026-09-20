import 'dotenv/config';

import { PrismaPg } from '@prisma/adapter-pg';
import {
  AustralianJurisdiction,
  EventActivityType,
  PrismaClient,
} from '@prisma/client';

if (process.env.NODE_ENV === 'production') {
  throw new Error('Local Waiver test fixtures cannot run in production.');
}

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is required.');
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

const jurisdictions: AustralianJurisdiction[] = ['NSW', 'VIC', 'WA', 'SA'];
const approvalReference =
  'LOCAL TEST ONLY — fictional assumed legal approval for workflow testing; not approved production wording';

function contentTemplate(jurisdiction: AustralianJurisdiction) {
  return `LOCAL TEST WAIVER — NOT FOR PRODUCTION USE

Promoter: {{promoter}}
Event: {{eventName}}
Location: {{eventLocation}}
Site address: {{siteAddress}}
Event dates: {{eventDates}}
Jurisdiction: ${jurisdiction}

This fictional local-testing waiver is supplied only to exercise Glacier's template selection, Event configuration, publication, signing, participant coverage and verification workflows.

By accepting this test waiver, the participant acknowledges that ice skating is a physical recreational activity with risks including falls, collisions and contact with equipment, other participants and rink surfaces. The participant agrees to follow reasonable venue and staff directions and confirms that any dependant included in the submission is in their care and may be covered by this test acceptance.

This text is not legal advice, does not cite or reproduce jurisdictional legislation and must be replaced by currently approved legal wording before any real Event or customer use.

Additional approved Event information:
{{additionalInformation}}`;
}

async function main() {
  for (const jurisdiction of jurisdictions) {
    const existing = await prisma.waiverTemplate.findFirst({
      where: {
        authority: 'PLATFORM_CURATED',
        organizationId: null,
        activityType: EventActivityType.ICE_SKATING,
        jurisdiction,
        revision: 1,
      },
    });

    const data = {
      name: `${jurisdiction} Ice Skating — Local Test Template`,
      contentTemplate: contentTemplate(jurisdiction),
      acceptanceStatement:
        'I confirm that I have read and accept this LOCAL TEST waiver for {{eventName}} for myself and any dependants listed in this submission.',
      legislationReferences: [],
      status: 'APPROVED' as const,
      approvedAt: new Date('2026-09-20T00:00:00.000Z'),
      approvalReference,
      approvedByUserId: null,
    };

    if (existing) {
      await prisma.waiverTemplate.update({
        where: { id: existing.id },
        data,
      });
    } else {
      await prisma.waiverTemplate.create({
        data: {
          ...data,
          id: `local-test-ice-skating-${jurisdiction.toLowerCase()}-v1`,
          authority: 'PLATFORM_CURATED',
          organizationId: null,
          activityType: EventActivityType.ICE_SKATING,
          jurisdiction,
          revision: 1,
        },
      });
    }
  }

  console.log(
    `Local Waiver fixtures ready: ${jurisdictions.join(', ')} ice-skating templates (test-only).`,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => prisma.$disconnect());
