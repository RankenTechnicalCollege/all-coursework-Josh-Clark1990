import { getDb } from "../database.js";

/**
 * Middleware to check if user has required permission
 * @param {string} permission - required permission
 */

export const hasPermissions = (permission) => {
  return async (req, res, next) => {
    try {
      console.log('\n=== Permission Check Debug ===');
      console.log('1. Checking permission:', permission);
      
      // Get user roles
      const userRoles = req.user.userRoles || [];
      console.log('2. User roles:', userRoles);

      if (!Array.isArray(userRoles) || userRoles.length === 0) {
        console.log('3. No roles assigned');
        return res.status(403).json({ error: 'No roles assigned to user' });
      }

      // Get database instance
      const db = await getDb();
      console.log('3. Connected to database:', db.databaseName);

      // First, let's see what collections exist
      const collections = await db.listCollections().toArray();
      console.log('4. Available collections:', collections.map(c => c.name));

      // Check if Role collection exists and has documents
      const roleCount = await db.collection('Role').countDocuments({});
      console.log('5. Documents in Role collection:', roleCount);

      console.log('6. Querying database for roles:', userRoles);
      const roleDocuments = await db.collection('Role').find({ role: { $in: userRoles } }).toArray();
      
      console.log('7. Role documents found:', roleDocuments.length);
      
      if (roleDocuments.length > 0) {
        console.log('8. Role documents:', JSON.stringify(roleDocuments, null, 2));
      } else {
        // Debug: Let's see ALL roles
        const allRoles = await db.collection('Role').find({}).toArray();
        console.log('8. All roles in database:', allRoles.map(r => r.role));
      }

      // Check if any of the users roles require permission
      const hasRequiredPermission = roleDocuments.some(roleDoc => {
        console.log(`9. Checking role "${roleDoc.role}" permissions:`, roleDoc.permissions);
        const hasIt = roleDoc.permissions && roleDoc.permissions[permission] === true;
        console.log(`10. Role "${roleDoc.role}" has "${permission}":`, hasIt);
        return hasIt;
      });

      console.log('11. Has required permission:', hasRequiredPermission);

      if (!hasRequiredPermission) {
        console.log('12. Permission denied');
        console.log('=== End Permission Check ===\n');
        return res.status(403).json({ error: `Permission denied. Required permission: ${permission}` });
      }
      
      console.log('12. ✅ Permission granted');
      console.log('=== End Permission Check ===\n');
      next();
    } catch (error) {
      console.error('Permission check error:', error);
      return res.status(500).json({ error: 'Error checking permissions' });
    }
  };
};