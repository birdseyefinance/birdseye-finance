-- CreateTable
CREATE TABLE "public"."NetWorthSnapshot" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "asOf" TIMESTAMP(3) NOT NULL,
    "banksUSD" DOUBLE PRECISION NOT NULL,
    "walletsUSD" DOUBLE PRECISION NOT NULL,
    "netWorthUSD" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NetWorthSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "NetWorthSnapshot_userId_asOf_key" ON "public"."NetWorthSnapshot"("userId", "asOf");
