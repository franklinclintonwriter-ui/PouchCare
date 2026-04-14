-- CreateTable
CREATE TABLE "staff_documents" (
    "id" TEXT NOT NULL,
    "staff_member_id" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "document_type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "file_name" TEXT NOT NULL,
    "file_size" INTEGER NOT NULL,
    "mime_type" TEXT NOT NULL,
    "file_url" TEXT NOT NULL,
    "thumbnail_url" TEXT,
    "issue_date" TIMESTAMP(3),
    "expiry_date" TIMESTAMP(3),
    "is_verified" BOOLEAN NOT NULL DEFAULT false,
    "verified_by" TEXT,
    "verified_at" TIMESTAMP(3),
    "uploaded_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "staff_documents_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "staff_documents_staff_member_id_idx" ON "staff_documents"("staff_member_id");

-- CreateIndex
CREATE INDEX "staff_documents_category_idx" ON "staff_documents"("category");

-- AddForeignKey
ALTER TABLE "staff_documents" ADD CONSTRAINT "staff_documents_staff_member_id_fkey" FOREIGN KEY ("staff_member_id") REFERENCES "staff_members"("id") ON DELETE CASCADE ON UPDATE CASCADE;
