const bcrypt = require('bcryptjs');
const AuthService = require('../auth/auth-service');

async function requireAuth(req, res, next) {
  // get authorization off request header
  const authToken = req.get('Authorization') || '';

  let basicToken;

  // check for authorization starting with basic
  if (!authToken.toLowerCase().startsWith('basic ')) {
    return res.status(401).json({ error: 'Missing basic token' });
  } else {
    // if it does, slice basic off so we get user:password
    basicToken = authToken.slice('basic '.length, authToken.length);
  }

  // then parse user:password from base64 encoding back to readable
  const [tokenUserName, tokenPassword] = AuthService.parseBasicToken(
    basicToken
  );

  // if either side user:password turns our empty, deny request
  if (!tokenUserName || !tokenPassword) {
    return res.status(401).json({ error: 'Unauthorized request' });
  }

  try {
    // then make sure the user: exists in db
    const user = await AuthService.getUserWithUserName(
      req.app.get('db'),
      tokenUserName
    );

    // if the user is empty, deny request
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized request' });
    }

    // comapre password using bcrypt, if no match, deny request
    const passwordMatch = await AuthService.comparePasswords(
      tokenPassword,
      user.password
    );
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Unauthorized request' });
    }

    // otherwise put the user on the req object and call next()
    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
}

module.exports = {
  requireAuth
};
