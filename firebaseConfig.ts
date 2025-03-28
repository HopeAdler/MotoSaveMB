import { initializeApp } from 'firebase/app';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
    apiKey: process.env.EXPO_PUBLIC_API_KEY ?? process.env.GOOGLE_SERVICE_JSON,
    projectId: process.env.EXPO_PUBLIC_PROJECT_ID ?? process.env.GOOGLE_SERVICE_JSON,
    storageBucket: process.env.EXPO_PUBLIC_STORAGE_BUCKET ?? process.env.GOOGLE_SERVICE_JSON,
    appId: process.env.EXPO_PUBLIC_APP_ID ?? process.env.GOOGLE_SERVICE_JSON,
};

const app = initializeApp(firebaseConfig);
const storage = getStorage(app);
export { storage, app };