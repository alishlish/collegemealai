/*
  Warnings:

  - You are about to drop the column `needsToBuy` on the `Recipe` table. All the data in the column will be lost.
  - You are about to drop the column `usedFridge` on the `Recipe` table. All the data in the column will be lost.
  - You are about to drop the column `usedPantry` on the `Recipe` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Recipe" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL,
    "ingredients" JSONB NOT NULL,
    "steps" JSONB NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_Recipe" ("createdAt", "id", "ingredients", "steps", "title") SELECT "createdAt", "id", "ingredients", "steps", "title" FROM "Recipe";
DROP TABLE "Recipe";
ALTER TABLE "new_Recipe" RENAME TO "Recipe";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
