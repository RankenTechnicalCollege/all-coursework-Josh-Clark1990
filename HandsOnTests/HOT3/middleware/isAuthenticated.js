import { auth } from './auth.js';
import { getDb } from '../database.js';
import { ObjectId } from 'mongodb';

export async function isAuthenticated(req, res, next) {
  try {
    console.log('\n=== Auth Debug Info ===');
    
    // ✅ Use Better Auth's built-in session verification
    const session = await auth.api.getSession({
      headers: req.headers
    });

    console.log('1. Better Auth session result:', session ? 'FOUND' : 'NOT FOUND');

    if (!session || !session.user) {
      console.log('2. ❌ No valid session from Better Auth');
      console.log('=== End Auth Debug ===\n');
      return res.status(401).json({
        error: 'Unauthenticated',
        message: 'You must be logged in to continue'
      });
    }

    console.log('3. User from Better Auth:', session.user.email);
    console.log('4. User role from Better Auth:', session.user.role);

    // ✅ Normalize role(s) to an array and get permissions from roles collection
    const db = await getDb();
    const rawRole = session.user.role;

    // Ensure userRoles is always an array of strings
    const userRoles = Array.isArray(rawRole) ? rawRole : [rawRole || 'user'];

    // Look up the first matching role document (supports multiple roles)
    const roleDoc = await db.collection('roles').findOne({ role: { $in: userRoles } });
    const permissions = roleDoc?.permissions || {};

    console.log('5. Role document found:', roleDoc ? 'YES' : 'NO');
    console.log('6. Permissions:', permissions);

    // ✅ Attach user to request
    req.user = {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
      userRoles: userRoles,
      permissions: permissions,
      role: userRoles
    };

    console.log('7. ✅ Authentication successful');
    console.log('=== End Auth Debug ===\n');

    next();
  } catch (err) {
    console.error('isAuthenticated error:', err);
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Session validation failed'
    });
  }
}