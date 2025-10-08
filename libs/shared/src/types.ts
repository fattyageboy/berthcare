// Shared TypeScript types and interfaces
// To be expanded during implementation

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'nurse' | 'coordinator' | 'admin';
  zoneId?: string;
}

export interface Client {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  address: string;
  zoneId: string;
}

export interface Visit {
  id: string;
  clientId: string;
  staffId: string;
  scheduledStartTime: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
}
