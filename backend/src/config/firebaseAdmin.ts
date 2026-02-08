import admin from "firebase-admin";
import { logger } from "../utils/logger.js";

let initialized = false;

const initFirebaseAdmin = () => {
  if (initialized) {
    return;
  }

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!projectId || !clientEmail || !privateKey) {
    logger.warn("Firebase Admin credentials are not fully configured.");
    return;
  }

  admin.initializeApp({
    credential: admin.credential.cert({
      projectId,
      clientEmail,
      privateKey
    })
  });
  initialized = true;
};

initFirebaseAdmin();

export const firebaseAdmin = admin;
export const isFirebaseAdminReady = () => initialized;
