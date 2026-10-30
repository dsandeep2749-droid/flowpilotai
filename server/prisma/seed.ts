import { seedDatabase } from '../src/database/seeder.js';
import { prisma } from '../src/database/db.js';

seedDatabase()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
