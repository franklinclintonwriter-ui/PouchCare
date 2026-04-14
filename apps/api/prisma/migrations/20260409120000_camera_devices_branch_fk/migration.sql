-- CreateTable
CREATE TABLE "camera_devices" (
    "id" TEXT NOT NULL,
    "branch_id" TEXT NOT NULL,
    "branch_name" TEXT,
    "label" TEXT NOT NULL,
    "location" TEXT,
    "ip_address" TEXT,
    "stream_url" TEXT,
    "rtsp_url" TEXT,
    "status" TEXT NOT NULL DEFAULT 'online',
    "resolution" TEXT DEFAULT '1080p',
    "fps" INTEGER DEFAULT 25,
    "angle" TEXT,
    "has_audio" BOOLEAN NOT NULL DEFAULT false,
    "has_motion_detect" BOOLEAN NOT NULL DEFAULT true,
    "nvr_device" TEXT,
    "last_ping_at" TIMESTAMP(3),
    "last_motion_at" TIMESTAMP(3),
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "camera_devices_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "camera_devices_branch_id_idx" ON "camera_devices"("branch_id");

-- AddForeignKey
ALTER TABLE "camera_devices" ADD CONSTRAINT "camera_devices_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
