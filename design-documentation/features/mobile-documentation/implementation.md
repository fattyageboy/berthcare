# Implementation Guide - Mobile Point-of-Care Documentation

## Overview

This guide provides developers with complete implementation specifications for the Mobile Point-of-Care Documentation feature. It includes code examples, API specifications, database schemas, and integration guidelines for React Native (iOS/Android) and React (Web) platforms.

## Architecture Overview

### Technology Stack
- **Mobile:** React Native with Expo
- **Web:** React with Next.js
- **Backend:** Node.js with Express
- **Database:** PostgreSQL with offline SQLite synchronization
- **Authentication:** Auth0 with biometric support
- **File Storage:** AWS S3 for photos and documents
- **Real-time:** WebSocket connections for live updates

### Offline-First Architecture
```typescript
// Offline data management structure
interface OfflineDataManager {
  localDB: SQLite.Database;
  syncQueue: SyncOperation[];
  conflictResolver: ConflictResolver;
  encryptionService: EncryptionService;
}

interface SyncOperation {
  id: string;
  type: 'CREATE' | 'UPDATE' | 'DELETE';
  entity: 'visit' | 'patient' | 'photo';
  data: any;
  timestamp: Date;
  retryCount: number;
}
```

---

## Database Schema

### Core Entities

**Patients Table:**
```sql
CREATE TABLE patients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  external_id VARCHAR(50) UNIQUE NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  date_of_birth DATE NOT NULL,
  medical_record_number VARCHAR(50),
  primary_conditions TEXT[],
  allergies JSONB,
  medications JSONB,
  emergency_contact JSONB,
  address JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE,

  CONSTRAINT patients_age_check CHECK (date_of_birth < CURRENT_DATE)
);

CREATE INDEX idx_patients_external_id ON patients(external_id);
CREATE INDEX idx_patients_name ON patients(first_name, last_name);
CREATE INDEX idx_patients_active ON patients(deleted_at) WHERE deleted_at IS NULL;
```

**Visits Table:**
```sql
CREATE TABLE visits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(id),
  staff_id UUID NOT NULL REFERENCES users(id),
  scheduled_start TIMESTAMP WITH TIME ZONE NOT NULL,
  scheduled_end TIMESTAMP WITH TIME ZONE NOT NULL,
  actual_start TIMESTAMP WITH TIME ZONE,
  actual_end TIMESTAMP WITH TIME ZONE,
  check_in_location JSONB, -- GPS coordinates
  check_out_location JSONB,
  visit_type VARCHAR(50) NOT NULL,
  status visit_status DEFAULT 'scheduled',
  documentation JSONB,
  photos TEXT[], -- Array of S3 keys
  digital_signature TEXT, -- Base64 encoded signature
  sync_status sync_status DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  CONSTRAINT visits_times_check CHECK (
    (actual_start IS NULL OR actual_end IS NULL) OR
    actual_start < actual_end
  ),
  CONSTRAINT visits_scheduled_check CHECK (scheduled_start < scheduled_end)
);

-- Custom ENUM types
CREATE TYPE visit_status AS ENUM (
  'scheduled', 'in_progress', 'completed', 'cancelled', 'no_show'
);

CREATE TYPE sync_status AS ENUM (
  'pending', 'syncing', 'synced', 'error'
);

CREATE INDEX idx_visits_patient ON visits(patient_id);
CREATE INDEX idx_visits_staff ON visits(staff_id);
CREATE INDEX idx_visits_date ON visits(scheduled_start);
CREATE INDEX idx_visits_status ON visits(status);
CREATE INDEX idx_visits_sync ON visits(sync_status);
```

**Visit Documentation Schema:**
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "properties": {
    "vitals": {
      "type": "object",
      "properties": {
        "temperature": {
          "type": "object",
          "properties": {
            "value": { "type": "number", "minimum": 95, "maximum": 110 },
            "unit": { "type": "string", "enum": ["F", "C"] },
            "timestamp": { "type": "string", "format": "date-time" },
            "method": { "type": "string", "enum": ["oral", "axillary", "tympanic"] }
          },
          "required": ["value", "unit", "timestamp"]
        },
        "bloodPressure": {
          "type": "object",
          "properties": {
            "systolic": { "type": "number", "minimum": 70, "maximum": 250 },
            "diastolic": { "type": "number", "minimum": 40, "maximum": 150 },
            "timestamp": { "type": "string", "format": "date-time" },
            "position": { "type": "string", "enum": ["sitting", "lying", "standing"] }
          },
          "required": ["systolic", "diastolic", "timestamp"]
        },
        "pulse": {
          "type": "object",
          "properties": {
            "rate": { "type": "number", "minimum": 30, "maximum": 200 },
            "rhythm": { "type": "string", "enum": ["regular", "irregular"] },
            "timestamp": { "type": "string", "format": "date-time" }
          },
          "required": ["rate", "timestamp"]
        }
      }
    },
    "assessment": {
      "type": "object",
      "properties": {
        "mobility": {
          "type": "string",
          "enum": ["independent", "walker", "wheelchair", "bedbound"]
        },
        "skinIntegrity": {
          "type": "object",
          "properties": {
            "status": { "type": "string", "enum": ["intact", "at_risk", "breakdown"] },
            "notes": { "type": "string", "maxLength": 500 },
            "photos": { "type": "array", "items": { "type": "string" } }
          }
        },
        "painScale": {
          "type": "number",
          "minimum": 0,
          "maximum": 10
        }
      }
    },
    "medications": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "name": { "type": "string" },
          "dosage": { "type": "string" },
          "administered": { "type": "boolean" },
          "time": { "type": "string", "format": "date-time" },
          "notes": { "type": "string" }
        },
        "required": ["name", "administered"]
      }
    },
    "notes": {
      "type": "string",
      "maxLength": 2000
    },
    "familyPresent": {
      "type": "boolean"
    },
    "nextVisitNeeds": {
      "type": "string",
      "maxLength": 500
    }
  },
  "required": ["vitals"]
}
```

---

## API Specifications

### Authentication Endpoints

```typescript
interface AuthAPI {
  // Biometric authentication
  POST('/auth/biometric', {
    deviceId: string;
    biometricData: string; // Hashed biometric identifier
    userId: string;
  }): Promise<AuthResponse>;

  // Token refresh
  POST('/auth/refresh', {
    refreshToken: string;
  }): Promise<AuthResponse>;

  // Device registration
  POST('/auth/device/register', {
    deviceId: string;
    deviceInfo: DeviceInfo;
    userId: string;
  }): Promise<{ registered: boolean }>;
}

interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: UserProfile;
}

interface DeviceInfo {
  platform: 'ios' | 'android' | 'web';
  version: string;
  model: string;
  biometricCapability: boolean;
}
```

### Visit Management Endpoints

```typescript
interface VisitAPI {
  // Get daily schedule
  GET('/visits/schedule/{date}'): Promise<ScheduleResponse>;

  // Get patient details
  GET('/patients/{patientId}'): Promise<PatientResponse>;

  // Start visit
  POST('/visits/{visitId}/start', {
    location: GPSCoordinates;
    timestamp: Date;
  }): Promise<VisitResponse>;

  // Update visit documentation
  PUT('/visits/{visitId}/documentation', {
    documentation: VisitDocumentation;
    autoSave: boolean;
  }): Promise<{ saved: boolean; conflicts?: ConflictData[] }>;

  // Upload photos
  POST('/visits/{visitId}/photos', {
    photos: FormData; // Multipart upload
    descriptions: string[];
  }): Promise<PhotoUploadResponse>;

  // Complete visit
  POST('/visits/{visitId}/complete', {
    documentation: VisitDocumentation;
    digitalSignature: string;
    location: GPSCoordinates;
    timestamp: Date;
  }): Promise<CompletionResponse>;

  // Sync offline data
  POST('/sync/visits', {
    operations: SyncOperation[];
  }): Promise<SyncResponse>;
}

interface GPSCoordinates {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: Date;
}

interface ScheduleResponse {
  visits: ScheduledVisit[];
  lastSync: Date;
  hasUpdates: boolean;
}

interface ScheduledVisit {
  id: string;
  patientId: string;
  patientName: string;
  patientPhoto?: string;
  scheduledStart: Date;
  scheduledEnd: Date;
  address: Address;
  visitType: string;
  status: VisitStatus;
  distance?: number; // In meters
  estimatedTravelTime?: number; // In minutes
}
```

### Offline Sync Implementation

```typescript
class OfflineSyncManager {
  private localDB: SQLite.Database;
  private syncQueue: SyncOperation[] = [];
  private isOnline: boolean = false;
  private syncInProgress: boolean = false;

  constructor() {
    this.initializeLocalDB();
    this.setupNetworkListener();
    this.setupAutoSync();
  }

  private async initializeLocalDB(): Promise<void> {
    this.localDB = await SQLite.openDatabase('berthcare_offline.db');

    await this.localDB.execAsync(`
      CREATE TABLE IF NOT EXISTS offline_visits (
        id TEXT PRIMARY KEY,
        patient_id TEXT NOT NULL,
        documentation TEXT NOT NULL,
        photos TEXT,
        sync_status TEXT DEFAULT 'pending',
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS sync_operations (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL,
        entity_type TEXT NOT NULL,
        entity_id TEXT NOT NULL,
        data TEXT NOT NULL,
        timestamp INTEGER NOT NULL,
        retry_count INTEGER DEFAULT 0
      );
    `);
  }

  async saveVisitLocally(visitId: string, documentation: VisitDocumentation): Promise<void> {
    const timestamp = Date.now();

    await this.localDB.runAsync(
      `INSERT OR REPLACE INTO offline_visits
       (id, patient_id, documentation, sync_status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [visitId, documentation.patientId, JSON.stringify(documentation), 'pending', timestamp, timestamp]
    );

    this.addToSyncQueue({
      id: `visit_${visitId}_${timestamp}`,
      type: 'UPDATE',
      entity: 'visit',
      data: { visitId, documentation },
      timestamp: new Date(),
      retryCount: 0
    });

    if (this.isOnline) {
      this.syncData();
    }
  }

  async syncData(): Promise<void> {
    if (this.syncInProgress || !this.isOnline) return;

    this.syncInProgress = true;

    try {
      while (this.syncQueue.length > 0) {
        const operation = this.syncQueue[0];

        try {
          await this.syncOperation(operation);
          this.syncQueue.shift(); // Remove successful operation
        } catch (error) {
          operation.retryCount++;

          if (operation.retryCount >= 3) {
            // Move to error state, remove from queue
            this.handleSyncError(operation, error);
            this.syncQueue.shift();
          } else {
            // Retry later
            break;
          }
        }
      }
    } finally {
      this.syncInProgress = false;
    }
  }

  private async syncOperation(operation: SyncOperation): Promise<void> {
    switch (operation.type) {
      case 'UPDATE':
        if (operation.entity === 'visit') {
          await this.syncVisit(operation);
        }
        break;
      // Handle other operation types
    }
  }

  private async syncVisit(operation: SyncOperation): Promise<void> {
    const { visitId, documentation } = operation.data;

    const response = await fetch(`/api/visits/${visitId}/documentation`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${await this.getAccessToken()}`
      },
      body: JSON.stringify({ documentation, autoSave: false })
    });

    if (!response.ok) {
      throw new Error(`Sync failed: ${response.statusText}`);
    }

    const result = await response.json();

    if (result.conflicts) {
      // Handle merge conflicts
      await this.resolveConflicts(visitId, result.conflicts);
    }

    // Update local status
    await this.localDB.runAsync(
      'UPDATE offline_visits SET sync_status = ? WHERE id = ?',
      ['synced', visitId]
    );
  }
}
```

---

## React Native Implementation

### Main Components

**Visit Documentation Screen:**
```typescript
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  ScrollView,
  Text,
  Alert,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { VitalSignsInput } from '../components/VitalSignsInput';
import { AssessmentSection } from '../components/AssessmentSection';
import { MedicationSection } from '../components/MedicationSection';
import { PhotoCapture } from '../components/PhotoCapture';
import { DigitalSignature } from '../components/DigitalSignature';
import { PrimaryButton } from '../components/PrimaryButton';
import { ProgressIndicator } from '../components/ProgressIndicator';

import { useVisitDocumentation } from '../hooks/useVisitDocumentation';
import { useOfflineSync } from '../hooks/useOfflineSync';
import { useLocationServices } from '../hooks/useLocationServices';

interface VisitDocumentationScreenProps {
  route: {
    params: {
      visitId: string;
      patientId: string;
    };
  };
  navigation: any;
}

const VisitDocumentationScreen: React.FC<VisitDocumentationScreenProps> = ({
  route,
  navigation
}) => {
  const { visitId, patientId } = route.params;

  const {
    documentation,
    updateDocumentation,
    saveDocumentation,
    isLoading,
    validationErrors
  } = useVisitDocumentation(visitId);

  const { isOnline, syncStatus } = useOfflineSync();
  const { getCurrentLocation } = useLocationServices();

  const [currentSection, setCurrentSection] = useState(0);
  const [autoSaveTimer, setAutoSaveTimer] = useState<NodeJS.Timeout | null>(null);

  const sections = [
    'Vital Signs',
    'Assessment',
    'Medications',
    'Photos',
    'Review'
  ];

  // Auto-save functionality
  const debouncedSave = useCallback(() => {
    if (autoSaveTimer) {
      clearTimeout(autoSaveTimer);
    }

    const timer = setTimeout(() => {
      saveDocumentation(documentation, true); // Auto-save flag
    }, 2000);

    setAutoSaveTimer(timer);
  }, [documentation, saveDocumentation]);

  useEffect(() => {
    debouncedSave();
    return () => {
      if (autoSaveTimer) {
        clearTimeout(autoSaveTimer);
      }
    };
  }, [documentation, debouncedSave]);

  // Handle back navigation
  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        if (hasUnsavedChanges()) {
          Alert.alert(
            'Unsaved Changes',
            'You have unsaved changes. Save before leaving?',
            [
              { text: 'Discard', onPress: () => navigation.goBack() },
              { text: 'Save', onPress: handleSave }
            ]
          );
          return true;
        }
        return false;
      };

      navigation.addListener('beforeRemove', onBackPress);
      return () => navigation.removeListener('beforeRemove', onBackPress);
    }, [navigation, hasUnsavedChanges])
  );

  const handleSave = async () => {
    try {
      const location = await getCurrentLocation();
      await saveDocumentation(documentation, false, location);
      navigation.goBack();
    } catch (error) {
      Alert.alert('Save Failed', 'Unable to save documentation. Please try again.');
    }
  };

  const handleComplete = async () => {
    if (!isDocumentationComplete()) {
      Alert.alert(
        'Incomplete Documentation',
        'Please complete all required sections before finishing the visit.',
        [{ text: 'OK' }]
      );
      return;
    }

    try {
      const location = await getCurrentLocation();
      await completeVisit(visitId, documentation, location);

      Alert.alert(
        'Visit Complete',
        'Documentation has been saved successfully.',
        [{ text: 'Continue', onPress: () => navigation.navigate('Schedule') }]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to complete visit. Please try again.');
    }
  };

  const renderSection = () => {
    switch (currentSection) {
      case 0:
        return (
          <VitalSignsInput
            vitals={documentation.vitals}
            onUpdate={(vitals) => updateDocumentation({ vitals })}
            errors={validationErrors.vitals}
          />
        );
      case 1:
        return (
          <AssessmentSection
            assessment={documentation.assessment}
            onUpdate={(assessment) => updateDocumentation({ assessment })}
            errors={validationErrors.assessment}
          />
        );
      case 2:
        return (
          <MedicationSection
            medications={documentation.medications}
            onUpdate={(medications) => updateDocumentation({ medications })}
          />
        );
      case 3:
        return (
          <PhotoCapture
            visitId={visitId}
            photos={documentation.photos}
            onPhotosUpdate={(photos) => updateDocumentation({ photos })}
          />
        );
      case 4:
        return (
          <ReviewSection
            documentation={documentation}
            onSignature={(signature) => updateDocumentation({ digitalSignature: signature })}
          />
        );
      default:
        return null;
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.header}>
        <ProgressIndicator
          sections={sections}
          currentSection={currentSection}
          completedSections={getCompletedSections()}
        />

        <View style={styles.syncStatus}>
          <Text style={styles.syncText}>
            {isOnline ? '🟢 Online' : '🟠 Offline'}
          </Text>
          {syncStatus === 'syncing' && (
            <Text style={styles.syncText}>Syncing...</Text>
          )}
        </View>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        keyboardShouldPersistTaps="handled"
      >
        {renderSection()}
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.navigationButtons}>
          {currentSection > 0 && (
            <PrimaryButton
              title="Previous"
              onPress={() => setCurrentSection(currentSection - 1)}
              variant="secondary"
              style={styles.navButton}
            />
          )}

          {currentSection < sections.length - 1 ? (
            <PrimaryButton
              title="Next"
              onPress={() => setCurrentSection(currentSection + 1)}
              style={styles.navButton}
            />
          ) : (
            <PrimaryButton
              title="Complete Visit"
              onPress={handleComplete}
              style={styles.completeButton}
              loading={isLoading}
            />
          )}
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};
```

**Vital Signs Input Component:**
```typescript
import React, { useState } from 'react';
import { View, Text } from 'react-native';
import { VoiceInput } from './VoiceInput';
import { NumericInput } from './NumericInput';
import { ValidationMessage } from './ValidationMessage';

interface VitalSignsInputProps {
  vitals: VitalSigns;
  onUpdate: (vitals: VitalSigns) => void;
  errors?: ValidationErrors;
}

const VitalSignsInput: React.FC<VitalSignsInputProps> = ({
  vitals,
  onUpdate,
  errors
}) => {
  const [isVoiceActive, setIsVoiceActive] = useState(false);

  const handleVoiceInput = (transcript: string) => {
    const parsedVitals = parseVoiceVitals(transcript);
    if (parsedVitals) {
      onUpdate({ ...vitals, ...parsedVitals });
    }
  };

  const updateTemperature = (value: number) => {
    onUpdate({
      ...vitals,
      temperature: {
        ...vitals.temperature,
        value,
        timestamp: new Date(),
        unit: 'F'
      }
    });
  };

  const updateBloodPressure = (systolic: number, diastolic: number) => {
    onUpdate({
      ...vitals,
      bloodPressure: {
        ...vitals.bloodPressure,
        systolic,
        diastolic,
        timestamp: new Date()
      }
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Vital Signs</Text>

      <VoiceInput
        onTranscript={handleVoiceInput}
        isActive={isVoiceActive}
        onActiveChange={setIsVoiceActive}
        vocabulary="medical"
        placeholder="Say 'Temperature ninety-eight point six' or 'BP one-twenty over eighty'"
      />

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Temperature *</Text>
        <View style={styles.temperatureContainer}>
          <NumericInput
            value={vitals.temperature?.value}
            onChangeValue={updateTemperature}
            placeholder="98.6"
            min={95}
            max={110}
            step={0.1}
            unit="°F"
            style={[
              styles.input,
              errors?.temperature && styles.inputError
            ]}
          />
          {vitals.temperature?.value && (
            <VitalStatusIndicator
              value={vitals.temperature.value}
              type="temperature"
              style={styles.statusIndicator}
            />
          )}
        </View>
        <ValidationMessage message={errors?.temperature} />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Blood Pressure *</Text>
        <View style={styles.bpContainer}>
          <NumericInput
            value={vitals.bloodPressure?.systolic}
            onChangeValue={(systolic) =>
              updateBloodPressure(systolic, vitals.bloodPressure?.diastolic || 0)
            }
            placeholder="120"
            min={80}
            max={250}
            style={[
              styles.bpInput,
              errors?.bloodPressure && styles.inputError
            ]}
          />
          <Text style={styles.bpSeparator}>/</Text>
          <NumericInput
            value={vitals.bloodPressure?.diastolic}
            onChangeValue={(diastolic) =>
              updateBloodPressure(vitals.bloodPressure?.systolic || 0, diastolic)
            }
            placeholder="80"
            min={40}
            max={150}
            style={[
              styles.bpInput,
              errors?.bloodPressure && styles.inputError
            ]}
          />
          <Text style={styles.unit}>mmHg</Text>
          {vitals.bloodPressure?.systolic && vitals.bloodPressure?.diastolic && (
            <VitalStatusIndicator
              value={{
                systolic: vitals.bloodPressure.systolic,
                diastolic: vitals.bloodPressure.diastolic
              }}
              type="bloodPressure"
              style={styles.statusIndicator}
            />
          )}
        </View>
        <ValidationMessage message={errors?.bloodPressure} />
      </View>

      {/* Similar patterns for pulse, respirations, etc. */}
    </View>
  );
};
```

### Hooks and Services

**Visit Documentation Hook:**
```typescript
import { useState, useEffect, useCallback } from 'react';
import { useOfflineStorage } from './useOfflineStorage';
import { visitAPI } from '../services/api';

interface UseVisitDocumentationReturn {
  documentation: VisitDocumentation;
  updateDocumentation: (updates: Partial<VisitDocumentation>) => void;
  saveDocumentation: (doc: VisitDocumentation, autoSave?: boolean, location?: GPSCoordinates) => Promise<void>;
  isLoading: boolean;
  validationErrors: ValidationErrors;
  hasUnsavedChanges: boolean;
}

export const useVisitDocumentation = (visitId: string): UseVisitDocumentationReturn => {
  const [documentation, setDocumentation] = useState<VisitDocumentation>({});
  const [isLoading, setIsLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [lastSaved, setLastSaved] = useState<VisitDocumentation>({});

  const { saveOffline, getOffline, isOnline } = useOfflineStorage();

  // Load existing documentation
  useEffect(() => {
    loadDocumentation();
  }, [visitId]);

  const loadDocumentation = async () => {
    setIsLoading(true);
    try {
      // Try to load from server first
      if (isOnline) {
        const response = await visitAPI.getDocumentation(visitId);
        setDocumentation(response.documentation);
        setLastSaved(response.documentation);
      } else {
        // Load from offline storage
        const offlineDoc = await getOffline(`visit_${visitId}`);
        if (offlineDoc) {
          setDocumentation(offlineDoc);
          setLastSaved(offlineDoc);
        }
      }
    } catch (error) {
      console.error('Failed to load documentation:', error);
      // Try offline fallback
      const offlineDoc = await getOffline(`visit_${visitId}`);
      if (offlineDoc) {
        setDocumentation(offlineDoc);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const updateDocumentation = useCallback((updates: Partial<VisitDocumentation>) => {
    setDocumentation(prev => {
      const updated = { ...prev, ...updates, updatedAt: new Date() };

      // Check for changes
      setHasUnsavedChanges(JSON.stringify(updated) !== JSON.stringify(lastSaved));

      // Validate
      setValidationErrors(validateDocumentation(updated));

      return updated;
    });
  }, [lastSaved]);

  const saveDocumentation = async (
    doc: VisitDocumentation,
    autoSave: boolean = false,
    location?: GPSCoordinates
  ) => {
    setIsLoading(true);

    try {
      // Always save offline first
      await saveOffline(`visit_${visitId}`, doc);

      // Try to save online if connected
      if (isOnline) {
        await visitAPI.updateDocumentation(visitId, {
          documentation: doc,
          autoSave,
          location
        });
        setLastSaved(doc);
        setHasUnsavedChanges(false);
      }

      // If offline, add to sync queue
      if (!isOnline) {
        await queueForSync({
          visitId,
          documentation: doc,
          location,
          timestamp: new Date()
        });
      }
    } catch (error) {
      console.error('Save failed:', error);
      // Even if online save fails, offline save succeeded
      if (!autoSave) {
        throw error;
      }
    } finally {
      setIsLoading(false);
    }
  };

  return {
    documentation,
    updateDocumentation,
    saveDocumentation,
    isLoading,
    validationErrors,
    hasUnsavedChanges
  };
};
```

---

## Performance Optimization

### Memory Management
```typescript
// Image optimization for medical photos
class ImageOptimizer {
  static async optimizeForUpload(imageUri: string): Promise<string> {
    const { width, height } = await getImageDimensions(imageUri);

    // Resize if too large while maintaining medical quality
    const maxDimension = 1920; // Sufficient for medical documentation
    const scaleFactor = Math.min(maxDimension / width, maxDimension / height);

    if (scaleFactor < 1) {
      return await resizeImage(imageUri, {
        width: Math.round(width * scaleFactor),
        height: Math.round(height * scaleFactor),
        quality: 0.85, // High quality for medical images
        format: 'jpeg'
      });
    }

    return imageUri;
  }

  static async generateThumbnail(imageUri: string): Promise<string> {
    return await resizeImage(imageUri, {
      width: 200,
      height: 200,
      quality: 0.7,
      format: 'jpeg'
    });
  }
}

// Memory-efficient list rendering
const PatientList: React.FC = () => {
  const renderPatientItem = useCallback(({ item, index }: ListRenderItemInfo<Patient>) => (
    <PatientCard
      key={`${item.id}_${item.updatedAt}`} // Prevent unnecessary re-renders
      patient={item}
      onPress={() => navigateToPatient(item.id)}
    />
  ), []);

  const getItemLayout = useCallback((data: Patient[] | null | undefined, index: number) => ({
    length: 120, // Fixed height for performance
    offset: 120 * index,
    index,
  }), []);

  return (
    <FlatList
      data={patients}
      renderItem={renderPatientItem}
      getItemLayout={getItemLayout}
      keyExtractor={(item) => item.id}
      removeClippedSubviews={true}
      maxToRenderPerBatch={10}
      windowSize={10}
      initialNumToRender={8}
      updateCellsBatchingPeriod={50}
    />
  );
};
```

### Battery Optimization
```typescript
// Location services optimization
class LocationManager {
  private watchId: number | null = null;
  private lastKnownLocation: GPSCoordinates | null = null;
  private locationUpdateInterval: number = 30000; // 30 seconds default

  startLocationTracking(visitId: string) {
    // Use different accuracy based on context
    const options: PositionOptions = {
      enableHighAccuracy: false, // Save battery during normal operation
      timeout: 10000,
      maximumAge: 30000 // Use cached location if recent
    };

    this.watchId = navigator.geolocation.watchPosition(
      (position) => this.handleLocationUpdate(position, visitId),
      (error) => this.handleLocationError(error),
      options
    );
  }

  // High accuracy only for check-in/check-out
  async getCurrentLocationHighAccuracy(): Promise<GPSCoordinates> {
    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (position) => resolve(this.formatCoordinates(position)),
        reject,
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 5000
        }
      );
    });
  }

  stopLocationTracking() {
    if (this.watchId) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
  }
}

// Background task management
class BackgroundTaskManager {
  static async registerBackgroundSync() {
    if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
      const registration = await navigator.serviceWorker.ready;
      await registration.sync.register('visit-sync');
    }
  }

  static async scheduleOfflineSync() {
    // iOS: Use background app refresh
    if (Platform.OS === 'ios') {
      BackgroundTask.start({
        taskName: 'visitSync',
        taskDesc: 'Sync visit data when connected',
      });
    }

    // Android: Use foreground service for active visits
    if (Platform.OS === 'android') {
      await BackgroundJob.start({
        jobKey: 'visitSync',
        period: 15000, // 15 seconds
      });
    }
  }
}
```

---

## Testing Implementation

### Unit Tests
```typescript
// Jest tests for visit documentation
describe('VisitDocumentationScreen', () => {
  const mockVisitId = 'test-visit-123';
  const mockPatientId = 'test-patient-456';

  beforeEach(() => {
    jest.clearAllMocks();
    (useVisitDocumentation as jest.Mock).mockReturnValue({
      documentation: mockDocumentation,
      updateDocumentation: jest.fn(),
      saveDocumentation: jest.fn(),
      isLoading: false,
      validationErrors: {}
    });
  });

  it('should render all vital signs inputs', () => {
    const { getByText, getByPlaceholderText } = render(
      <VisitDocumentationScreen
        route={{ params: { visitId: mockVisitId, patientId: mockPatientId } }}
        navigation={mockNavigation}
      />
    );

    expect(getByText('Vital Signs')).toBeTruthy();
    expect(getByPlaceholderText('98.6')).toBeTruthy();
    expect(getByPlaceholderText('120')).toBeTruthy();
  });

  it('should validate required fields', async () => {
    const mockUpdateDocumentation = jest.fn();
    (useVisitDocumentation as jest.Mock).mockReturnValue({
      documentation: {},
      updateDocumentation: mockUpdateDocumentation,
      validationErrors: { temperature: 'Temperature is required' }
    });

    const { getByText } = render(
      <VisitDocumentationScreen
        route={{ params: { visitId: mockVisitId, patientId: mockPatientId } }}
        navigation={mockNavigation}
      />
    );

    expect(getByText('Temperature is required')).toBeTruthy();
  });

  it('should auto-save documentation changes', async () => {
    const mockSaveDocumentation = jest.fn();
    (useVisitDocumentation as jest.Mock).mockReturnValue({
      documentation: mockDocumentation,
      updateDocumentation: jest.fn(),
      saveDocumentation: mockSaveDocumentation,
      isLoading: false,
      validationErrors: {}
    });

    render(
      <VisitDocumentationScreen
        route={{ params: { visitId: mockVisitId, patientId: mockPatientId } }}
        navigation={mockNavigation}
      />
    );

    // Auto-save should be called after delay
    await waitFor(() => {
      expect(mockSaveDocumentation).toHaveBeenCalledWith(
        mockDocumentation,
        true // auto-save flag
      );
    }, { timeout: 3000 });
  });
});

// API integration tests
describe('VisitAPI', () => {
  beforeEach(() => {
    fetchMock.resetMocks();
  });

  it('should sync offline documentation', async () => {
    const mockOperations: SyncOperation[] = [{
      id: 'op1',
      type: 'UPDATE',
      entity: 'visit',
      data: { visitId: 'test-123', documentation: mockDocumentation },
      timestamp: new Date(),
      retryCount: 0
    }];

    fetchMock.mockResponseOnce(JSON.stringify({
      success: true,
      conflicts: []
    }));

    const result = await visitAPI.syncOfflineData(mockOperations);

    expect(result.success).toBe(true);
    expect(fetchMock).toHaveBeenCalledWith('/api/sync/visits', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ operations: mockOperations })
    });
  });
});
```

### Integration Tests
```typescript
// E2E tests with Detox
describe('Visit Documentation Flow', () => {
  beforeAll(async () => {
    await device.reloadReactNative();
  });

  beforeEach(async () => {
    await device.resetStorageAndCache();
  });

  it('should complete full visit documentation flow', async () => {
    // Login
    await element(by.id('login-biometric-button')).tap();
    await waitFor(element(by.text('Today\'s Schedule'))).toBeVisible();

    // Select patient visit
    await element(by.text('Margaret Thompson, 78')).tap();
    await element(by.text('Start Visit')).tap();

    // Enter vital signs
    await element(by.id('temperature-input')).typeText('98.6');
    await element(by.id('bp-systolic-input')).typeText('120');
    await element(by.id('bp-diastolic-input')).typeText('80');
    await element(by.id('pulse-input')).typeText('72');

    // Navigate to next section
    await element(by.text('Next')).tap();

    // Complete assessment
    await element(by.text('Independent')).tap();
    await element(by.id('pain-scale-2')).tap();

    // Continue through remaining sections
    await element(by.text('Next')).tap();
    await element(by.text('Next')).tap();
    await element(by.text('Next')).tap();

    // Complete visit
    await element(by.id('signature-pad')).longPress();
    await element(by.text('Complete Visit')).tap();

    // Verify success
    await waitFor(element(by.text('Visit Completed!'))).toBeVisible();
    await expect(element(by.text('Time saved today: 8 minutes'))).toBeVisible();
  });

  it('should work offline', async () => {
    // Disable network
    await device.setNetworkConnection(false);

    // Complete visit documentation
    await element(by.id('login-biometric-button')).tap();
    await element(by.text('Margaret Thompson, 78')).tap();
    await element(by.text('Start Visit')).tap();

    // Verify offline indicator
    await expect(element(by.text('🟠 Offline'))).toBeVisible();

    // Enter documentation
    await element(by.id('temperature-input')).typeText('98.6');
    await element(by.text('Complete Visit')).tap();

    // Verify offline save
    await expect(element(by.text('Saved offline - will sync when connected'))).toBeVisible();

    // Re-enable network
    await device.setNetworkConnection(true);

    // Verify sync
    await waitFor(element(by.text('🟢 Online'))).toBeVisible();
    await waitFor(element(by.text('Synced successfully'))).toBeVisible();
  });
});
```

---

*This implementation guide provides developers with comprehensive specifications, code examples, and testing strategies to build the Mobile Point-of-Care Documentation feature according to BerthCare's design system and healthcare requirements.*