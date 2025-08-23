import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  connectAuthEmulator,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  onAuthStateChanged
} from 'firebase/auth';
import { 
  getFirestore, 
  connectFirestoreEmulator,
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp
} from 'firebase/firestore';
import { 
  getStorage, 
  connectStorageEmulator,
  ref,
  uploadBytes,
  getDownloadURL
} from 'firebase/storage';
import { getRuntimeConfig } from '../config/runtime-config';

// Get Firebase config from runtime/environment variables
const runtimeConfig = getRuntimeConfig();

const firebaseConfig = {
  apiKey: runtimeConfig.VITE_FIREBASE_API_KEY,
  authDomain: runtimeConfig.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: runtimeConfig.VITE_FIREBASE_PROJECT_ID,
  storageBucket: runtimeConfig.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: runtimeConfig.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: runtimeConfig.VITE_FIREBASE_APP_ID,
};

// Basic validation to ensure config is loaded
if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
  console.error("Firebase config is missing or incomplete. Check your environment variables or runtime configuration.");
  // You might want to throw an error here or handle it gracefully
  // For now, we'll log an error and let the app proceed, which will likely fail at the initializeApp step.
}


// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Connect to emulators in development
if (import.meta.env.DEV && import.meta.env.VITE_USE_FIREBASE_EMULATOR === 'true') {
  connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
  connectFirestoreEmulator(db, 'localhost', 8080);
  connectStorageEmulator(storage, 'localhost', 9199);
}

// Auth helper functions
export const signIn = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return { user: userCredential.user, error: null };
  } catch (error) {
    return { user: null, error };
  }
};

export const signUp = async (email, password, displayName = '', companyName = '') => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Update user profile with display name
    if (displayName) {
      await updateProfile(user, { displayName });
    }
    
    // Create user document in Firestore
    await setDoc(doc(db, 'users', user.uid), {
      email: user.email,
      displayName: displayName || '',
      company: companyName || '',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    return { user, error: null };
  } catch (error) {
    return { user: null, error };
  }
};

export const signOutUser = async () => {
  try {
    await signOut(auth);
    return { error: null };
  } catch (error) {
    return { error };
  }
};

export const resetPassword = async (email) => {
  try {
    await sendPasswordResetEmail(auth, email);
    return { error: null };
  } catch (error) {
    return { error };
  }
};

// Auth state observer
export const onAuthChange = (callback) => {
  return onAuthStateChanged(auth, callback);
};

// Firestore helper functions for deals
export const createDeal = async (dealData) => {
  try {
    const dealsRef = collection(db, 'deals');
    const newDealRef = doc(dealsRef);
    await setDoc(newDealRef, {
      ...dealData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return { id: newDealRef.id, error: null };
  } catch (error) {
    return { id: null, error };
  }
};

export const getDeal = async (dealId) => {
  try {
    const dealDoc = await getDoc(doc(db, 'deals', dealId));
    if (dealDoc.exists()) {
      return { data: { id: dealDoc.id, ...dealDoc.data() }, error: null };
    } else {
      return { data: null, error: new Error('Deal not found') };
    }
  } catch (error) {
    return { data: null, error };
  }
};

export const getUserDeals = async (userId) => {
  try {
    const dealsQuery = query(
      collection(db, 'deals'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(dealsQuery);
    const deals = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return { data: deals, error: null };
  } catch (error) {
    return { data: null, error };
  }
};

// Storage helper functions for file uploads
export const uploadFile = async (file, path) => {
  try {
    const storageRef = ref(storage, path);
    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);
    return { url: downloadURL, error: null };
  } catch (error) {
    return { url: null, error };
  }
};

export default app;