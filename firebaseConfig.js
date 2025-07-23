import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: "AIzaSyBX3rQZdMQ84QLarLBy2IxPclRgU2unpMk",
  authDomain: "employeetracker-79da8.firebaseapp.com",
  projectId: "employeetracker-79da8",
  storageBucket: "employeetracker-79da8.firebasestorage.app",
  messagingSenderId: "27137603042",
  appId: "1:27137603042:web:b58e19a0034a9626fdb5bb",
  measurementId: "G-7PKBNG7DPX"
};

const app = initializeApp(firebaseConfig);

export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage)
});

export const db = getFirestore(app);