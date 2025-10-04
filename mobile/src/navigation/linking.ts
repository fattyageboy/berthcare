import { LinkingOptions } from '@react-navigation/native';
import { RootStackParamList } from './types';

/**
 * Deep linking configuration for BerthCare mobile app
 * Supports opening specific screens via URLs
 */
export const linking: LinkingOptions<RootStackParamList> = {
  prefixes: ['berthcare://', 'https://app.berthcare.ca'],
  config: {
    screens: {
      Login: 'login',
      MainTabs: {
        path: 'app',
        screens: {
          Schedule: 'schedule',
          Home: 'home',
        },
      },
      PatientProfile: 'patient/:patientId',
      VisitDocumentation: 'visit/:visitId/document',
      Review: 'visit/:visitId/review',
    },
  },
};

/**
 * Example deep link URLs:
 * - berthcare://login
 * - berthcare://app/schedule
 * - berthcare://patient/123
 * - berthcare://visit/456/document
 * - https://app.berthcare.ca/visit/789/review
 */
