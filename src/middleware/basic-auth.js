const bcrypt = require('bcryptjs');
const AuthService = require('../auth/auth-service');

function requireAuth(req, res, next) {
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

  // then make sure the user: exists in db
  AuthService.getUserWithUserName(req.app.get('db'), tokenUserName).then(
    (user) => {
      // if the user is empty, or the password doesn't match
      // what we have on record, deny request
      if (!user) {
        return res.status(401).json({ error: 'Unauthorized request' });
      }

      return bcrypt
        .compare(tokenPassword, user.password)
        .then((passwordMatch) => {
          if (!passwordMatch) {
            return res.status(401).json({ error: 'Unauthorized request' });
          }
          req.user = user;
          next();
        });
    }
  );
}

module.exports = {
  requireAuth
};
