import admin from 'firebase-admin';

let initialized = false;

export function initializeFirebaseAdmin() {
  if (initialized) {
    return admin;
  }

  try {
    // Check if FIREBASE_SERVICE_ACCOUNT_KEY environment variable exists
    const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    
    if (serviceAccountKey) {
      // Parse the JSON service account key
      const serviceAccount = JSON.parse(serviceAccountKey);
      
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: `https://${serviceAccount.project_id}.firebaseio.com`
      });
      
      console.log('✅ Firebase Admin initialized successfully');
      initialized = true;
    } else {
      console.warn('⚠️ FIREBASE_SERVICE_ACCOUNT_KEY not found. Admin features will not work.');
      console.warn('To fix: Add your Firebase service account JSON as FIREBASE_SERVICE_ACCOUNT_KEY environment variable');
    }
  } catch (error) {
    console.error('❌ Error initializing Firebase Admin:', error.message);
  }

  return admin;
}

export function getFirestoreDb() {
  if (!initialized) {
    return null;
  }
  return admin.firestore();
}
