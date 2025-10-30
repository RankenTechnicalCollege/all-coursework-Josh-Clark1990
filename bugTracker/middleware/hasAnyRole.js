export const hasAnyRole = (allowedRoles) => {
  return (req, res, next) => {
    // Get user roles
    const userRoles = req.user.userRoles || [];  // Changed to userRoles

    if (!Array.isArray(userRoles) || userRoles.length === 0) {
      return res.status(403).json({ error: 'No roles assigned to user' });
    }

    // Convert allowedRoles to array if it's a string
    const rolesArray = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

    // Check if the user has any of the allowed roles
    const hasAllowedRole = userRoles.some(role => rolesArray.includes(role));

    if (!hasAllowedRole) {
      return res.status(403).json({ 
        error: `Access denied. Required role(s): ${rolesArray.join(', ')}. Your role: ${userRoles.join(', ')}` 
      });
    }

    next();
  };
};