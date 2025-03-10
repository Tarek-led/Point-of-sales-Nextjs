// data/records.ts
import { db } from '@/lib/db';

export const fetchRecords = async ({
  take = 5,
  skip = 0,
  query,
  startDate,
  endDate,
}: {
  query?: string;
  take: number;
  skip: number;
  startDate?: string;
  endDate?: string;
}) => {
  ('use server');
  try {
    const whereClause: any = {};

    if (query) {
      whereClause.id = { contains: query.toLowerCase() };
    }

    if (startDate || endDate) {
      whereClause.createdAt = {};
      if (startDate) {
        whereClause.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        whereClause.createdAt.lte = new Date(endDate);
      }
    }

    const results = await db.transaction.findMany({
      where: Object.keys(whereClause).length ? whereClause : undefined,
      skip,
      take,
      select: {
        id: true,
        totalAmount: true,
        createdAt: true,
        isComplete: true,
        products: {
          select: {
            id: true,
            productId: true,
            quantity: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    // Calculate total quantity for each transaction
    const resultsWithTotalQuantity = results.map((transaction) => {
      const totalQuantity = transaction.products.reduce(
        (sum, product) => sum + product.quantity,
        0
      );
      return {
        ...transaction,
        totalQuantity,
      };
    });

    // Use the same whereClause for counting filtered records
    const totalTransactions = await db.transaction.count({
      where: Object.keys(whereClause).length ? whereClause : undefined,
    });

    return {
      data: resultsWithTotalQuantity,
      metadata: {
        hasNextPage: skip + take < totalTransactions,
        totalPages: Math.ceil(totalTransactions / take),
      },
    };
  } finally {
    await db.$disconnect();
  }
};
