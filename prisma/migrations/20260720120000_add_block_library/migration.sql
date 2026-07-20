-- CreateTable
CREATE TABLE "BlockDefinition" (
    "id" TEXT NOT NULL,
    "shop" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "categorySlug" TEXT NOT NULL DEFAULT 'custom',
    "icon" TEXT NOT NULL DEFAULT 'smiley',
    "previewImage" TEXT,
    "keywords" TEXT NOT NULL DEFAULT '[]',
    "supports" TEXT NOT NULL DEFAULT '{}',
    "schema" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BlockDefinition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BlockCategory" (
    "id" TEXT NOT NULL,
    "shop" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BlockCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BlockVersion" (
    "id" TEXT NOT NULL,
    "blockId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "snapshot" TEXT NOT NULL,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BlockVersion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BlockDefinition_shop_status_idx" ON "BlockDefinition"("shop", "status");

-- CreateIndex
CREATE INDEX "BlockDefinition_shop_categorySlug_idx" ON "BlockDefinition"("shop", "categorySlug");

-- CreateIndex
CREATE UNIQUE INDEX "BlockDefinition_shop_name_key" ON "BlockDefinition"("shop", "name");

-- CreateIndex
CREATE INDEX "BlockCategory_shop_idx" ON "BlockCategory"("shop");

-- CreateIndex
CREATE UNIQUE INDEX "BlockCategory_shop_slug_key" ON "BlockCategory"("shop", "slug");

-- CreateIndex
CREATE INDEX "BlockVersion_blockId_idx" ON "BlockVersion"("blockId");

-- CreateIndex
CREATE UNIQUE INDEX "BlockVersion_blockId_version_key" ON "BlockVersion"("blockId", "version");

-- AddForeignKey
ALTER TABLE "BlockVersion" ADD CONSTRAINT "BlockVersion_blockId_fkey" FOREIGN KEY ("blockId") REFERENCES "BlockDefinition"("id") ON DELETE CASCADE ON UPDATE CASCADE;
