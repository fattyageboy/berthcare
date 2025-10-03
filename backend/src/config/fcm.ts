/**
 * Firebase Cloud Messaging Configuration
 * Initializes Firebase Admin SDK for push notifications
 */

import * as admin from 'firebase-admin';
import { logger } from '../shared/utils/logger';

let firebaseApp: admin.app.App | null = null;

/**
 * Initialize Firebase Admin SDK
 * Requires FCM_SERVICE_ACCOUNT_KEY environment variable with JSON service account key
 */
export function initializeFirebase(): admin.app.App {
  if (firebaseApp) {
    return firebaseApp;
  }

  try {
    const serviceAccountKey = process.env.FCM_SERVICE_ACCOUNT_KEY;

    if (!serviceAccountKey) {
      logger.warn('FCM_SERVICE_ACCOUNT_KEY not configured. Push notifications will be disabled.');
      throw new Error('FCM not configured');
    }

    // Parse service account key from environment variable
    const serviceAccount = JSON.parse(serviceAccountKey) as admin.ServiceAccount;

    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });

    logger.info('Firebase Admin SDK initialized successfully');
    return firebaseApp;
  } catch (error: unknown) {
    logger.error('Failed to initialize Firebase Admin SDK:', error);
    throw error;
  }
}

/**
 * Get Firebase Messaging instance
 */
export function getMessaging(): admin.messaging.Messaging {
  if (!firebaseApp) {
    initializeFirebase();
  }

  if (!firebaseApp) {
    throw new Error('Firebase not initialized');
  }

  return admin.messaging(firebaseApp);
}

/**
 * Check if FCM is configured and available
 */
export function isFCMConfigured(): boolean {
  return !!process.env.FCM_SERVICE_ACCOUNT_KEY;
}
