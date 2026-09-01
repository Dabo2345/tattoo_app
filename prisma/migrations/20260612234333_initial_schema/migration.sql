-- CreateTable
CREATE TABLE "artist_profile" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "bio" TEXT NOT NULL,
    "specialties" TEXT[],
    "instagramHandle" TEXT,
    "yearsOfExperience" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "artist_profile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "studio_info" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "instagramHandle" TEXT,
    "googleMapsUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "studio_info_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "studio_config" (
    "id" TEXT NOT NULL,
    "workingStartHour" INTEGER NOT NULL DEFAULT 10,
    "workingStartMinute" INTEGER NOT NULL DEFAULT 0,
    "workingEndHour" INTEGER NOT NULL DEFAULT 20,
    "workingEndMinute" INTEGER NOT NULL DEFAULT 0,
    "slotDurationMinutes" INTEGER NOT NULL DEFAULT 30,
    "consultationDurationMinutes" INTEGER NOT NULL DEFAULT 60,
    "depositAmount" DECIMAL(10,2) NOT NULL DEFAULT 50.00,
    "breaks" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "studio_config_pkey" PRIMARY KEY ("id")
);
