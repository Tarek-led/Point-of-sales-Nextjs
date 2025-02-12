import { PrismaClient } from '@prisma/client';
import { fakeTransactionComplete, fakeProductStockComplete } from './fake-data';

// Initialize Prisma Client with SQLite
const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database: SQLite (Offline Mode)");

  // Clear existing data
  await prisma.productStock.deleteMany();
  await prisma.product.deleteMany();
  await prisma.onSaleProduct.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.shopData.deleteMany();
  await prisma.user.deleteMany();

  // Insert new fake data
  const fakerRounds = 40;
  for (let i = 0; i < fakerRounds; i++) {
    const product = await prisma.productStock.create({
      data: fakeProductStockComplete(),
    });
    console.log(`✅ Created Product with id ${product.id}`);
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error("Error in seeding:", e);
    await prisma.$disconnect();
    process.exit(1);
  });
