// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getDatabase } from "firebase/database";
import { ref, set, get, child, onValue, update, remove } from 'firebase/database'

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyByhKS6s-Equs5dg5nFuMcQu2wG-yax3So",
  authDomain: "ahhsignalingservice.firebaseapp.com",
  databaseURL: "https://ahhsignalingservice-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "ahhsignalingservice",
  storageBucket: "ahhsignalingservice.firebasestorage.app",
  messagingSenderId: "769043400862",
  appId: "1:769043400862:web:82f7cb7fd46014e9a0538f",
  measurementId: "G-MXM0JDBXTV"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

const rtdb = getDatabase(app);

function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString() // 100000-999999
}

export async function createSession(): Promise<string> {
  // Try to avoid collisions by ensuring the code is unused
  let code = generateCode()
  const sessionsRef = ref(rtdb, 'sessions')
  let tries = 0
  while (tries < 5) {
    const snap = await get(child(sessionsRef, code))
    if (!snap.exists()) break
    code = generateCode()
    tries++
  }
  await set(child(sessionsRef, code), {
    createdAt: Date.now(),
    // placeholders; you can fill these as WebRTC signaling progresses
    offer: null,
    answer: null,
    candidates: {
      caller: [],
      callee: [],
    },
    status: 'waiting', // waiting | connected | closed
  })
  return code
}

export async function joinSession(code: string): Promise<boolean> {
  const sessionRef = ref(rtdb, `sessions/${code}`)
  const snap = await get(sessionRef)
  if (!snap.exists()) return false
  await update(sessionRef, { joinedAt: Date.now(), status: 'connecting' })
  return true
}
// Write signaling data
export async function setOffer(code: string, offer: any) {
  await update(ref(rtdb, `sessions/${code}`), { offer })
}

export async function setAnswer(code: string, answer: any) {
  await update(ref(rtdb, `sessions/${code}`), { answer, status: 'connected' })
}

export async function addIceCandidate(code: string, role: 'caller' | 'callee', candidate: any) {
  const key = `sessions/${code}/candidates/${role}`
  const listRef = ref(rtdb, key)
  // push-like behavior by fetching and appending
  const snap = await get(listRef)
  const list = snap.exists() ? (snap.val() as any[]) : []
  list.push(candidate)
  await set(listRef, list)
}

// Listen for updates (e.g., callee listens for offer, caller listens for answer)
export function onOffer(code: string, cb: (offer: any | null) => void) {
  return onValue(ref(rtdb, `sessions/${code}/offer`), (snap) => cb(snap.val()))
}

export function onAnswer(code: string, cb: (answer: any | null) => void) {
  return onValue(ref(rtdb, `sessions/${code}/answer`), (snap) => cb(snap.val()))
}

export function onCandidates(code: string, role: 'caller' | 'callee', cb: (cands: any[]) => void) {
  return onValue(ref(rtdb, `sessions/${code}/candidates/${role}`), (snap) => cb(snap.val() || []))
}

export async function closeSession(code: string) {
  await update(ref(rtdb, `sessions/${code}`), { status: 'closed', closedAt: Date.now() })
  // optional: remove after some delay or via a Cloud Function TTL
}

export async function deleteSession(code: string) {
  await remove(ref(rtdb, `sessions/${code}`))
}

