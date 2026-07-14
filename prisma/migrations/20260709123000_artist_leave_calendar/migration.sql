CREATE TABLE "ArtistLeave" (
  "id" TEXT NOT NULL,
  "artistId" TEXT NOT NULL,
  "leaveDate" TIMESTAMP(3) NOT NULL,
  "reason" TEXT,
  "isHalfDay" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "deletedAt" TIMESTAMP(3),
  CONSTRAINT "ArtistLeave_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ArtistLeave_artistId_leaveDate_key" ON "ArtistLeave"("artistId", "leaveDate");
CREATE INDEX "ArtistLeave_artistId_idx" ON "ArtistLeave"("artistId");
CREATE INDEX "ArtistLeave_leaveDate_idx" ON "ArtistLeave"("leaveDate");

ALTER TABLE "ArtistLeave"
ADD CONSTRAINT "ArtistLeave_artistId_fkey"
FOREIGN KEY ("artistId") REFERENCES "Artist"("id") ON DELETE CASCADE ON UPDATE CASCADE;
