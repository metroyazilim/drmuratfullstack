-- DropIndex
DROP INDEX "MediaAsset_createdAt_idx";

-- DropIndex
DROP INDEX "MediaAsset_key_key";

-- AlterTable
ALTER TABLE "MediaAsset" DROP COLUMN "alt",
DROP COLUMN "key",
DROP COLUMN "size",
ADD COLUMN     "altText" TEXT,
ADD COLUMN     "archived" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "byteSize" INTEGER NOT NULL,
ADD COLUMN     "caption" TEXT,
ADD COLUMN     "checksum" TEXT NOT NULL,
ADD COLUMN     "extension" TEXT NOT NULL,
ADD COLUMN     "filename" TEXT NOT NULL,
ADD COLUMN     "objectKey" TEXT NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "MediaAsset_objectKey_key" ON "MediaAsset"("objectKey");

-- CreateIndex
CREATE INDEX "MediaAsset_archived_createdAt_idx" ON "MediaAsset"("archived", "createdAt");

-- CreateIndex
CREATE INDEX "MediaAsset_checksum_idx" ON "MediaAsset"("checksum");

