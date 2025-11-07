import { initializeApp } from "firebase/app"
import { getAuth, GoogleAuthProvider } from "firebase/auth"
import { getFirestore } from "firebase/firestore"
import { getMessaging, isSupported } from "firebase/messaging"

console.log(" Initializing Firebase...")

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

let app
let auth
let db
let googleProvider
let messaging

try {
  app = initializeApp(firebaseConfig)

  auth = getAuth(app)
  db = getFirestore(app)
  googleProvider = new GoogleAuthProvider()
  googleProvider.setCustomParameters({
    prompt: 'select_account'
  })

  isSupported().then((supported) => {
    if (supported) {
      messaging = getMessaging(app)
      console.log(" Firebase Messaging initialized successfully")
    } else {
      console.warn(" Firebase Messaging not supported in this browser")
    }
  }).catch((error) => {
    console.error(" Firebase Messaging initialization error:", error)
  })

  console.log(" Firebase initialized successfully")
  console.log(" Project ID:", firebaseConfig.projectId)
  console.log(" Using imgbb.com for image storage and Firebase Cloud Messaging for notifications")
} catch (error) {
  console.error(" Firebase initialization error:", error)
  throw new Error("Failed to initialize Firebase. Please check your configuration.")
}

export { auth, db, googleProvider, messaging }
export default app
