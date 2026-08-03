import 'dotenv/config';
import * as bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

async function main() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error('DATABASE_URL is not defined in apps/api/.env');
  }

  const adapter = new PrismaPg({
    connectionString,
  });

  const prisma = new PrismaClient({
    adapter,
  });

  const email = 'jamie@example.com';
  const password = 'Password123!';

  try {
    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.update({
      where: {
        email,
      },
      data: {
        passwordHash,
      },
    });

    console.log('Password updated successfully.');
    console.log(`User: ${user.email}`);
    console.log(`Password: ${password}`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});