import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, collection, onSnapshot, updateDoc, getDocFromServer } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { QRISSettings, Product, Order, User } from '../types';

export const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

// Test Firestore connectivity safely
export async function testFirestoreConnection() {
  try {
    await getDocFromServer(doc(db, 'settings', 'qris_config'));
    console.log('Firestore connected successfully.');
  } catch (error: any) {
    if (error?.message?.includes('offline')) {
      console.warn('Firestore client is offline, using cached/local fallback.');
    }
  }
}

// Sync and persist QRIS Settings to Cloud Firestore
export async function saveQrisSettingsToCloud(settings: QRISSettings) {
  try {
    const ref = doc(db, 'settings', 'qris_config');
    await setDoc(ref, {
      ...settings,
      updatedAt: new Date().toISOString(),
    }, { merge: true });
    return true;
  } catch (err) {
    console.warn('Could not save QRIS to Firestore:', err);
    return false;
  }
}

// Listen to QRIS Settings in real-time
export function subscribeToQrisSettings(callback: (settings: QRISSettings) => void) {
  try {
    const ref = doc(db, 'settings', 'qris_config');
    return onSnapshot(ref, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data() as QRISSettings;
        callback(data);
      }
    }, (err) => {
      console.warn('QRIS listener error:', err);
    });
  } catch (err) {
    console.warn('Error subscribing to QRIS:', err);
    return () => {};
  }
}

// Save Order to Firestore
export async function saveOrderToCloud(order: Order) {
  try {
    const ref = doc(db, 'orders', order.id);
    await setDoc(ref, {
      ...order,
      syncedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.warn('Failed to sync order to Cloud Firestore:', err);
  }
}
