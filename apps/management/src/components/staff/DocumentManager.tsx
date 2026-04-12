import { useState, useCallback, useMemo } from 'react';
import {
  FileText,
  Image,
  File,
  Upload,
  Download,
  Trash2,
  CheckCircle2,
  Clock,
  AlertCircle,
  Plus,
  FolderOpen,
  Shield,
  Search,
  X,
  CreditCard,
  GraduationCap,
  Briefcase,
  Heart,
  FileQuestion,
  MoreHorizontal,
  Calendar,
  ExternalLink,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Skeleton } from '@/components/ui/Skeleton';
import {
  useStaffDocuments,
  useUploadDocument,
  useDeleteDocument,
  useVerifyDocument,
  DOCUMENT_CATEGORIES,
  DOCUMENT_TYPES,
  formatFileSize,
  type StaffDocument,
  type DocumentCategory,
} from '@/api/documents';
import { usePermission } from '@/hooks/usePermission';
import { cn } from '@/utils/cn';
import { toast } from 'sonner';

interface DocumentManagerProps {
  staffId: string;
  staffName: string;
  isOwnProfile?: boolean;
}

const CATEGORY_ICONS: Record<DocumentCategory, typeof CreditCard> = {
  identity: CreditCard,
  education: GraduationCap,
  employment: Briefcase,
  medical: Heart,
  other: FileQuestion,
};

const CATEGORY_COLORS: Record<DocumentCategory, { bg: string; text: string; light: string }> = {
  identity: { bg: 'bg-blue-500', text: 'text-blue-600', light: 'bg-blue-50 dark:bg-blue-900/20' },
  education: { bg: 'bg-purple-500', text: 'text-purple-600', light: 'bg-purple-50 dark:bg-purple-900/20' },
  employment: { bg: 'bg-green-500', text: 'text-green-600', light: 'bg-green-50 dark:bg-green-900/20' },
  medical: { bg: 'bg-red-500', text: 'text-red-600', light: 'bg-red-50 dark:bg-red-900/20' },
  other: { bg: 'bg-gray-500', text: 'text-gray-600', light: 'bg-gray-50 dark:bg-gray-800' },
};

function getFileIcon(mimeType: string) {
  if (mimeType === 'application/pdf') return FileText;
  if (mimeType.startsWith('image/')) return Image;
  if (mimeType.includes('word')) return FileText;
  return File;
}

export function DocumentManager({ staffId, staffName, isOwnProfile }: DocumentManagerProps) {
  const perm = usePermission();
  const [selectedCategory, setSelectedCategory] = useState<DocumentCategory | null>(null);
  const [showUpload, setShowUpload] = useState(false);
  const [deleteDoc, setDeleteDoc] = useState<StaffDocument | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showMobileActions, setShowMobileActions] = useState<string | null>(null);

  const canManage = perm.isCEO || perm.isManager || !!isOwnProfile;
  const canVerify = perm.isCEO || perm.isManager;

  const { data, isLoading } = useStaffDocuments(staffId);
  const deleteDocument = useDeleteDocument();

  const documents = data?.data ?? [];

  const documentsByCategory = useMemo(() => {
    const grouped: Record<string, StaffDocument[]> = {};
    for (const cat of DOCUMENT_CATEGORIES) {
      grouped[cat.value] = documents.filter((d) => d.category === cat.value);
    }
    return grouped;
  }, [documents]);

  const filteredDocs = useMemo(() => {
    let docs = selectedCategory ? documentsByCategory[selectedCategory] || [] : documents;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      docs = docs.filter(
        (d) =>
          d.title.toLowerCase().includes(q) ||
          d.documentType.toLowerCase().includes(q) ||
          d.category.toLowerCase().includes(q)
      );
    }
    return docs;
  }, [documents, documentsByCategory, selectedCategory, searchQuery]);

  const handleDelete = async () => {
    if (!deleteDoc) return;
    try {
      await deleteDocument.mutateAsync({ staffId, docId: deleteDoc.id });
      toast.success('Document deleted');
      setDeleteDoc(null);
    } catch {
      toast.error('Failed to delete document');
    }
  };

  const categorySummary = DOCUMENT_CATEGORIES.map((cat) => ({
    ...cat,
    count: documentsByCategory[cat.value]?.length || 0,
    Icon: CATEGORY_ICONS[cat.value],
    colors: CATEGORY_COLORS[cat.value],
  }));

  const totalDocs = documents.length;

  const openDocumentViewer = useCallback((doc: StaffDocument) => {
    const path = `/staff/${staffId}/documents/${doc.id}`;
    window.open(path, '_blank', 'noopener,noreferrer');
  }, [staffId]);

  if (isLoading) {
    return (
      <div className="space-y-4 sm:space-y-6">
        {/* Mobile: Horizontal scroll categories */}
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-xl sm:h-24" />
          ))}
        </div>
        <div className="space-y-2 sm:space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20 sm:h-24 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Category filters — responsive grid (no horizontal scroll) */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5 lg:gap-3">
        {categorySummary.map((cat) => {
          const isSelected = selectedCategory === cat.value;
          return (
            <button
              key={cat.value}
              onClick={() => setSelectedCategory(isSelected ? null : cat.value)}
              className={cn(
                'relative flex min-h-[76px] flex-col items-center justify-center gap-1 rounded-xl border p-3 transition-all',
                'w-full active:scale-[0.98] touch-manipulation sm:min-h-[84px]',
                isSelected
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 ring-2 ring-blue-500/50'
                  : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600'
              )}
            >
              <div className={cn('rounded-lg p-1.5 sm:p-2', cat.colors.bg)}>
                <cat.Icon className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
              </div>
              <div className="text-center">
                <p className="text-[10px] sm:text-xs font-medium text-gray-500 dark:text-gray-400 leading-tight">
                  {cat.label.split(' ')[0]}
                </p>
                <p className="text-base sm:text-lg font-bold text-gray-900 dark:text-gray-100 leading-tight">
                  {cat.count}
                </p>
              </div>
              {isSelected && (
                <div className="absolute -top-1 -right-1 bg-blue-500 rounded-full p-0.5">
                  <X className="h-3 w-3 text-white" />
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Search and Actions Bar */}
      <div className="flex flex-col gap-3">
        {/* Search row */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search documents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={cn(
              'w-full pl-10 pr-10 py-3 sm:py-2.5 text-base sm:text-sm rounded-xl border',
              'border-gray-200 dark:border-gray-700',
              'bg-white dark:bg-gray-800',
              'text-gray-900 dark:text-gray-100',
              'placeholder:text-gray-400',
              'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
              'transition-shadow'
            )}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg active:scale-95"
            >
              <X className="h-4 w-4 text-gray-400" />
            </button>
          )}
        </div>

        {/* Filter info and upload button */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            {selectedCategory ? (
              <button
                onClick={() => setSelectedCategory(null)}
                className={cn(
                  'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors',
                  CATEGORY_COLORS[selectedCategory].light,
                  CATEGORY_COLORS[selectedCategory].text
                )}
              >
                {DOCUMENT_CATEGORIES.find((c) => c.value === selectedCategory)?.label}
                <X className="h-3 w-3" />
              </button>
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {totalDocs === 0 ? 'No documents' : `${totalDocs} document${totalDocs !== 1 ? 's' : ''}`}
              </p>
            )}
          </div>
          {canManage && (
            <Button
              size="sm"
              onClick={() => setShowUpload(true)}
              className="flex-shrink-0 h-10 sm:h-9 px-4 sm:px-3 rounded-xl sm:rounded-lg"
            >
              <Plus className="h-4 w-4 sm:mr-1.5" />
              <span className="hidden sm:inline">Upload</span>
            </Button>
          )}
        </div>
      </div>

      {/* Document List */}
      {filteredDocs.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-10 sm:py-12">
            <div className="flex flex-col items-center text-center px-4">
              <div className="rounded-full bg-gray-100 dark:bg-gray-800 p-4 sm:p-5 mb-4">
                <FolderOpen className="h-8 w-8 sm:h-10 sm:w-10 text-gray-400" />
              </div>
              <h3 className="font-semibold text-base sm:text-lg text-gray-900 dark:text-gray-100 mb-1">
                {searchQuery
                  ? 'No documents found'
                  : selectedCategory
                  ? `No ${DOCUMENT_CATEGORIES.find((c) => c.value === selectedCategory)?.label.toLowerCase()}`
                  : 'No documents yet'}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-5 max-w-[280px]">
                {searchQuery
                  ? 'Try a different search term'
                  : 'Upload identity documents, educational certificates, CV and more'}
              </p>
              {canManage && !searchQuery && (
                <Button onClick={() => setShowUpload(true)} className="h-11 px-6 rounded-xl">
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Document
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2 sm:space-y-3">
          {filteredDocs.map((doc) => (
            <DocumentCard
              key={doc.id}
              document={doc}
              canManage={canManage}
              canVerify={canVerify ?? false}
              onOpenViewer={() => openDocumentViewer(doc)}
              onDelete={() => setDeleteDoc(doc)}
              staffId={staffId}
              showMobileActions={showMobileActions === doc.id}
              onToggleMobileActions={() =>
                setShowMobileActions(showMobileActions === doc.id ? null : doc.id)
              }
            />
          ))}
        </div>
      )}

      {/* Results count */}
      {totalDocs > 0 && filteredDocs.length !== totalDocs && (
        <p className="text-center text-xs text-gray-400 py-2">
          Showing {filteredDocs.length} of {totalDocs} documents
        </p>
      )}

      {/* Upload Modal */}
      {showUpload && (
        <UploadModal staffId={staffId} staffName={staffName} onClose={() => setShowUpload(false)} />
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteDoc}
        onClose={() => setDeleteDoc(null)}
        title="Delete Document"
        message={`Are you sure you want to delete "${deleteDoc?.title}"? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
        isLoading={deleteDocument.isPending}
        onConfirm={handleDelete}
      />
    </div>
  );
}

interface DocumentCardProps {
  document: StaffDocument;
  canManage: boolean;
  canVerify: boolean;
  onOpenViewer: () => void;
  onDelete: () => void;
  staffId: string;
  showMobileActions: boolean;
  onToggleMobileActions: () => void;
}

function DocumentCard({
  document: doc,
  canManage,
  canVerify,
  onOpenViewer,
  onDelete,
  staffId,
  showMobileActions,
  onToggleMobileActions,
}: DocumentCardProps) {
  const Icon = getFileIcon(doc.mimeType);
  const verifyDocument = useVerifyDocument();
  const CategoryIcon = CATEGORY_ICONS[doc.category as DocumentCategory] || FileQuestion;
  const categoryColors = CATEGORY_COLORS[doc.category as DocumentCategory] || CATEGORY_COLORS.other;

  const isExpired = doc.expiryDate && new Date(doc.expiryDate) < new Date();
  const isExpiringSoon =
    doc.expiryDate &&
    !isExpired &&
    new Date(doc.expiryDate) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  const handleVerify = async () => {
    try {
      await verifyDocument.mutateAsync({ staffId, docId: doc.id });
      toast.success('Document verified');
    } catch {
      toast.error('Failed to verify document');
    }
  };

  const statusBadge = doc.isVerified ? (
    <Badge variant="success" size="sm" className="gap-1">
      <CheckCircle2 className="h-3 w-3" />
      <span className="hidden xs:inline">Verified</span>
    </Badge>
  ) : isExpired ? (
    <Badge variant="danger" size="sm" className="gap-1">
      <AlertCircle className="h-3 w-3" />
      <span className="hidden xs:inline">Expired</span>
    </Badge>
  ) : isExpiringSoon ? (
    <Badge variant="warning" size="sm" className="gap-1">
      <Clock className="h-3 w-3" />
      <span className="hidden xs:inline">Expiring</span>
    </Badge>
  ) : null;

  return (
    <div
      className={cn(
        'group relative rounded-xl border transition-all overflow-hidden',
        'bg-white dark:bg-gray-800',
        'border-gray-200 dark:border-gray-700',
        'hover:shadow-lg hover:border-gray-300 dark:hover:border-gray-600',
        'active:scale-[0.99] touch-manipulation'
      )}
    >
      <div className="flex items-stretch">
        {/* Thumbnail - Clickable for preview */}
        <button
          type="button"
          onClick={onOpenViewer}
          className={cn(
            'relative flex-shrink-0 w-16 sm:w-20 flex items-center justify-center overflow-hidden',
            'border-r border-gray-100 dark:border-gray-700',
            doc.mimeType.startsWith('image/')
              ? 'bg-gray-100 dark:bg-gray-700'
              : doc.mimeType === 'application/pdf'
              ? 'bg-red-50 dark:bg-red-900/20'
              : 'bg-blue-50 dark:bg-blue-900/20'
          )}
        >
          {doc.mimeType.startsWith('image/') ? (
            <img src={doc.fileUrl} alt={doc.title} className="w-full h-full object-cover min-h-[80px]" />
          ) : (
            <Icon
              className={cn(
                'h-6 w-6 sm:h-8 sm:w-8',
                doc.mimeType === 'application/pdf' ? 'text-red-500' : 'text-blue-500'
              )}
            />
          )}
          {/* Category badge on thumbnail */}
          <div
            className={cn(
              'absolute bottom-1 right-1 rounded-md p-1',
              categoryColors.bg,
              'shadow-sm'
            )}
          >
            <CategoryIcon className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-white" />
          </div>
        </button>

        {/* Content */}
        <div className="flex-1 min-w-0 p-3 sm:p-4">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <h4 className="font-medium text-sm sm:text-base text-gray-900 dark:text-gray-100 truncate pr-2">
                {doc.title}
              </h4>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                {DOCUMENT_TYPES[doc.category as DocumentCategory]?.find(
                  (t) => t.value === doc.documentType
                )?.label || doc.documentType}
              </p>
            </div>
            {statusBadge}
          </div>

          {/* Meta info */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-xs text-gray-400">
            <span>{formatFileSize(doc.fileSize)}</span>
            <span className="hidden sm:inline">·</span>
            <span className="hidden sm:inline">
              {new Date(doc.createdAt).toLocaleDateString('en-GB', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })}
            </span>
            {doc.expiryDate && (
              <>
                <span className="hidden sm:inline">·</span>
                <span className={cn('hidden sm:flex items-center gap-1', isExpired && 'text-red-500')}>
                  <Calendar className="h-3 w-3" />
                  {isExpired ? 'Expired' : 'Expires'}{' '}
                  {new Date(doc.expiryDate).toLocaleDateString('en-GB', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </span>
              </>
            )}
          </div>

          {/* Desktop Actions */}
          <div className="hidden sm:flex items-center gap-1.5 mt-3 pt-3 border-t border-gray-100 dark:border-gray-700/50">
            <Button variant="ghost" size="sm" onClick={onOpenViewer} className="h-8 text-xs">
              <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
              Open
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.open(doc.fileUrl, '_blank')}
              className="h-8 text-xs"
            >
              <Download className="h-3.5 w-3.5 mr-1.5" />
              Download
            </Button>
            {canVerify && !doc.isVerified && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleVerify}
                isLoading={verifyDocument.isPending}
                className="h-8 text-xs text-green-600 hover:text-green-700 dark:text-green-400"
              >
                <Shield className="h-3.5 w-3.5 mr-1.5" />
                Verify
              </Button>
            )}
            {canManage && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onDelete}
                className="h-8 text-xs text-red-500 hover:text-red-600 ml-auto"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </div>

        {/* Mobile action button */}
        <div className="sm:hidden flex items-center pr-2">
          <button
            onClick={onToggleMobileActions}
            className="p-3 -mr-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 active:bg-gray-100 dark:active:bg-gray-700 rounded-lg"
          >
            <MoreHorizontal className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Mobile Actions Drawer */}
      {showMobileActions && (
        <div className="sm:hidden border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 p-2 animate-in slide-in-from-top-2 duration-200">
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                onOpenViewer();
                onToggleMobileActions();
              }}
              className="flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-700 active:scale-95 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
            >
              <ExternalLink className="h-4 w-4" />
              Open page
            </button>
            <button
              type="button"
              onClick={() => window.open(doc.fileUrl, '_blank', 'noopener,noreferrer')}
              className="flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-700 active:scale-95 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
            >
              <Download className="h-4 w-4" />
              Raw file
            </button>
            {canVerify && !doc.isVerified && (
              <button
                onClick={() => {
                  handleVerify();
                  onToggleMobileActions();
                }}
                disabled={verifyDocument.isPending}
                className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-sm font-medium text-green-700 dark:text-green-400 active:scale-95 disabled:opacity-50"
              >
                <Shield className="h-4 w-4" />
                Verify
              </button>
            )}
            {canManage && (
              <button
                onClick={() => {
                  onDelete();
                  onToggleMobileActions();
                }}
                className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-sm font-medium text-red-600 dark:text-red-400 active:scale-95"
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

interface UploadModalProps {
  staffId: string;
  staffName: string;
  onClose: () => void;
}

function UploadModal({ staffId, staffName, onClose }: UploadModalProps) {
  const uploadDocument = useUploadDocument();
  const [file, setFile] = useState<File | null>(null);
  const [category, setCategory] = useState<DocumentCategory>('identity');
  const [documentType, setDocumentType] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [issueDate, setIssueDate] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [dragActive, setDragActive] = useState(false);

  const documentTypeOptions = useMemo(() => DOCUMENT_TYPES[category] || [], [category]);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragActive(false);
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile) {
        setFile(droppedFile);
        if (!title) {
          setTitle(droppedFile.name.replace(/\.[^/.]+$/, ''));
        }
      }
    },
    [title]
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      if (!title) {
        setTitle(selectedFile.name.replace(/\.[^/.]+$/, ''));
      }
    }
  };

  const handleUpload = async () => {
    if (!file || !title || !documentType) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      await uploadDocument.mutateAsync({
        staffId,
        file,
        category,
        documentType,
        title,
        description: description || undefined,
        issueDate: issueDate ? new Date(issueDate).toISOString() : undefined,
        expiryDate: expiryDate ? new Date(expiryDate).toISOString() : undefined,
      });
      toast.success('Document uploaded successfully');
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to upload document');
    }
  };

  return (
    <Modal
      isOpen
      onClose={onClose}
      title="Upload Document"
      description={`Add a document for ${staffName}`}
      size="lg"
      footer={
        <div className="flex gap-2 w-full">
          <Button variant="ghost" onClick={onClose} className="flex-1 h-12 sm:h-10 sm:flex-none rounded-xl sm:rounded-lg">
            Cancel
          </Button>
          <Button
            onClick={handleUpload}
            isLoading={uploadDocument.isPending}
            disabled={!file || !documentType || !title}
            className="flex-1 h-12 sm:h-10 sm:flex-none rounded-xl sm:rounded-lg"
          >
            <Upload className="h-4 w-4 mr-2" />
            Upload
          </Button>
        </div>
      }
    >
      <div className="space-y-5">
        {/* Drop zone */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragActive(true);
          }}
          onDragLeave={() => setDragActive(false)}
          onDrop={handleDrop}
          className={cn(
            'relative border-2 border-dashed rounded-2xl p-5 sm:p-6 text-center transition-all',
            dragActive
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 scale-[1.02]'
              : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
          )}
        >
          {file ? (
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center overflow-hidden flex-shrink-0">
                {file.type.startsWith('image/') ? (
                  <img src={URL.createObjectURL(file)} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <FileText className="h-7 w-7 sm:h-8 sm:w-8 text-gray-400" />
                )}
              </div>
              <div className="flex-1 text-left min-w-0">
                <p className="font-medium text-sm sm:text-base text-gray-900 dark:text-gray-100 truncate">
                  {file.name}
                </p>
                <p className="text-xs sm:text-sm text-gray-500 mt-0.5">{formatFileSize(file.size)}</p>
              </div>
              <button
                onClick={() => setFile(null)}
                className="p-2.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg flex-shrink-0 active:scale-95"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          ) : (
            <label className="cursor-pointer block">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-3">
                <Upload className="h-6 w-6 sm:h-7 sm:w-7 text-gray-400" />
              </div>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-1">
                <span className="text-blue-600 font-semibold">Tap to select</span>
                <span className="hidden sm:inline"> or drag and drop</span>
              </p>
              <p className="text-xs text-gray-400">PDF, Images, Word documents · Max 10MB</p>
              <input
                type="file"
                className="hidden"
                accept=".pdf,.jpg,.jpeg,.png,.gif,.webp,.doc,.docx"
                onChange={handleFileChange}
              />
            </label>
          )}
        </div>

        {/* Category Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Document Category
          </label>
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
            {DOCUMENT_CATEGORIES.map((cat) => {
              const Icon = CATEGORY_ICONS[cat.value];
              const colors = CATEGORY_COLORS[cat.value];
              const isSelected = category === cat.value;
              return (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => {
                    setCategory(cat.value);
                    setDocumentType('');
                  }}
                  className={cn(
                    'flex flex-col items-center gap-1.5 p-3 rounded-xl border text-center transition-all flex-shrink-0',
                    'min-w-[72px] active:scale-95',
                    isSelected
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 ring-2 ring-blue-500/50'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 bg-white dark:bg-gray-800'
                  )}
                >
                  <div className={cn('rounded-lg p-2', colors.bg)}>
                    <Icon className="h-4 w-4 text-white" />
                  </div>
                  <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                    {cat.label.split(' ')[0]}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Document Type */}
        <Select
          label="Document Type"
          value={documentType}
          onChange={(e) => setDocumentType(e.target.value)}
          options={[{ label: 'Select type...', value: '' }, ...documentTypeOptions]}
        />

        {/* Title */}
        <Input
          label="Document Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g., Passport - John Doe"
        />

        {/* Description */}
        <Textarea
          label="Description (optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Additional notes about this document"
          rows={2}
        />

        {/* Dates */}
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Issue Date"
            type="date"
            value={issueDate}
            onChange={(e) => setIssueDate(e.target.value)}
          />
          <Input
            label="Expiry Date"
            type="date"
            value={expiryDate}
            onChange={(e) => setExpiryDate(e.target.value)}
          />
        </div>
      </div>
    </Modal>
  );
}
