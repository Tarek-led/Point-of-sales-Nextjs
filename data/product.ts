import { db } from '@/lib/db';
// import isOnline from 'is-online';

export const fetchProduct = async ({
  take = 5,
  skip = 0,
  query,
}: {
  query?: string;
  take: number;
  skip: number;
}) => {
  // const isOnlineResult = await isOnline();

  // if (!isOnlineResult) {
  //   throw new Error('No internet connection');
  //   return;
  // }

  ('use server');
  try {
    // console.log('Querying products with:', query);
    const results = await db.product.findMany({
      where: {
        productstock: {
          name: { contains: query?.toLowerCase()  },
        },
      },
      skip,
      take,
      select: {
        id: true,
        productId: true,
        sellprice: true,
        productstock: {
          select: {
            id: true,
            name: true,
            cat: true,
            stock: true,
            price: true,
          },
        },
      },
      orderBy: {
        productstock: {
          name: 'asc',
        },
      },
    });
    // console.log('Fetched products:', results);

    const total = await db.product.count();

    return {
      data: results,
      metadata: {
        hasNextPage: skip + take < total,
        totalPages: Math.ceil(total / take),
      },
    };
  } finally {
    await db.$disconnect();
  }
};
