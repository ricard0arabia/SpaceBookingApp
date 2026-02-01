import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { userRepository } from "../repositories/userRepository.js";

passport.serializeUser((user, done) => {
  done(null, (user as { userId: number }).userId);
});

passport.deserializeUser(async (id: number, done) => {
  try {
    const user = await userRepository.findById(id);
    done(null, user ?? null);
  } catch (error) {
    done(error as Error, null);
  }
});

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
      callbackURL: process.env.GOOGLE_CALLBACK_URL ?? "http://localhost:4000/auth/google/callback"
    },
    async (_accessToken, _refreshToken, profile, done) => {
      try {
        const user = await userRepository.findOrCreateGoogleUser({
          googleId: profile.id,
          email: profile.emails?.[0]?.value ?? null,
          name: profile.displayName
        });
        done(null, user);
      } catch (error) {
        done(error as Error, null);
      }
    }
  )
);

export default passport;
