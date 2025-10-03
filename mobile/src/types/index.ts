// Core type definitions for BerthCare Mobile

export interface User {
  id: string;
  auth0Id: string;
  email: string;
  name: string;
  role: 'nurse' | 'coordinator' | 'admin' | 'family';
  organizationId: string;
  isActive: boolean;
}

export interface Visit {
  id: string;
  clientId: string;
  nurseId: string;
  scheduledStart: string;
  scheduledEnd: string;
  actualStart?: string;
  actualEnd?: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  checkInLatitude?: number;
  checkInLongitude?: number;
  locationVerified: boolean;
  notes?: string;
}

export interface Photo {
  id: string;
  visitId: string;
  uploadedBy: string;
  s3Key: string;
  localUri?: string;
  fileSize: number;
  mimeType: string;
  createdAt: string;
}

export interface SyncState {
  lastSyncedAt: string;
  pendingChanges: number;
  isSyncing: boolean;
}

export interface ApiError {
  success: false;
  error: string;
  message: string;
  errors?: Array<{ field: string; message: string }>;
}

export interface ApiResponse<T> {
  success: true;
  message: string;
  data: T;
}
