/**
 * Middleware to check if the user has the required role to perform said action
 * @param {string|string[]} allowedRoles}
 * @note this middleware assumes that req.user.role contains user role
 * @note hasRole is a factory function because it needs to accept parameters
 * @returns {function} express middleware function
 */

/**
 * Middleware to check if the user has exactly the required role
 * @param {string} requiredRole
 * @returns {function} express middleware function
 */
export const hasRole = (requiredRole) => {
  return (req, res, next) => {
    const userRoles = req.user.role || [];
    if (!Array.isArray(userRoles) || userRoles.length === 0) {
      return res.status(403).json({ error: 'No roles assigned to user' });
    }
    // User must have exactly one role and it must match requiredRole
    if (userRoles.length !== 1 || userRoles[0] !== requiredRole) {
      return res.status(403).json({ error: `Access denied. Required role: ${requiredRole}` });
    }
    next();
  };
};