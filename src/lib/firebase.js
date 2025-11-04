import { initializeApp } from "firebase/app"
import { getAuth, GoogleAuthProvider } from "firebase/auth"
import { getFirestore } from "firebase/firestore"
import { getMessaging, isSupported } from "firebase/messaging"

console.log(" Initializing Firebase...")

const firebaseConfig = {
  apiKey: "AIzaSyC7tLtNF1mxFSlFiLOckwTcVV9qK8BF38Q",
  authDomain: "all-vip-courses.firebaseapp.com",
  projectId: "all-vip-courses",
  storageBucket: "all-vip-courses.firebasestorage.app",
  messagingSenderId: "637350756869",
  appId: "1:637350756869:web:325f4f0836727d44c5126c",
  measurementId: "G-XJBJ81F4K9"
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
