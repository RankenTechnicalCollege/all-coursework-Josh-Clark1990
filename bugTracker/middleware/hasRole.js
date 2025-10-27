/**
 * Middleware to check if the user has the required role to perform said action
 * @param {string|string[]} allowedRoles}
 * @note this middleware assumes that req.user.role contains user role
 * @note hasRole is a factory function because it needs to accept parameters
 * @returns {function} express middleware function
 */

export const hasRole = (allowedRoles) => {
  return (req, res, next) =>{

    //Get the user roles
    const userRoles = req.user.role || [];

    if(!Array.isArray(userRoles) || user.Roles.length === 0){
      return res.status(403).json( {error: 'No roles assigned to user'});
    }
    //Convert allowedRoles to array if it's a string
    const rolesArray = Array.isArray(allowedRoles) ? allowedRoles: [allowedRoles];

    //Check if the user has any of the allowed roles
    const hasAllowedRole = user.Roles.some(role => rolesArray.includes(role)); //returns a boolean 

    if(!hasAllowedRole){
      return res.status(403).json( {error: `Access denied. Required role(s): ${rolesArray.join(',')}`
    })
    
  };
}};