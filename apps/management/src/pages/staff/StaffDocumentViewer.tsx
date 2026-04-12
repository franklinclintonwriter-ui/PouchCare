import { useRef, useCallback, useMemo } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Printer,
  Share2,
  Download,
  FileText,
} from 'lucide-react';
import {
  useStaffDocuments,
  DOCUMENT_CATEGORIES,
  DOCUMENT_TYPES,
  isPreviewable,
  type DocumentCategory,
} from '@/api/documents';
import { useStaffMember } from '@/api/staff';
import { PageTransition } from '@/components/ui/PageTransition';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import {
  DocumentMediaView,
  type DocumentMediaViewHandle,
} from '@/components/staff/DocumentMediaView';
import { useHeaderConfig } from '@/hooks/useHeaderConfig';
import { toast } from 'sonner';
import { cn } from '@/utils/cn';

export default function StaffDocumentViewer() {
  const { staffId = '', documentId = '' } = useParams<{
    staffId: string;
    documentId: string;
  }>();
  const navigate = useNavigate();
  const mediaRef = useRef<DocumentMediaViewHandle>(null);

  const { data: staff, isLoading: staffLoading } = useStaffMember(staffId);
  const { data: docsPage, isLoading: docsLoading } = useStaffDocuments(staffId);

  const doc = useMemo(
    () => docsPage?.data?.find((d) => d.id === documentId),
    [docsPage?.data, documentId],
  );

  const loading = staffLoading || docsLoading;

  const headerConfig = useMemo(
    () => ({
      title: doc?.title ?? 'Document',
      breadcrumbs: [
        { label: 'Home', href: '/' },
        { label: 'Staff', href: '/staff' },
        { label: staff?.name ?? '…', href: `/staff/${staffId}` },
        { label: doc?.title ?? 'Document' },
      ],
      actions: [],
    }),
    [doc?.title, staff?.name, staffId],
  );
  useHeaderConfig(headerConfig);

  const handleDownload = useCallback(() => {
    if (!doc) return;
    const a = document.createElement('a');
    a.href = doc.fileUrl;
    a.download = doc.fileName;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }, [doc]);

  const handleShare = useCallback(async () => {
    const url = window.location.href;
    const title = doc?.title ?? 'Document';
    try {
      if (navigator.share) {
        await navigator.share({
          title: `${title} · PouchCare`,
          text: doc?.fileName ?? title,
          url,
        });
        return;
      }
      await navigator.clipboard.writeText(url);
      toast.success('Link copied to clipboard');
    } catch (e) {
      if ((e as Error).name === 'AbortError') return;
      try {
        await navigator.clipboard.writeText(url);
        toast.success('Link copied to clipboard');
      } catch {
        toast.error('Could not share or copy link');
      }
    }
  }, [doc?.fileName, doc?.title]);

  const handlePrint = useCallback(() => {
    if (!doc) return;
    if (doc.mimeType === 'application/pdf') {
      mediaRef.current?.printPdf();
      return;
    }
    if (doc.mimeType.startsWith('image/')) {
      mediaRef.current?.printImage();
      return;
    }
    toast.message('Print this file from your device', {
      description: 'Download the file, then open it and use your app’s print option.',
    });
    handleDownload();
  }, [doc, handleDownload]);

  if (loading) {
    return (
      <PageTransition>
        <div className="space-y-4">
          <Skeleton className="h-10 w-full max-w-md rounded-lg" />
          <Skeleton className="h-[min(78vh,900px)] w-full rounded-xl" />
        </div>
      </PageTransition>
    );
  }

  if (!staff || !doc) {
    return (
      <PageTransition>
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <FileText className="mb-4 h-12 w-12 text-gray-300" />
          <p className="text-gray-600 dark:text-gray-400">Document not found or you do not have access.</p>
          <Button className="mt-6" variant="outline" onClick={() => navigate(-1)}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Go back
          </Button>
        </div>
      </PageTransition>
    );
  }

  const catLabel =
    DOCUMENT_CATEGORIES.find((c) => c.value === doc.category)?.label ?? doc.category;
  const typeLabel =
    DOCUMENT_TYPES[doc.category as DocumentCategory]?.find((t) => t.value === doc.documentType)?.label ??
    doc.documentType;

  return (
    <PageTransition>
      <div
        className={cn(
          'document-viewer-page -mx-4 flex min-h-[calc(100dvh-8rem)] flex-col gap-4 lg:-mx-6',
        )}
      >
        <div className="no-print flex flex-col gap-4 rounded-2xl border border-gray-200/80 bg-white/90 p-4 shadow-sm dark:border-gray-700/80 dark:bg-gray-900/80 sm:flex-row sm:items-start sm:justify-between sm:p-5">
          <div className="min-w-0 flex-1 space-y-2">
            <Link
              to={`/staff/${staffId}`}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to {staff.name}
            </Link>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-semibold tracking-tight text-gray-900 dark:text-gray-50 sm:text-2xl">
                {doc.title}
              </h1>
              {doc.isVerified ? (
                <Badge variant="success" size="sm">
                  Verified
                </Badge>
              ) : null}
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {typeLabel} · {catLabel} · {doc.fileName}
            </p>
          </div>

          <div className="flex flex-wrap gap-2 sm:justify-end">
            <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={handlePrint}>
              <Printer className="h-4 w-4" />
              Print
            </Button>
            <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={handleShare}>
              <Share2 className="h-4 w-4" />
              Share
            </Button>
            <Button type="button" variant="primary" size="sm" className="gap-1.5" onClick={handleDownload}>
              <Download className="h-4 w-4" />
              Download
            </Button>
          </div>
        </div>

        {isPreviewable(doc.mimeType) ? (
          <DocumentMediaView
            ref={mediaRef}
            fileUrl={doc.fileUrl}
            fileName={doc.fileName}
            mimeType={doc.mimeType}
            title={doc.title}
            className="min-h-0 flex-1 rounded-2xl border border-gray-200/60 bg-gray-50/50 dark:border-gray-700/60"
          />
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-gray-50/80 px-6 py-16 text-center dark:border-gray-700 dark:bg-gray-900/40">
            <p className="mb-2 text-lg font-medium text-gray-900 dark:text-gray-100">Preview not available</p>
            <p className="mb-6 max-w-md text-sm text-gray-500">
              This file type cannot be shown in the browser. Download it to open with the appropriate app, or print from
              there.
            </p>
            <Button type="button" onClick={handleDownload} className="gap-2">
              <Download className="h-4 w-4" />
              Download {doc.fileName}
            </Button>
          </div>
        )}
      </div>
    </PageTransition>
  );
}
