export const hasRole = (requiredRole) => {
  return (req, res, next) => {
    console.log('\n=== Role Check Debug ===');
    console.log('1. Required role:', requiredRole);
    console.log('2. User object:', req.user);
    console.log('3. User roles:', req.user?.userRoles);
    
    if (!req.user) {
      console.log('4. ❌ No user found on request');
      console.log('=== End Role Check ===\n');
      return res.status(401).json({ error: 'Unauthorized - No user found' });
    }

    if (!req.user.userRoles || !Array.isArray(req.user.userRoles)) {
      console.log('4. ❌ User has no roles array');
      console.log('=== End Role Check ===\n');
      return res.status(403).json({ 
        error: 'Forbidden - No roles assigned',
        userRoles: req.user.userRoles 
      });
    }

    // Check if user has the required role
    if (!req.user.userRoles.includes(requiredRole)) {
      console.log('4. ❌ User does not have required role');
      console.log('=== End Role Check ===\n');
      return res.status(403).json({ 
        error: 'Forbidden - Insufficient permissions',
        required: requiredRole,
        actual: req.user.userRoles 
      });
    }

    console.log('4. ✅ Role check passed');
    console.log('=== End Role Check ===\n');
    next();
  };
};