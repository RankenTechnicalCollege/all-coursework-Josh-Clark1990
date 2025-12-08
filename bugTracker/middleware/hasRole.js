export const hasRole = (requiredRole) => {
  return (req, res, next) => {
    const userRole = req.user?.role;  // Changed variable name to singular
    
    if (!userRole) {  // Check if role exists
      return res.status(403).json({ error: 'No role assigned to user' });
    }
    
    // Check if user's role matches the required role (string comparison)
    if (userRole !== requiredRole) {
      return res.status(403).json({ 
        error: `Access denied. Required role: ${requiredRole}. Your role: ${userRole}` 
      });
    }
    
    next();
  };
};