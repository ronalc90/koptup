import passport from 'passport';
import { Strategy as GoogleStrategy, Profile, VerifyCallback } from 'passport-google-oauth20';
import { logger } from '../utils/logger';

// Initialize passport strategy only if Google OAuth credentials are configured
export const initializePassport = async () => {
  const clientID = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientID || !clientSecret || clientID.includes('tu-google')) {
    logger.warn('Google OAuth not configured - Google auth features disabled');
    return passport;
  }

  try {
    // Lazy load User model to avoid blocking on MongoDB connection
    const User = (await import('../models/User')).default;

    passport.use(
      new GoogleStrategy(
        {
          clientID,
          clientSecret,
          callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3001/api/auth/google/callback',
        },
        async (
          accessToken: string,
          refreshToken: string,
          profile: Profile,
          done: VerifyCallback
        ) => {
          try {
            const email = profile.emails?.[0]?.value;

            if (!email) {
              return done(new Error('No email found in Google profile'), undefined);
            }

            // Check if user exists
            let user = await User.findOne({ email });

            if (user) {
              // Update google_id if not set
              if (!user.google_id) {
                user.google_id = profile.id;
              }

              // Update last login
              user.last_login = new Date();
              await user.save();

              logger.info(`User logged in with Google: ${email}`);
              return done(null, user as any);
            }

            // Create new user
            const name = profile.displayName || email.split('@')[0];
            const avatar = profile.photos?.[0]?.value;

            user = new User({
              email,
              name,
              google_id: profile.id,
              role: 'user',
              provider: 'google',
              avatar,
              last_login: new Date(),
            });

            await user.save();

            logger.info(`New user registered with Google: ${email}`);
            return done(null, user as any);
          } catch (error) {
            logger.error('Google OAuth error:', error);
            return done(error as Error, undefined);
          }
        }
      )
    );

    logger.info('Passport Google OAuth strategy initialized');
  } catch (error: any) {
    logger.warn('Failed to initialize Passport - Google auth features disabled:', error.message);
  }

  return passport;
};

// Serialize user for the session
passport.serializeUser((user: any, done) => {
  done(null, user._id.toString());
});

// Deserialize user from the session
passport.deserializeUser(async (id: string, done) => {
  try {
    // Lazy load User model
    const User = (await import('../models/User')).default;
    const user = await User.findById(id).select('_id email name role');

    if (!user) {
      return done(new Error('User not found'), null);
    }

    done(null, user as any);
  } catch (error) {
    done(error, null);
  }
});

export default passport;
export { passport };
