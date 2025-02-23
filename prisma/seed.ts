import { PrismaClient } from '@prisma/client';

// Initialize Prisma Client with SQLite
const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database: SQLite (Offline Mode)");

  // Clear existing data (optional, you can skip this if you don't want to delete data)
  await prisma.productStock.deleteMany();
  await prisma.product.deleteMany();
  await prisma.onSaleProduct.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.shopData.deleteMany();
  await prisma.user.deleteMany();
  await prisma.category.deleteMany(); // If you want to delete categories (optional)

  console.log("✅ Seed completed. No fake data inserted.");
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
