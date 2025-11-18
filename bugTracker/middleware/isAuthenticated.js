import { auth, mongoClient } from './auth.js';

export async function isAuthenticated(req, res, next) {
  try {
    // If session already attached by global middleware
    if (req.session && req.session.user) {
      if (req.user && req.user.userRoles && req.user.userRoles.length > 0) {
        return next();
      }

      // Fetch role from MongoDB directly
      const sessionUser = req.session.user;
      const db = mongoClient.db();
      const user = await db.collection('user').findOne({ id: sessionUser.id });

      req.user = {
        id: sessionUser.id,
        email: sessionUser.email,
        name: sessionUser.name,
        userRoles: user?.role ? [user.role] : ['developer'] // Use default if none
      };

      return next();
    }

    // Read token from cookie
    const token = req.cookies['better-auth.session_token'];
    if (!token) {
      return res.status(401).json({
        error: 'Unauthenticated',
        message: 'You must be logged in to continue'
      });
    }

    // Validate session from database
    const db = mongoClient.db();
    const dbSession = await db.collection('session').findOne({ token: token });
    
    if (!dbSession) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid session'
      });
    }
    
    // Check if session is expired
    const isExpired = new Date() > new Date(dbSession.expiresAt);
    
    if (isExpired) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Session has expired'
      });
    }

    // Get user
    const user = await db.collection('user').findOne({ id: dbSession.userId });
    
    if (!user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'User not found'
      });
    }

    const userRole = user.role || 'developer';

    req.user = {
      id: user.id,
      email: user.email,
      name: user.name,
      userRoles: [userRole]
    };

    req.session = {
      session: dbSession,
      user: user
    };

    next();
  } catch (err) {
    console.error('isAuthenticated error:', err);
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Session validation failed'
    });
  }
}