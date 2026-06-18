import { useState, useCallback, useMemo, useRef } from 'react'
import { useHeaderConfig } from '@/hooks/useHeaderConfig'
import { PageTransition } from '@/components/ui/PageTransition'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { useFileList, useCreateFolder, useUploadFiles, useDeleteFile, useDownloadFile, type FileItem } from '@/api/fileManager'
import {
  FolderOpen, File, Upload, FolderPlus, Trash2, Download, ArrowLeft,
  FileText, Image, FileCode, FileSpreadsheet, Film, Music, Archive,
  ChevronRight, RefreshCw, HardDrive,
} from 'lucide-react'
import { cn } from '@/utils/cn'
import { toast } from 'sonner'

const ICON_MAP: Record<string, { icon: React.ReactNode; color: string }> = {
  folder: { icon: <FolderOpen className="h-5 w-5" />, color: 'text-cyan-500' },
  pdf: { icon: <FileText className="h-5 w-5" />, color: 'text-red-500' },
  doc: { icon: <FileText className="h-5 w-5" />, color: 'text-blue-500' },
  xls: { icon: <FileSpreadsheet className="h-5 w-5" />, color: 'text-emerald-500' },
  ppt: { icon: <FileText className="h-5 w-5" />, color: 'text-orange-500' },
  image: { icon: <Image className="h-5 w-5" />, color: 'text-violet-500' },
  video: { icon: <Film className="h-5 w-5" />, color: 'text-pink-500' },
  audio: { icon: <Music className="h-5 w-5" />, color: 'text-amber-500' },
  archive: { icon: <Archive className="h-5 w-5" />, color: 'text-yellow-600' },
  code: { icon: <FileCode className="h-5 w-5" />, color: 'text-cyan-400' },
  text: { icon: <FileText className="h-5 w-5" />, color: 'text-gray-500' },
  file: { icon: <File className="h-5 w-5" />, color: 'text-gray-400' },
}

function formatSize(bytes: number): string {
  if (bytes === 0) return '—'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1073741824) return `${(bytes / 1048576).toFixed(1)} MB`
  return `${(bytes / 1073741824).toFixed(1)} GB`
}

export default function FileManager() {
  const [currentPath, setCurrentPath] = useState('')
  const { data, isLoading, refetch } = useFileList(currentPath)
  const createFolder = useCreateFolder()
  const uploadFiles = useUploadFiles()
  const deleteFile = useDeleteFile()
  const downloadFile = useDownloadFile()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const items = data?.items ?? []
  const folders = items.filter((i) => i.isFolder)
  const files = items.filter((i) => !i.isFolder)

  const breadcrumbs = useMemo(() => {
    const parts = currentPath.split('/').filter(Boolean)
    return [{ label: 'My Files', path: '' }, ...parts.map((p, i) => ({ label: p, path: parts.slice(0, i + 1).join('/') }))]
  }, [currentPath])

  const navigateTo = useCallback((path: string) => setCurrentPath(path), [])

  const handleCreateFolder = useCallback(async () => {
    const name = prompt('Folder name:')
    if (!name?.trim()) return
    const path = currentPath ? `${currentPath}/${name.trim()}` : name.trim()
    try {
      await createFolder.mutateAsync(path)
      toast.success('Folder created')
    } catch { toast.error('Failed to create folder') }
  }, [currentPath, createFolder])

  const handleUpload = useCallback(async (fileList: FileList | null) => {
    if (!fileList?.length) return
    try {
      const result = await uploadFiles.mutateAsync({ files: Array.from(fileList), path: currentPath })
      toast.success(`Uploaded ${result.uploaded} file(s)`)
    } catch { toast.error('Upload failed') }
  }, [currentPath, uploadFiles])

  const handleDelete = useCallback(async (item: FileItem) => {
    if (!confirm(`Delete "${item.name}"?`)) return
    try {
      await deleteFile.mutateAsync(item.path)
      toast.success('Deleted')
    } catch { toast.error('Failed') }
  }, [deleteFile])

  const handleDownload = useCallback(async (item: FileItem) => {
    try {
      const result = await downloadFile.mutateAsync(item.path)
      window.open(result.url, '_blank')
    } catch { toast.error('Download failed') }
  }, [downloadFile])

  const headerConfig = useMemo(() => ({
    title: 'File Manager',
    breadcrumbs: [{ label: 'Home', href: '/' }, { label: 'Files' }],
    actions: [
      { type: 'button' as const, label: 'Upload', icon: Upload, variant: 'primary' as const, onClick: () => fileInputRef.current?.click() },
      { type: 'button' as const, label: 'New folder', icon: FolderPlus, variant: 'secondary' as const, onClick: handleCreateFolder },
      { type: 'button' as const, label: 'Refresh', icon: RefreshCw, variant: 'ghost' as const, onClick: () => refetch() },
    ],
  }), [handleCreateFolder, refetch])

  useHeaderConfig(headerConfig)

  return (
    <PageTransition>
      <div className="space-y-4">
        {/* Breadcrumb + view toggle */}
        <div className="flex items-center justify-between">
          <nav className="flex items-center gap-1 text-sm">
            {breadcrumbs.map((bc, i) => (
              <span key={bc.path} className="flex items-center gap-1">
                {i > 0 && <ChevronRight className="h-3 w-3 text-gray-400" />}
                <button
                  onClick={() => navigateTo(bc.path)}
                  className={cn('rounded px-1.5 py-0.5 transition', i === breadcrumbs.length - 1 ? 'font-semibold text-gray-900 dark:text-gray-100' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300')}
                >
                  {i === 0 ? <HardDrive className="inline h-3.5 w-3.5 mr-1" /> : null}
                  {bc.label}
                </button>
              </span>
            ))}
          </nav>
          <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
            <span>{folders.length} folders, {files.length} files</span>
          </div>
        </div>

        {/* Back button */}
        {currentPath && (
          <button
            onClick={() => {
              const parts = currentPath.split('/')
              parts.pop()
              navigateTo(parts.join('/'))
            }}
            className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm text-gray-600 transition hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </button>
        )}

        {/* File grid */}
        {isLoading ? (
          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-28 animate-pulse rounded-xl border border-gray-200 bg-gray-100 dark:border-gray-700 dark:bg-gray-800" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-300 py-20 text-center dark:border-gray-700">
            <FolderOpen className="h-16 w-16 text-gray-300 dark:text-gray-600" />
            <p className="mt-4 text-sm font-medium text-gray-900 dark:text-gray-100">This folder is empty</p>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Upload files or create a folder to get started.</p>
            <div className="mt-4 flex gap-2">
              <Button size="sm" onClick={() => fileInputRef.current?.click()} icon={<Upload className="h-3.5 w-3.5" />}>Upload</Button>
              <Button size="sm" variant="outline" onClick={handleCreateFolder} icon={<FolderPlus className="h-3.5 w-3.5" />}>New folder</Button>
            </div>
          </div>
        ) : (
          <>
            {/* Folders */}
            {folders.length > 0 && (
              <div>
                <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Folders</p>
                <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                  {folders.map((folder) => (
                    <button
                      key={folder.path}
                      onClick={() => navigateTo(folder.path)}
                      className="group flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-3 text-left transition hover:border-cyan-300 hover:shadow-sm dark:border-gray-700 dark:bg-gray-800/80 dark:hover:border-cyan-700"
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-cyan-50 text-cyan-500 dark:bg-cyan-900/30 dark:text-cyan-400">
                        <FolderOpen className="h-5 w-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">{folder.name}</p>
                        <p className="text-[10px] text-gray-500 dark:text-gray-400">Folder</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Files */}
            {files.length > 0 && (
              <div>
                <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Files</p>
                <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                  {files.map((file) => {
                    const iconInfo = ICON_MAP[file.icon] ?? ICON_MAP.file
                    return (
                      <Card key={file.path} className="group relative transition hover:shadow-sm">
                        <CardContent className="flex flex-col items-center gap-2 p-4 text-center">
                          <div className={cn('flex h-12 w-12 items-center justify-center rounded-xl bg-gray-50 dark:bg-gray-800', iconInfo.color)}>
                            {iconInfo.icon}
                          </div>
                          <p className="w-full truncate text-xs font-medium text-gray-900 dark:text-gray-100" title={file.name}>{file.name}</p>
                          <p className="text-[10px] text-gray-500 dark:text-gray-400">{formatSize(file.size)}</p>

                          <div className="absolute right-2 top-2 flex gap-0.5 opacity-0 transition group-hover:opacity-100">
                            <button onClick={() => handleDownload(file)} className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700" title="Download">
                              <Download className="h-3.5 w-3.5" />
                            </button>
                            <button onClick={() => handleDelete(file)} className="rounded-lg p-1 text-gray-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950/30" title="Delete">
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              </div>
            )}
          </>
        )}

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => { handleUpload(e.target.files); e.target.value = '' }}
        />
      </div>
    </PageTransition>
  )
}
