import { getDb } from "../database.js";

/**
 * Middleware to check if user has required permission
 * @param {string} permission - required permission
 */

export const hasPermissions = (permission) => {
  return async (req, res, next) => {
    try{
        //get user roles
        const userRoles = req.user.userRoles || [];

        if (!Array.isArray(userRoles) || userRoles.length === 0){
          return res.status(403).json({ error: 'No roles assigned to user'});
        }

        //get database instance
        const db = await getDb();

        const roleDocuments = await db.collection('role').find({name: { $in: userRoles}}).toArray()

        //check if any of the users roles require permission
        const hasRequiredPermission = roleDocuments.some(roleDoc => {
          return roleDoc.permissions && roleDoc.permissions[permission] === true;
        });  

        if(!hasRequiredPermission) {
          return res.status(403).json ({ error: `Permission denied. Required permission: ${permission}`});
        }
        next();
    }catch{
      console.error('Permission check error:', error);
    return res.status(500).json({ error: 'Error checking permissions'});
    }
}};