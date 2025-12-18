/**
 * Firebase Emulator Setup for Integration Tests
 * 
 * This file provides utilities for connecting to Firebase Emulator Suite
 * during integration testing. Based on Firebase official documentation:
 * https://firebase.google.com/docs/emulator-suite/connect_and_prototype
 * 
 * Usage:
 * - Call connectToEmulators() in test setup to connect to local emulators
 * - Call disconnectFromEmulators() in test teardown to cleanup
 * - Use EMULATOR_CONFIG to access emulator ports and settings
 */

import { Firestore, connectFirestoreEmulator } from '@angular/fire/firestore';
import { FirebaseStorage, connectStorageEmulator } from '@angular/fire/storage';

/**
 * Firebase Emulator Configuration
 * Matches settings in firebase.json
 */
export const EMULATOR_CONFIG = {
  projectId: 'demo-gighub-test',
  firestore: {
    host: '127.0.0.1',
    port: 8080
  },
  storage: {
    host: '127.0.0.1',
    port: 9199
  },
  ui: {
    enabled: true,
    port: 4000
  }
} as const;

/**
 * Connect Firestore to local emulator
 * 
 * @param firestore - Firestore instance from Angular Fire
 * @returns void
 * 
 * @example
 * ```typescript
 * const firestore = inject(Firestore);
 * connectFirestoreToEmulator(firestore);
 * ```
 */
export function connectFirestoreToEmulator(firestore: Firestore): void {
  try {
    connectFirestoreEmulator(
      firestore,
      EMULATOR_CONFIG.firestore.host,
      EMULATOR_CONFIG.firestore.port
    );
    console.log('[Test] Connected to Firestore Emulator:', 
      `${EMULATOR_CONFIG.firestore.host}:${EMULATOR_CONFIG.firestore.port}`);
  } catch (error) {
    // Emulator might already be connected, ignore error
    console.warn('[Test] Firestore Emulator connection warning:', error);
  }
}

/**
 * Connect Storage to local emulator
 * 
 * @param storage - Firebase Storage instance from Angular Fire
 * @returns void
 * 
 * @example
 * ```typescript
 * const storage = inject(Storage);
 * connectStorageToEmulator(storage);
 * ```
 */
export function connectStorageToEmulator(storage: FirebaseStorage): void {
  try {
    connectStorageEmulator(
      storage,
      EMULATOR_CONFIG.storage.host,
      EMULATOR_CONFIG.storage.port
    );
    console.log('[Test] Connected to Storage Emulator:', 
      `${EMULATOR_CONFIG.storage.host}:${EMULATOR_CONFIG.storage.port}`);
  } catch (error) {
    // Emulator might already be connected, ignore error
    console.warn('[Test] Storage Emulator connection warning:', error);
  }
}

/**
 * Connect all Firebase services to emulators
 * Call this in test setup (beforeEach or beforeAll)
 * 
 * @param firestore - Firestore instance
 * @param storage - Storage instance (optional)
 * @returns void
 */
export function connectToEmulators(
  firestore: Firestore,
  storage?: FirebaseStorage
): void {
  connectFirestoreToEmulator(firestore);
  
  if (storage) {
    connectStorageToEmulator(storage);
  }
  
  console.log('[Test] All Firebase emulators connected');
}

/**
 * Disconnect from emulators
 * Call this in test teardown (afterEach or afterAll)
 * 
 * Note: Firebase SDK doesn't provide explicit disconnect method
 * This is a placeholder for future cleanup if needed
 */
export function disconnectFromEmulators(): void {
  console.log('[Test] Firebase emulator connections cleanup completed');
}

/**
 * Check if code is running in test environment
 * Useful for conditional emulator connection
 * 
 * @returns boolean - true if running in test environment
 */
export function isTestEnvironment(): boolean {
  return typeof jasmine !== 'undefined' || typeof jest !== 'undefined';
}

/**
 * Get emulator URL for Firestore
 * Useful for debugging and logging
 * 
 * @returns string - Full emulator URL
 */
export function getFirestoreEmulatorUrl(): string {
  return `http://${EMULATOR_CONFIG.firestore.host}:${EMULATOR_CONFIG.firestore.port}`;
}

/**
 * Get emulator URL for Storage
 * Useful for debugging and logging
 * 
 * @returns string - Full emulator URL
 */
export function getStorageEmulatorUrl(): string {
  return `http://${EMULATOR_CONFIG.storage.host}:${EMULATOR_CONFIG.storage.port}`;
}

/**
 * Get emulator UI URL
 * Useful for opening emulator UI in tests
 * 
 * @returns string - Full emulator UI URL
 */
export function getEmulatorUIUrl(): string {
  return `http://127.0.0.1:${EMULATOR_CONFIG.ui.port}`;
}
