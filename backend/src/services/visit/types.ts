/**
 * Visit Service Types and Interfaces
 * Defines all TypeScript types for visit management
 */

// Visit status enum matching database
export enum VisitStatus {
  SCHEDULED = 'scheduled',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  MISSED = 'missed',
  CANCELLED = 'cancelled',
}

// Visit type enum matching database
export enum VisitType {
  PERSONAL_CARE = 'personal_care',
  MEDICATION = 'medication',
  ASSESSMENT = 'assessment',
  COMPANIONSHIP = 'companionship',
  RESPITE = 'respite',
  PALLIATIVE = 'palliative',
}

// Location data interface
export interface Location {
  latitude: number;
  longitude: number;
  accuracy?: number;
}

// Client address interface
export interface ClientAddress {
  street: string;
  city: string;
  province?: string;
  postal_code: string;
  latitude?: number;
  longitude?: number;
}

// Client information interface (nested in visit response)
export interface ClientInfo {
  id: string;
  first_name: string;
  last_name: string;
  address: ClientAddress;
}

// Care plan interface
export interface CarePlan {
  goals?: string[];
  interventions?: string[];
  restrictions?: string[];
  emergency_contacts?: Array<{
    name: string;
    relationship: string;
    phone: string;
  }>;
}

// Vital signs interface
export interface VitalSigns {
  blood_pressure?: string;
  heart_rate?: number;
  temperature?: number;
  oxygen_saturation?: number;
  respiratory_rate?: number;
  recorded_at: string;
}

// Visit documentation interface
export interface VisitDocumentation {
  vital_signs?: VitalSigns;
  activities_completed?: string[];
  observations?: string;
  care_plan_adherence?: 'full_compliance' | 'partial_compliance' | 'non_compliance';
  medications_administered?: Array<{
    medication_name: string;
    dosage: string;
    time_administered: string;
    notes?: string;
  }>;
  incident_reports?: Array<{
    type: string;
    description: string;
    actions_taken: string;
    reported_at: string;
  }>;
}

// Visit entity from database
export interface Visit {
  id: string;
  client_id: string;
  user_id: string;
  scheduled_start: string;
  scheduled_end: string;
  actual_start?: string | null;
  actual_end?: string | null;
  check_in_location?: string | null; // PostGIS POINT stored as string
  check_out_location?: string | null;
  visit_type: VisitType;
  status: VisitStatus;
  documentation?: VisitDocumentation | null;
  photos?: string[] | null;
  signature_url?: string | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;
  synced_at?: string | null;
}

// Visit with client information (for GET response)
export interface VisitWithClient extends Visit {
  client: ClientInfo;
}

// GET /visits query parameters
export interface GetVisitsQuery {
  date_from: string;
  date_to: string;
  status?: string; // comma-separated status values
  client_id?: string;
  page?: number;
  per_page?: number;
}

// GET /visits response
export interface GetVisitsResponse {
  visits: VisitWithClient[];
  total_count: number;
  pagination: {
    page: number;
    per_page: number;
    has_next: boolean;
  };
}

// POST /visits/:id/check-in request body
export interface CheckInRequest {
  location: Location;
  timestamp: string;
}

// POST /visits/:id/check-in response
export interface CheckInResponse {
  visit_id: string;
  checked_in_at: string;
  location_verified: boolean;
  status: VisitStatus;
  verification_details?: {
    distance: number;
    allowed_radius: number;
    area_type: 'urban' | 'rural';
  };
}

// PUT /visits/:id/documentation request body
export interface UpdateDocumentationRequest {
  documentation?: VisitDocumentation;
  notes?: string;
  photos?: string[];
}

// PUT /visits/:id/documentation response
export interface UpdateDocumentationResponse {
  visit_id: string;
  documentation_updated_at: string;
  validation_status: 'valid' | 'invalid' | 'pending';
  sync_status: 'synced' | 'pending' | 'failed';
}

// POST /visits/:id/complete request body
export interface CompleteVisitRequest {
  location?: Location;
  timestamp: string;
  signature_url?: string;
}

// POST /visits/:id/complete response
export interface CompleteVisitResponse {
  visit_id: string;
  completed_at: string;
  status: VisitStatus;
  duration_minutes: number;
}

// Database row type for visits table
export interface VisitRow {
  id: string;
  client_id: string;
  user_id: string;
  scheduled_start: Date;
  scheduled_end: Date;
  actual_start: Date | null;
  actual_end: Date | null;
  check_in_location: string | null;
  check_out_location: string | null;
  visit_type: string;
  status: string;
  documentation: object | null;
  photos: string[] | null;
  signature_url: string | null;
  notes: string | null;
  created_at: Date;
  updated_at: Date;
  synced_at: Date | null;
}

// Database row type for clients table (for JOIN operations)
export interface ClientRow {
  id: string;
  first_name: string;
  last_name: string;
  date_of_birth: Date;
  address_street: string;
  address_city: string;
  address_province: string;
  address_postal_code: string;
  address_latitude: number | null;
  address_longitude: number | null;
}
