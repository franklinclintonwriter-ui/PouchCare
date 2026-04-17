import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from './client'

export interface FileItem {
  name: string
  path: string
  isFolder: boolean
  size: number
  mimeType: string | null
  icon: string
  createdAt: string | null
  updatedAt: string | null
}

export function useFileList(path: string) {
  return useQuery<{ path: string; items: FileItem[] }>({
    queryKey: ['file-manager', path],
    queryFn: async () => {
      const { data } = await api.get('/file-manager/files', { params: { path } })
      return data as { path: string; items: FileItem[] }
    },
  })
}

export function useCreateFolder() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (path: string) => {
      const { data } = await api.post('/file-manager/files/folder', { path })
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['file-manager'] }),
  })
}

export function useUploadFiles() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ files, path }: { files: File[]; path: string }) => {
      const form = new FormData()
      form.append('path', path)
      files.forEach((f) => form.append('files', f))
      const { data } = await api.post('/file-manager/files/upload', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 120000,
      })
      return data as { uploaded: number }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['file-manager'] }),
  })
}

export function useDeleteFile() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (path: string) => {
      await api.delete('/file-manager/files', { params: { path } })
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['file-manager'] }),
  })
}

export function useDownloadFile() {
  return useMutation({
    mutationFn: async (path: string) => {
      const { data } = await api.get('/file-manager/files/download', { params: { path } })
      return data as { url: string; path: string }
    },
  })
}

export function useMoveFile() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ from, to }: { from: string; to: string }) => {
      await api.post('/file-manager/files/move', { from, to })
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['file-manager'] }),
  })
}
