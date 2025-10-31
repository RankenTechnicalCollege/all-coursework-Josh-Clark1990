import { auth } from './auth.js';
import { getDb } from './db.js'; // Your MongoDB connection
import { ObjectId } from 'mongodb';

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
        userRoles: sessionUser.role ? [sessionUser.role] : []  // userRoles (plural) to match hasPermissions
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

    // Manually validate session from database
    console.log('4. Validating session from database...');
    const db = await getDb();
    const dbSession = await db.collection('session').findOne({ token: token });

    console.log('5. Database session found:', dbSession ? 'Yes' : 'No');
    
    if (!dbSession) {
      console.log('6. Session not found in database');
      console.log('=== End Debug Info ===\n');
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid session'
      });
    }

    console.log('6. DB Session user ID:', dbSession.userId);
    console.log('7. DB Session expires:', dbSession.expiresAt);
    
    // Check if session is expired
    const isExpired = new Date() > new Date(dbSession.expiresAt);
    console.log('8. Is session expired?', isExpired);
    
    if (isExpired) {
      console.log('9. Session has expired');
      console.log('=== End Debug Info ===\n');
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Session has expired'
      });
    }

    // Fetch user from database
    const user = await db.collection('user').findOne({ 
      _id: new ObjectId(dbSession.userId) 
    });

    if (!user) {
      console.log('9. User not found for session');
      console.log('=== End Debug Info ===\n');
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'User not found'
      });
    }

    const userRole = user.role || 'user';

    // Attach user info for downstream routes
    req.user = {
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      userRoles: [userRole] 
    };

    req.session = {
      session: dbSession,
      user: user
    };

    console.log('10. ✅ Session successfully validated');
    console.log('11. User ID:', req.user.id);
    console.log('12. User email:', req.user.email);
    console.log('13. User roles:', req.user.userRoles);
    console.log('=== End Debug Info ===\n');

    next();
  } catch (err) {
    console.error('isAuthenticated error:', err);
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Session validation failed'
    });
  }
}