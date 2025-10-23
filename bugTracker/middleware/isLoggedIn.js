import { getAuth } from './auth.js';

export async function isLoggedIn(req, res, next) {
  try {
    const auth = getAuth(); // safely get initialized auth instance
    const user = await auth.getUserFromRequest(req);

    if (!user) {
      return res.status(401).json({ message: 'Please log in to continue' });
    }

    req.user = user; // attach user to request
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid token, please log in again' });
  }
}