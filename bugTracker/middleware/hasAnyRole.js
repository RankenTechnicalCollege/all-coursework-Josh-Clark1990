export const hasAnyRole = (allowedRoles) => {
  return (req, res, next) => {
    // Get user role - Better Auth 
    const userRole = req.user?.role;

    if (!userRole) {
      return res.status(403).json({ error: 'No role assigned to user' });
    }

    // Convert allowedRoles to array if it's a string
    const rolesArray = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

    // Check if the user's role is in the allowed roles
    const hasAllowedRole = rolesArray.includes(userRole);

    if (!hasAllowedRole) {
      return res.status(403).json({ 
        error: `Access denied. Required role(s): ${rolesArray.join(', ')}. Your role: ${userRole}` 
      });
    }

    next();
  };
};