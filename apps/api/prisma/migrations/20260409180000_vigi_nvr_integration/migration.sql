-- CreateTable
CREATE TABLE "vigi_nvr_integrations" (
    "id" TEXT NOT NULL,
    "branch_id" TEXT NOT NULL,
    "host" TEXT NOT NULL,
    "port" INTEGER NOT NULL DEFAULT 20443,
    "username" TEXT NOT NULL DEFAULT 'admin',
    "password_encrypted" TEXT NOT NULL,
    "tls_allow_insecure" BOOLEAN NOT NULL DEFAULT false,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "last_sync_at" TIMESTAMP(3),
    "last_error" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vigi_nvr_integrations_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "vigi_nvr_integrations_branch_id_key" ON "vigi_nvr_integrations"("branch_id");

ALTER TABLE "vigi_nvr_integrations" ADD CONSTRAINT "vigi_nvr_integrations_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AlterTable camera_devices
ALTER TABLE "camera_devices" ADD COLUMN     "source" TEXT NOT NULL DEFAULT 'manual';
ALTER TABLE "camera_devices" ADD COLUMN     "vigi_integration_id" TEXT;
ALTER TABLE "camera_devices" ADD COLUMN     "vigi_channel" INTEGER;
ALTER TABLE "camera_devices" ADD COLUMN     "vigi_sync_key" TEXT;

CREATE UNIQUE INDEX "camera_devices_vigi_sync_key_key" ON "camera_devices"("vigi_sync_key");

CREATE INDEX "camera_devices_vigi_integration_id_idx" ON "camera_devices"("vigi_integration_id");

ALTER TABLE "camera_devices" ADD CONSTRAINT "camera_devices_vigi_integration_id_fkey" FOREIGN KEY ("vigi_integration_id") REFERENCES "vigi_nvr_integrations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
