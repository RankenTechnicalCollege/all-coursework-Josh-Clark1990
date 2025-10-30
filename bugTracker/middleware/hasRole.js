export const hasRole = (requiredRole) => {
  return (req, res, next) => {
    const userRoles = req.user.userRoles || [];  // Changed to userRoles
    
    if (!Array.isArray(userRoles) || userRoles.length === 0) {
      return res.status(403).json({ error: 'No roles assigned to user' });
    }
    
    // User must have exactly one role and it must match requiredRole
    if (userRoles.length !== 1 || userRoles[0] !== requiredRole) {
      return res.status(403).json({ 
        error: `Access denied. Required role: ${requiredRole}. Your role: ${userRoles[0]}` 
      });
    }
    
    next();
  };
};