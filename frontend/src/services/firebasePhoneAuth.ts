import { RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";
import { firebaseAuth } from "../config/firebase";

let recaptchaVerifier: RecaptchaVerifier | null = null;

const getVerifier = () => {
  if (!recaptchaVerifier) {
    recaptchaVerifier = new RecaptchaVerifier(firebaseAuth, "firebase-recaptcha", {
      size: "normal"
    });
  }
  return recaptchaVerifier;
};

export const sendPhoneOtp = async (phone: string) => {
  const confirmation = await signInWithPhoneNumber(firebaseAuth, phone, getVerifier());
  return confirmation;
};

export const confirmPhoneOtpAndGetIdToken = async (verificationCode: string, confirmation: Awaited<ReturnType<typeof sendPhoneOtp>>) => {
  const credential = await confirmation.confirm(verificationCode);
  return credential.user.getIdToken(true);
};
