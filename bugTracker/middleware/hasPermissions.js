import { getDb } from "../database.js";

/**
 * Middleware to check if user has required permission
 * @param {string} permission - required permission
 */
export const hasPermissions = (permission) => {
  return async (req, res, next) => {
    try {
      // Get user role (singular - from Better Auth)
      const userRole = req.user?.role;

      if (!userRole) {
        return res.status(403).json({ error: 'No role assigned to user' });
      }

      // Get database instance
      const db = await getDb();

      // Query for the role document
      const roleDocument = await db.collection('Role').findOne({ role: userRole });

      if (!roleDocument) {
        return res.status(403).json({ error: `Role '${userRole}' not found in database` });
      }

      // Check if the role has the required permission
      const hasRequiredPermission = roleDocument.permissions && roleDocument.permissions[permission] === true;

      if (!hasRequiredPermission) {
        return res.status(403).json({ 
          error: `Permission denied. Required permission: ${permission}`,
          userRole: userRole,
          availablePermissions: roleDocument.permissions ? Object.keys(roleDocument.permissions).filter(p => roleDocument.permissions[p]) : []
        });
      }
      
      next();
    } catch (error) {
      console.error('Permission check error:', error);
      return res.status(500).json({ error: 'Error checking permissions' });
    }
  };
};