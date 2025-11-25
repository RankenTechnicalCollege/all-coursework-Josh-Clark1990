import { auth, mongoClient } from './auth.js';
import { ObjectId } from 'mongodb';

export async function isAuthenticated(req, res, next) {
  console.log('=== isAuthenticated middleware START ===');

  try {
    // Check if session already attached
    console.log('Checking req.session:', !!req.session);
    console.log('Checking req.session.user:', !!req.session?.user);
    
    if (req.session && req.session.user) {
  console.log('Using existing session from req.session');
  
  // ALWAYS fetch fresh role from database, don't trust cached session
  const sessionUser = req.session.user;
  const db = mongoClient.db();
  
  const userId = sessionUser._id || sessionUser.id;
  const userIdToQuery = userId instanceof ObjectId ? userId : new ObjectId(userId);
  
  console.log('Fetching fresh user with _id:', userIdToQuery);
  const user = await db.collection('user').findOne({ _id: userIdToQuery });
  console.log('User fetched from DB:', user ? user.email : 'NOT FOUND');
  console.log('Fresh role from DB:', user?.role);

  req.user = {
    id: userId.toString(),
    email: sessionUser.email || user?.email,
    name: sessionUser.name || user?.name,
    role: user?.role || 'developer'  // Use fresh role from DB
  };
  
  console.log('req.user set with FRESH role:', req.user);
  return next();
}

    // Check for cookie token
    console.log('No req.session, checking cookie');
    console.log('Cookies available:', Object.keys(req.cookies || {}));
    
    const token = req.cookies['better-auth.session_token'];
    console.log('Session token found:', !!token);
    
    if (!token) {
      console.log('No token, returning 401');
      return res.status(401).json({
        error: 'Unauthenticated',
        message: 'You must be logged in to continue'
      });
    }

    // Validate session from database
    console.log('Validating token from database');
    const db = mongoClient.db();
    const dbSession = await db.collection('session').findOne({ token: token });
    
    console.log('dbSession found:', !!dbSession);
    console.log('dbSession.userId:', dbSession?.userId);
    
    if (!dbSession) {
      console.log('No session in DB, returning 401');
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid session'
      });
    }
    
    // Check if session is expired
    const isExpired = new Date() > new Date(dbSession.expiresAt);
    console.log('Session expired?', isExpired);
    
    if (isExpired) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Session has expired'
      });
    }

    // Get user
    console.log('Fetching user with _id:', dbSession.userId);
    const user = await db.collection('user').findOne({ 
      _id: dbSession.userId
    });
    
    console.log('User found:', user ? user.email : 'NOT FOUND');
    console.log('User role from DB:', user?.role);
    
    if (!user) {
      console.log('User not found, returning 401');
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'User not found'
      });
    }

    const userRole = user.role || 'developer';

    req.user = {
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      role: userRole
    };

    req.session = {
      session: dbSession,
      user: user
    };

    console.log('Final req.user:', req.user);
    console.log('=== isAuthenticated middleware END ===');

    next();
  } catch (err) {
    console.error('isAuthenticated ERROR:', err);
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Session validation failed'
    });
  }
}