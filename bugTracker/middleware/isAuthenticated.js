import { auth } from './auth.js';

export async function isAuthenticated(req, res, next) {
  try {
    console.log('\n=== Auth Debug Info ===');
    console.log('1. Request headers:', req.headers);
    console.log('2. Cookies received:', req.cookies);

    // If session already attached by any previous middleware
    if (req.session && req.session.user) {
      console.log('3. Session already attached on req');
      const sessionUser = req.session.user;

      req.user = {
        id: sessionUser.id,
        email: sessionUser.email,
        name: sessionUser.name,
        userRoles: sessionUser.role ? [sessionUser.role] : []
      };

      console.log('=== End Debug Info ===\n');
      return next();
    }

    // Read token from cookie
    const token = req.cookies['better-auth.session_token'];
    if (!token) {
      console.log('3. No session token found in cookies');
      console.log('=== End Debug Info ===\n');
      return res.status(401).json({
        error: 'Unauthenticated',
        message: 'You must be logged in to continue'
      });
    }

    console.log('3. Session token found:', token.substring(0, 10) + '...');

    // Attempt to fetch session using getSessionByToken
    console.log('4. Attempting to get session via auth.api.getSessionByToken()...');
    let session;
    try {
      session = await auth.api.getSessionByToken(token);
      console.log('5. Direct API call result:', session && session.user ? 'Session found' : 'No session');
    } catch (error) {
      console.error('6. Session retrieval error (auth.api.getSessionByToken):', error);
    }

    if (!session || !session.user) {
      console.log('7. No valid session found');
      console.log('=== End Debug Info ===\n');
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid or expired session'
      });
    }

    const sessionUser = session.user;

    // Attach user info for downstream routes
    req.user = {
      id: sessionUser.id,
      email: sessionUser.email,
      name: sessionUser.name,
      userRoles: sessionUser.role ? [sessionUser.role] : []
    };

    req.session = session;

    console.log('8. Session successfully attached to req');
    console.log('=== End Debug Info ===\n');

    next();
  } catch (err) {
    console.error('isAuthenticated error:', err);
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid or expired session'
    });
  }
}
