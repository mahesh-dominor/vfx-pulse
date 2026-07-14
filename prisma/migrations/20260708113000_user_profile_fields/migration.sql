-- AlterTable
ALTER TABLE "User"
ADD COLUMN "username" TEXT,
ADD COLUMN "designation" "ArtistDesignation",
ADD COLUMN "department" "ArtistDepartment";

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");