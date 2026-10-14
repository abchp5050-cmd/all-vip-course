import { initializeApp } from "firebase/app"
import { getAuth, GoogleAuthProvider } from "firebase/auth"
import { getFirestore } from "firebase/firestore"
import { getMessaging, isSupported } from "firebase/messaging"

console.log(" Initializing Firebase...")

const firebaseConfig = {
  apiKey: "AIzaSyBcpwkIYw3EdSkcPlXwjNxIg0zYg_lsOf4",
  authDomain: "all-vip-2c6de.firebaseapp.com",
  projectId: "all-vip-2c6de",
  storageBucket: "all-vip-2c6de.firebasestorage.app",
  messagingSenderId: "449861479970",
  appId: "1:449861479970:web:167773229b6f2cfcb6247b",
  measurementId: "G-QQDGPW8SM2"
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
