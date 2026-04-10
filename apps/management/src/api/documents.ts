import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from './client';
import type { PaginatedResponse } from '@/types/api';

export interface StaffDocument {
  id: string;
  staffMemberId: string;
  category: DocumentCategory;
  documentType: string;
  title: string;
  description?: string | null;
  fileName: string;
  fileSize: number;
  mimeType: string;
  fileUrl: string;
  thumbnailUrl?: string | null;
  issueDate?: string | null;
  expiryDate?: string | null;
  isVerified: boolean;
  verifiedBy?: string | null;
  verifiedAt?: string | null;
  uploadedBy: string;
  createdAt: string;
  updatedAt: string;
}

export type DocumentCategory = 'identity' | 'education' | 'employment' | 'medical' | 'other';

export const DOCUMENT_CATEGORIES: { value: DocumentCategory; label: string; description: string }[] = [
  { value: 'identity', label: 'Identity Documents', description: 'Passport, NID, Driving License, etc.' },
  { value: 'education', label: 'Educational Qualifications', description: 'Degrees, Certificates, Transcripts' },
  { value: 'employment', label: 'Employment Documents', description: 'CV, Contracts, Experience Letters' },
  { value: 'medical', label: 'Medical Records', description: 'Medical certificates, Vaccination records' },
  { value: 'other', label: 'Other Documents', description: 'Miscellaneous documents' },
];

export const DOCUMENT_TYPES: Record<DocumentCategory, { value: string; label: string }[]> = {
  identity: [
    { value: 'passport', label: 'Passport' },
    { value: 'nid', label: 'National ID (NID)' },
    { value: 'driving_license', label: 'Driving License' },
    { value: 'birth_certificate', label: 'Birth Certificate' },
    { value: 'voter_id', label: 'Voter ID' },
  ],
  education: [
    { value: 'degree', label: 'Degree Certificate' },
    { value: 'certificate', label: 'Course Certificate' },
    { value: 'transcript', label: 'Academic Transcript' },
    { value: 'diploma', label: 'Diploma' },
  ],
  employment: [
    { value: 'cv', label: 'CV / Resume' },
    { value: 'resume', label: 'Resume' },
    { value: 'contract', label: 'Employment Contract' },
    { value: 'offer_letter', label: 'Offer Letter' },
    { value: 'experience_letter', label: 'Experience Letter' },
    { value: 'reference_letter', label: 'Reference Letter' },
  ],
  medical: [
    { value: 'medical_certificate', label: 'Medical Certificate' },
    { value: 'fitness_certificate', label: 'Fitness Certificate' },
    { value: 'vaccination_record', label: 'Vaccination Record' },
  ],
  other: [
    { value: 'other', label: 'Other Document' },
  ],
};

export function useStaffDocuments(staffId: string | undefined, category?: DocumentCategory) {
  return useQuery<PaginatedResponse<StaffDocument>>({
    queryKey: ['staff-documents', staffId, category],
    queryFn: async () => {
      const params: Record<string, string> = { limit: '100' };
      if (category) params.category = category;
      const { data } = await api.get(`/staff/members/${staffId}/documents`, { params });
      return data;
    },
    enabled: !!staffId,
  });
}

export interface UploadDocumentInput {
  staffId: string;
  file: File;
  category: DocumentCategory;
  documentType: string;
  title: string;
  description?: string;
  issueDate?: string;
  expiryDate?: string;
}

export function useUploadDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: UploadDocumentInput) => {
      const formData = new FormData();
      formData.append('file', input.file);
      formData.append('category', input.category);
      formData.append('documentType', input.documentType);
      formData.append('title', input.title);
      if (input.description) formData.append('description', input.description);
      if (input.issueDate) formData.append('issueDate', input.issueDate);
      if (input.expiryDate) formData.append('expiryDate', input.expiryDate);

      const { data } = await api.post(`/staff/members/${input.staffId}/documents`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return data;
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ['staff-documents', variables.staffId] });
    },
  });
}

export interface UpdateDocumentInput {
  staffId: string;
  docId: string;
  title?: string;
  description?: string;
  issueDate?: string;
  expiryDate?: string;
}

export function useUpdateDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ staffId, docId, ...body }: UpdateDocumentInput) => {
      const { data } = await api.put(`/staff/members/${staffId}/documents/${docId}`, body);
      return data;
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ['staff-documents', variables.staffId] });
    },
  });
}

export function useVerifyDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ staffId, docId }: { staffId: string; docId: string }) => {
      const { data } = await api.put(`/staff/members/${staffId}/documents/${docId}/verify`);
      return data;
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ['staff-documents', variables.staffId] });
    },
  });
}

export function useDeleteDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ staffId, docId }: { staffId: string; docId: string }) => {
      const { data } = await api.delete(`/staff/members/${staffId}/documents/${docId}`);
      return data;
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ['staff-documents', variables.staffId] });
    },
  });
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

export function getFileIcon(mimeType: string): 'pdf' | 'image' | 'doc' | 'file' {
  if (mimeType === 'application/pdf') return 'pdf';
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.includes('word') || mimeType.includes('document')) return 'doc';
  return 'file';
}

export function isPreviewable(mimeType: string): boolean {
  return mimeType === 'application/pdf' || mimeType.startsWith('image/');
}
