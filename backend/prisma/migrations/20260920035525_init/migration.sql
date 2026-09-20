-- CreateEnum
CREATE TYPE "Role" AS ENUM ('FARMER', 'FPO_LEADER', 'BUYER', 'ADMIN');

-- CreateEnum
CREATE TYPE "Language" AS ENUM ('MARATHI', 'HINDI', 'ENGLISH');

-- CreateEnum
CREATE TYPE "VerificationStatus" AS ENUM ('PENDING', 'VERIFIED', 'REJECTED');

-- CreateEnum
CREATE TYPE "QualityGrade" AS ENUM ('GRADE_A', 'GRADE_B', 'GRADE_C', 'PENDING');

-- CreateEnum
CREATE TYPE "LotStatus" AS ENUM ('LISTED', 'AGGREGATED', 'IN_ESCROW', 'DISPATCHED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "DemandStatus" AS ENUM ('OPEN', 'MATCHED', 'FULFILLED');

-- CreateEnum
CREATE TYPE "OfferStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED');

-- CreateEnum
CREATE TYPE "EscrowStatus" AS ENUM ('HOLD', 'RELEASED', 'REFUNDED');

-- CreateTable
CREATE TABLE "User" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "passwordHash" TEXT,
    "role" "Role" NOT NULL,
    "language" "Language" NOT NULL DEFAULT 'MARATHI',
    "verificationStatus" "VerificationStatus" NOT NULL DEFAULT 'PENDING',
    "rating" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FpoCluster" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "registrationNumber" TEXT,
    "adminId" UUID NOT NULL,
    "district" TEXT NOT NULL,
    "state" TEXT NOT NULL DEFAULT 'Maharashtra',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FpoCluster_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CropLot" (
    "id" UUID NOT NULL,
    "farmerId" UUID NOT NULL,
    "fpoId" UUID,
    "cropName" TEXT NOT NULL,
    "variety" TEXT NOT NULL,
    "weightKg" DOUBLE PRECISION NOT NULL,
    "basePrice" DOUBLE PRECISION NOT NULL,
    "qualityGrade" "QualityGrade" NOT NULL DEFAULT 'PENDING',
    "sampleImageUrls" TEXT[],
    "status" "LotStatus" NOT NULL DEFAULT 'LISTED',
    "harvestDate" TIMESTAMP(3) NOT NULL,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "aggregatedFromIds" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CropLot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BuyerDemand" (
    "id" UUID NOT NULL,
    "buyerId" UUID NOT NULL,
    "cropName" TEXT NOT NULL,
    "targetGrade" "QualityGrade" NOT NULL,
    "requiredQuantityKg" DOUBLE PRECISION NOT NULL,
    "maxPrice" DOUBLE PRECISION NOT NULL,
    "destinationPincode" TEXT NOT NULL,
    "status" "DemandStatus" NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BuyerDemand_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DemandOffer" (
    "id" UUID NOT NULL,
    "demandId" UUID NOT NULL,
    "farmerId" UUID NOT NULL,
    "lotId" UUID NOT NULL,
    "message" TEXT,
    "status" "OfferStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DemandOffer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Transaction" (
    "id" UUID NOT NULL,
    "lotId" UUID NOT NULL,
    "buyerId" UUID NOT NULL,
    "agreedPrice" DOUBLE PRECISION NOT NULL,
    "totalAmount" DOUBLE PRECISION NOT NULL,
    "escrowStatus" "EscrowStatus" NOT NULL DEFAULT 'HOLD',
    "signedDeliveryQrHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MandiPriceHistory" (
    "id" UUID NOT NULL,
    "mandiName" TEXT NOT NULL,
    "cropName" TEXT NOT NULL,
    "arrivalVolumeTonnes" DOUBLE PRECISION NOT NULL,
    "minPrice" DOUBLE PRECISION NOT NULL,
    "maxPrice" DOUBLE PRECISION NOT NULL,
    "modalPrice" DOUBLE PRECISION NOT NULL,
    "recordedDate" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MandiPriceHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_phone_key" ON "User"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "FpoCluster_registrationNumber_key" ON "FpoCluster"("registrationNumber");

-- CreateIndex
CREATE INDEX "DemandOffer_farmerId_status_idx" ON "DemandOffer"("farmerId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "DemandOffer_demandId_lotId_key" ON "DemandOffer"("demandId", "lotId");

-- CreateIndex
CREATE INDEX "MandiPriceHistory_mandiName_cropName_recordedDate_idx" ON "MandiPriceHistory"("mandiName", "cropName", "recordedDate");

-- AddForeignKey
ALTER TABLE "FpoCluster" ADD CONSTRAINT "FpoCluster_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CropLot" ADD CONSTRAINT "CropLot_farmerId_fkey" FOREIGN KEY ("farmerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CropLot" ADD CONSTRAINT "CropLot_fpoId_fkey" FOREIGN KEY ("fpoId") REFERENCES "FpoCluster"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BuyerDemand" ADD CONSTRAINT "BuyerDemand_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DemandOffer" ADD CONSTRAINT "DemandOffer_demandId_fkey" FOREIGN KEY ("demandId") REFERENCES "BuyerDemand"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DemandOffer" ADD CONSTRAINT "DemandOffer_farmerId_fkey" FOREIGN KEY ("farmerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DemandOffer" ADD CONSTRAINT "DemandOffer_lotId_fkey" FOREIGN KEY ("lotId") REFERENCES "CropLot"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_lotId_fkey" FOREIGN KEY ("lotId") REFERENCES "CropLot"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
