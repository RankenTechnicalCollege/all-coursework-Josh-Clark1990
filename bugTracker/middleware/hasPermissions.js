import { getDb } from "../database.js";

/**
 * Middleware to check if user has required permission
 * @param {string} permission - required permission
 */
export const hasPermissions = (permission) => {
  return async (req, res, next) => {
    try {
      // Get user roles
      const userRoles = req.user.userRoles || [];

      if (!Array.isArray(userRoles) || userRoles.length === 0) {
        return res.status(403).json({ error: 'No roles assigned to user' });
      }

      // Get database instance
      const db = await getDb();

      // Query for role documents
      const roleDocuments = await db.collection('Role').find({ role: { $in: userRoles } }).toArray();

      // Check if any of the user's roles have the required permission
      const hasRequiredPermission = roleDocuments.some(roleDoc => {
        return roleDoc.permissions && roleDoc.permissions[permission] === true;
      });

      if (!hasRequiredPermission) {
        return res.status(403).json({ error: `Permission denied. Required permission: ${permission}` });
      }
      
      next();
    } catch (error) {
      console.error('Permission check error:', error);
      return res.status(500).json({ error: 'Error checking permissions' });
    }
  };
};