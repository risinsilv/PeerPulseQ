// Copy this file to `src/lib/firebase.ts` and fill in your Firebase config.
// Keep `src/lib/firebase.ts` out of Git (add to .gitignore) to avoid syncing secrets.

import { initializeApp } from 'firebase/app'
import type { FirebaseApp } from 'firebase/app'
import { getDatabase, ref, set, update, get, onValue, push, remove, serverTimestamp } from 'firebase/database'
import type { Database } from 'firebase/database'

// Vite env variables: create .env.local with the following keys
// VITE_FIREBASE_API_KEY=...
// VITE_FIREBASE_AUTH_DOMAIN=...
// VITE_FIREBASE_DB_URL=...
// VITE_FIREBASE_PROJECT_ID=...
// VITE_FIREBASE_STORAGE=...
// VITE_FIREBASE_SENDER_ID=...
// VITE_FIREBASE_APP_ID=...

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DB_URL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE,
  messagingSenderId: import.meta.env.VITE_FIREBASE_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

let app: FirebaseApp | undefined
let db: Database | undefined

function ensureDb(): Database {
  if (!app) app = initializeApp(firebaseConfig)
  if (!db) db = getDatabase(app)
  return db!
}

function sessionsRef(code: string) {
  const d = ensureDb()
  return ref(d, `sessions/${code}`)
}

export async function createSession(): Promise<string> {
  const d = ensureDb()
  const code = String(Math.floor(100000 + Math.random() * 900000))
  await set(ref(d, `sessions/${code}`), {
    createdAt: serverTimestamp(),
    offer: null,
    answer: null,
    candidates: { caller: null, callee: null },
  })
  return code
}

export async function joinSession(code: string): Promise<boolean> {
  const snap = await get(sessionsRef(code))
  return snap.exists()
}

export async function setOffer(code: string, offer: RTCSessionDescriptionInit): Promise<void> {
  await set(ref(ensureDb(), `sessions/${code}/offer`), offer)
}

export async function setAnswer(code: string, answer: RTCSessionDescriptionInit): Promise<void> {
  await set(ref(ensureDb(), `sessions/${code}/answer`), answer)
}

export async function addIceCandidate(code: string, role: 'caller' | 'callee', candidate: RTCIceCandidateInit): Promise<void> {
  const r = ref(ensureDb(), `sessions/${code}/candidates/${role}`)
  await push(r, candidate)
}

export function onOffer(code: string, cb: (offer: RTCSessionDescriptionInit | null) => void): () => void {
  const r = ref(ensureDb(), `sessions/${code}/offer`)
  const unsubscribe = onValue(r, (snap) => cb(snap.val() || null))
  return () => unsubscribe()
}

export function onAnswer(code: string, cb: (answer: RTCSessionDescriptionInit | null) => void): () => void {
  const r = ref(ensureDb(), `sessions/${code}/answer`)
  const unsubscribe = onValue(r, (snap) => cb(snap.val() || null))
  return () => unsubscribe()
}

export function onCandidates(code: string, role: 'caller' | 'callee', cb: (cands: RTCIceCandidateInit[]) => void): () => void {
  const r = ref(ensureDb(), `sessions/${code}/candidates/${role}`)
  const unsubscribe = onValue(r, (snap) => {
    const val = snap.val() as Record<string, RTCIceCandidateInit> | null
    cb(val ? Object.values(val) : [])
  })
  return () => unsubscribe()
}

export async function closeSession(code: string): Promise<void> {
  await update(sessionsRef(code), { closedAt: serverTimestamp() })
}

export async function deleteSession(code: string): Promise<void> {
  await remove(sessionsRef(code))
}
