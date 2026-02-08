import { initializeAppCheck, ReCaptchaV3Provider, getToken, type AppCheck } from "firebase/app-check";
import { firebaseAuth } from "./firebase";

let appCheck: AppCheck | null = null;

export const initFirebaseAppCheck = () => {
  const siteKey = import.meta.env.VITE_FIREBASE_RECAPTCHA_V3_SITE_KEY;
  if (!siteKey || appCheck) {
    return;
  }

  appCheck = initializeAppCheck(firebaseAuth.app, {
    provider: new ReCaptchaV3Provider(siteKey),
    isTokenAutoRefreshEnabled: true
  });
};

export const getFirebaseAppCheckToken = async () => {
  if (!appCheck) {
    return null;
  }
  const result = await getToken(appCheck, false);
  return result.token;
};
