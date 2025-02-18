-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ProductStock" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "imageProduct" TEXT,
    "price" REAL NOT NULL,
    "stock" REAL NOT NULL,
    "cat" TEXT NOT NULL,
    CONSTRAINT "ProductStock_cat_fkey" FOREIGN KEY ("cat") REFERENCES "Category" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_ProductStock" ("cat", "id", "imageProduct", "name", "price", "stock") SELECT "cat", "id", "imageProduct", "name", "price", "stock" FROM "ProductStock";
DROP TABLE "ProductStock";
ALTER TABLE "new_ProductStock" RENAME TO "ProductStock";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
