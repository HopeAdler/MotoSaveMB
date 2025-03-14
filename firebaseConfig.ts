import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const {EXPO_PUBLIC_API_KEY, EXPO_PUBLIC_PROJECT_ID, EXPO_PUBLIC_STORAGE_BUCKET, EXPO_PUBLIC_APP_ID} = process.env

const firebaseConfig = {
    apiKey: EXPO_PUBLIC_API_KEY,
    projectId: EXPO_PUBLIC_PROJECT_ID,
    storageBucket: EXPO_PUBLIC_STORAGE_BUCKET,
    appId: EXPO_PUBLIC_APP_ID,
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);