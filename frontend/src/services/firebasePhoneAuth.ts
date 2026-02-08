import { RecaptchaVerifier, signInWithPhoneNumber, type ConfirmationResult } from "firebase/auth";
import { firebaseAuth } from "../config/firebase";

let recaptchaVerifier: RecaptchaVerifier | null = null;
let currentContainerId: string | null = null;

const createVerifier = async (containerId: string) => {
  if (recaptchaVerifier && currentContainerId !== containerId) {
    recaptchaVerifier.clear();
    recaptchaVerifier = null;
  }

  if (!recaptchaVerifier) {
    recaptchaVerifier = new RecaptchaVerifier(firebaseAuth, containerId, {
      size: "normal"
    });
    currentContainerId = containerId;
    await recaptchaVerifier.render();
  }

  return recaptchaVerifier;
};

export const sendPhoneOtp = async (phone: string, containerId: string): Promise<ConfirmationResult> => {
  const verifier = await createVerifier(containerId);
  return signInWithPhoneNumber(firebaseAuth, phone, verifier);
};

export const clearPhoneVerifier = () => {
  if (recaptchaVerifier) {
    recaptchaVerifier.clear();
    recaptchaVerifier = null;
    currentContainerId = null;
  }
};

export const confirmPhoneOtpAndGetIdToken = async (verificationCode: string, confirmation: ConfirmationResult) => {
  const credential = await confirmation.confirm(verificationCode);
  return credential.user.getIdToken(true);
};
