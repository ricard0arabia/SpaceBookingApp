import crypto from "crypto";

const ARGON2_UNAVAILABLE = "ARGON2_UNAVAILABLE";

const scryptHash = async (password: string) => {
  const salt = crypto.randomBytes(16).toString("hex");
  const key = await new Promise<Buffer>((resolve, reject) => {
    crypto.scrypt(password, salt, 64, { N: 16384, r: 8, p: 1 }, (error, derivedKey) => {
      if (error) {
        reject(error);
        return;
      }
      resolve(derivedKey);
    });
  });
  return `scrypt$${salt}$${key.toString("hex")}`;
};

const scryptVerify = async (password: string, hash: string) => {
  const [, salt, expected] = hash.split("$");
  if (!salt || !expected) {
    return false;
  }
  const key = await new Promise<Buffer>((resolve, reject) => {
    crypto.scrypt(password, salt, 64, { N: 16384, r: 8, p: 1 }, (error, derivedKey) => {
      if (error) {
        reject(error);
        return;
      }
      resolve(derivedKey);
    });
  });
  return crypto.timingSafeEqual(Buffer.from(expected, "hex"), key);
};

const loadArgon2 = async () => {
  try {
    const mod = await import("argon2");
    return mod;
  } catch {
    throw new Error(ARGON2_UNAVAILABLE);
  }
};

export const hashPassword = async (password: string) => {
  try {
    const argon2 = await loadArgon2();
    return argon2.hash(password, {
      type: argon2.argon2id,
      memoryCost: 19456,
      timeCost: 2,
      parallelism: 1
    });
  } catch (error) {
    if ((error as Error).message !== ARGON2_UNAVAILABLE) {
      throw error;
    }
    return scryptHash(password);
  }
};

export const verifyPassword = async (password: string, hash: string) => {
  if (hash.startsWith("$argon2")) {
    const argon2 = await loadArgon2();
    return argon2.verify(hash, password);
  }
  if (hash.startsWith("scrypt$")) {
    return scryptVerify(password, hash);
  }
  return false;
};

export const needsRehash = (hash: string) => hash.startsWith("scrypt$");
