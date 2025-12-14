import { initializeApp } from 'firebase/app'
import { getAnalytics, isSupported, Analytics } from 'firebase/analytics'

// Firebase configuration provided by user
const firebaseConfig = {
  apiKey: 'AIzaSyByhKS6s-Equs5dg5nFuMcQu2wG-yax3So',
  authDomain: 'ahhsignalingservice.firebaseapp.com',
  projectId: 'ahhsignalingservice',
  storageBucket: 'ahhsignalingservice.firebasestorage.app',
  messagingSenderId: '769043400862',
  appId: '1:769043400862:web:82f7cb7fd46014e9a0538f',
  measurementId: 'G-MXM0JDBXTV',
}

// Initialize Firebase App
export const app = initializeApp(firebaseConfig)

// Initialize Analytics only in supported browser environments
let analyticsInstance: Analytics | undefined

if (typeof window !== 'undefined') {
  // `isSupported` prevents errors in non-browser or unsupported contexts
  isSupported()
    .then((supported) => {
      if (supported) {
        analyticsInstance = getAnalytics(app)
      }
    })
    .catch(() => {
      // Fail silently if analytics isn't supported
    })
}

export const analytics = analyticsInstance
