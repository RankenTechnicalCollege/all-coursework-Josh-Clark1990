export const hasAnyRole = (allowedRoles) => {
  return (req, res, next) => {

    //get user roles
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