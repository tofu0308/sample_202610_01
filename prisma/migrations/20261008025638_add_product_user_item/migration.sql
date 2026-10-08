-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "jan" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "brandName" TEXT,
    "imageUrl" TEXT,
    "source" TEXT NOT NULL,
    "genreId" TEXT,
    "genreName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserItem" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "presetKey" TEXT NOT NULL DEFAULT 'paint',
    "remaining" TEXT,
    "note" TEXT,
    "status1" TEXT,
    "status2" TEXT,
    "status3" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Product_jan_key" ON "Product"("jan");

-- CreateIndex
CREATE INDEX "UserItem_userId_idx" ON "UserItem"("userId");

-- CreateIndex
CREATE INDEX "UserItem_userId_presetKey_idx" ON "UserItem"("userId", "presetKey");

-- CreateIndex
CREATE UNIQUE INDEX "UserItem_userId_productId_key" ON "UserItem"("userId", "productId");

-- AddForeignKey
ALTER TABLE "UserItem" ADD CONSTRAINT "UserItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
