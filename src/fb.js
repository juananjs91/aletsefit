// Puente con Firebase: cuentas (Authentication) y datos en la nube (Firestore).
import { initializeApp } from 'firebase/app';
import {
  initializeAuth, getAuth, indexedDBLocalPersistence, browserLocalPersistence,
  createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut,
  sendPasswordResetEmail, onAuthStateChanged, updateProfile, deleteUser,
  EmailAuthProvider, reauthenticateWithCredential
} from 'firebase/auth';
import {
  getFirestore, doc, getDoc, setDoc, updateDoc, deleteDoc, collection, addDoc,
  query, orderBy, where, onSnapshot, getDocs, serverTimestamp, writeBatch
} from 'firebase/firestore';

let app, auth, db;
function init(config) {
  app = initializeApp(config);
  try { auth = initializeAuth(app, { persistence: [indexedDBLocalPersistence, browserLocalPersistence] }); }
  catch (e) { auth = getAuth(app); }
  db = getFirestore(app);
  return true;
}
window.FB = {
  init,
  get auth() { return auth; }, get db() { return db; },
  createUserWithEmailAndPassword: (e, p) => createUserWithEmailAndPassword(auth, e, p),
  signInWithEmailAndPassword: (e, p) => signInWithEmailAndPassword(auth, e, p),
  signOut: () => signOut(auth),
  sendPasswordResetEmail: (e) => sendPasswordResetEmail(auth, e),
  onAuthStateChanged: (cb) => onAuthStateChanged(auth, cb),
  updateProfile, deleteUser, EmailAuthProvider, reauthenticateWithCredential,
  doc: (...p) => doc(db, ...p), collection: (...p) => collection(db, ...p),
  getDoc, setDoc, updateDoc, deleteDoc, addDoc, query, orderBy, where, onSnapshot, getDocs,
  serverTimestamp, batch: () => writeBatch(db)
};
