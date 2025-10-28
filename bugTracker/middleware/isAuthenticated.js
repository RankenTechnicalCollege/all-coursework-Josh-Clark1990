import { auth } from './auth.js';

export async function isAuthenticated(req, res, next) {
  try {
    // Read token from cookie
    const token = req.cookies['better-auth.session_token'];
    if (!token) {
      return res.status(401).json({
        error: 'Unauthenticated',
        message: 'You must be logged in to continue'
      });
    }

    // Get session using token
    const session = await auth.api.getSession({
      headers: {
        Authorization: `Bearer ${token}`
      }
    });


    if (!session || !session.user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid or expired session'
      });
    }

    const sessionUser = session.user;

    // Attach user info to req for downstream middleware
    req.user = {
      id: sessionUser.id,
      email: sessionUser.email,
      name: sessionUser.name,
      userRoles: sessionUser.role ? [sessionUser.role] : []
    };

    req.session = session;

    next();
  } catch (err) {
    console.error('isAuthenticated error:', err);
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid or expired session'
    });
  }
}
